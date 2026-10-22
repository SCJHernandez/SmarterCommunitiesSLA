import 'server-only'
import { type RoleName, toRoleNames } from '@/@types/auth/Roles'
import { type SessionUser } from '@/@types/auth/SessionUser'
import {
    type DirectoryPerson,
    type PrincipalType,
    type RoleDirectory,
    type UserAccount,
} from '@/@types/users/UserAccount'
import { ConflictError, ForbiddenError, NotFoundError } from '@/@types/errors'
import { assertGuid } from '@/server/data/dataverse'
import { authConfig } from '@/server/data/auth/entra'
import { getRoleAdminToken } from '@/server/data/auth/delegatedTokens'
import { loadCachedPhoto, saveCachedPhoto } from '@/server/data/storage/photoCache'
import { GraphError, graphGet, graphGetAll, graphGetBytes, graphPost, graphRequestAs } from '@/server/data/graph'

// People and their roles in Entra ID (Enterprise applications → this app → Users and groups).
// Reading uses the app-only Graph token. Changing a role uses the signed-in Admin's own token
// (they enable role editing once, consenting to AppRoleAssignment.ReadWrite.All): Entra ID then
// checks *their* rights, so the app itself can't change anyone's access.

interface ServicePrincipal {
    id: string
    appRoles: { id: string; value: string | null }[]
}

interface AppRoleAssignment {
    id: string
    appRoleId: string
    principalId: string
    principalType: string
    principalDisplayName: string | null
    createdDateTime: string
}

interface DirectoryUser {
    id: string
    mail: string | null
    userPrincipalName: string | null
    jobTitle: string | null
}

const PERMISSION_HINT =
    'Give the Graph app registration the Application.Read.All and User.Read.All application permissions (with admin consent) to list who has which role.'

/** Everyone assigned a role in this app, with where to change it. */
export const getRoleDirectory = async (canManage = false): Promise<RoleDirectory> => {
    if (!authConfig.clientId) {
        return {
            accounts: [],
            manageUrl: null,
            problem: 'Sign-in is not configured (AUTH_CLIENT_ID is not set).',
            canManage: false,
        }
    }
    try {
        const { value } = await graphGet<{ value: ServicePrincipal[] }>(
            `/servicePrincipals?$filter=appId eq '${assertGuid(authConfig.clientId, 'client id')}'&$select=id,appRoles`,
        )
        const sp = value[0]
        if (!sp)
            return {
                accounts: [],
                manageUrl: null,
                problem: 'The app registration has no enterprise application.',
                canManage,
            }
        const manageUrl = `https://entra.microsoft.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Users/objectId/${sp.id}/appId/${authConfig.clientId}`

        const roleById = new Map(sp.appRoles.map((r) => [r.id, toRoleNames([r.value])[0]]))
        const assignments = (
            await graphGetAll<AppRoleAssignment>(`/servicePrincipals/${sp.id}/appRoleAssignedTo?$top=999`)
        )
            .map((a) => ({ ...a, role: roleById.get(a.appRoleId) }))
            .filter((a) => a.role && (a.principalType === 'User' || a.principalType === 'Group'))

        const userIds = [...new Set(assignments.filter((a) => a.principalType === 'User').map((a) => a.principalId))]
        const users = new Map<string, DirectoryUser>()
        for (let i = 0; i < userIds.length; i += 1000) {
            const page = await graphPost<{ value: DirectoryUser[] }>('/directoryObjects/getByIds', {
                ids: userIds.slice(i, i + 1000),
                types: ['user'],
            }).catch(() => ({ value: [] as DirectoryUser[] }))
            page.value.forEach((u) => users.set(u.id, u))
        }

        const accounts: UserAccount[] = assignments.map((a) => {
            const user = users.get(a.principalId)
            return {
                id: a.id,
                principalId: a.principalId,
                principalType: a.principalType as PrincipalType,
                name: a.principalDisplayName || 'Unknown',
                email: user?.mail || user?.userPrincipalName || null,
                jobTitle: user?.jobTitle ?? null,
                role: a.role!,
                assignedOn: new Date(a.createdDateTime),
            }
        })
        accounts.sort((a, b) => a.name.localeCompare(b.name))
        return { accounts, manageUrl, problem: null, canManage }
    } catch (error) {
        if (error instanceof GraphError && (error.status === 401 || error.status === 403)) {
            return { accounts: [], manageUrl: null, problem: PERMISSION_HINT, canManage }
        }
        throw error
    }
}

/**
 * A person's Microsoft 365 profile photo, or null (initials are shown). From the cache saved when they
 * signed in; otherwise read with the app token, which needs User.Read.All (application).
 */
export const getUserPhoto = async (userId: string) => {
    const id = assertGuid(userId, 'user id')
    const cached = loadCachedPhoto(id)
    if (cached) return { bytes: cached, contentType: 'image/jpeg' }
    const photo = await graphGetBytes(`/users/${id}/photos/96x96/$value`).catch(() => null)
    if (photo) saveCachedPhoto(id, photo.bytes)
    return photo
}

// ── Changing roles (as the signed-in Admin) ──────────────────────────────────────

/** The Admin's role-editing token, or why there isn't one. */
export const requireRoleAdminToken = async (cookie: string | undefined, user: SessionUser) => {
    const token = await getRoleAdminToken(cookie, user.id)
    if (!token) {
        throw new ForbiddenError(
            "Role editing has expired or isn't enabled yet. Enable it again, then retry.",
            'ROLE_EDITING_NOT_ENABLED',
        )
    }
    return token
}

/** Graph refusals in words an Admin can act on. */
const roleEditingError = (error: unknown) => {
    if (error instanceof GraphError && error.status === 401) {
        // Not a 401: that would send the browser to sign in again, but they're still signed in.
        return new ForbiddenError(
            'Your role-editing permission has expired. Enable it again.',
            'ROLE_EDITING_NOT_ENABLED',
        )
    }
    if (error instanceof GraphError && error.status === 403) {
        return new ForbiddenError(
            "Entra ID didn't allow this. To change roles from here you must be an owner of this app's enterprise application (or a Cloud Application Administrator), and AppRoleAssignment.ReadWrite.All needs admin consent.",
            'ENTRA_FORBIDDEN',
        )
    }
    return error
}

const getServicePrincipalAs = async (token: string) => {
    const found = await graphRequestAs<{ value: ServicePrincipal[] }>(
        token,
        `/servicePrincipals?$filter=appId eq '${assertGuid(authConfig.clientId, 'client id')}'&$select=id,appRoles`,
    )
    const sp = found?.value[0]
    if (!sp) throw new NotFoundError('This app has no enterprise application in Entra ID.')
    return sp
}

const getAssignmentsAs = async (token: string, spId: string) => {
    const all: AppRoleAssignment[] = []
    let next: string | undefined = `/servicePrincipals/${spId}/appRoleAssignedTo?$top=999`
    while (next) {
        const page: { value: AppRoleAssignment[]; '@odata.nextLink'?: string } | null = await graphRequestAs(
            token,
            next,
        )
        all.push(...(page?.value ?? []))
        next = page?.['@odata.nextLink']
    }
    return all
}

const refuseOwnRole = (user: SessionUser, principalId: string) => {
    if (principalId === user.id) {
        throw new ConflictError(
            "You can't change your own role here, so nobody locks themselves out. Ask another Admin, or use Entra ID.",
            'OWN_ROLE',
        )
    }
}

/** People in the directory matching a name or email, for the "Add person" picker. */
export const searchPeople = async (token: string, query: string): Promise<DirectoryPerson[]> => {
    const q = query.replace(/["\\]/g, '').trim()
    const search = encodeURIComponent(`"displayName:${q}" OR "mail:${q}"`)
    try {
        const found = await graphRequestAs<{ value: (DirectoryUser & { displayName: string | null })[] }>(
            token,
            `/users?$search=${search}&$select=id,displayName,mail,userPrincipalName,jobTitle&$top=10`,
            { headers: { ConsistencyLevel: 'eventual' } },
        )
        return (found?.value ?? []).map((u) => ({
            id: u.id,
            name: u.displayName || u.mail || 'Unknown',
            email: u.mail || u.userPrincipalName,
            jobTitle: u.jobTitle,
        }))
    } catch (error) {
        throw roleEditingError(error)
    }
}

/** Gives the person (or group) this role, replacing any other role they have in this app. */
export const setPersonRole = async (token: string, user: SessionUser, principalId: string, role: RoleName) => {
    refuseOwnRole(user, principalId)
    try {
        const sp = await getServicePrincipalAs(token)
        const appRole = sp.appRoles.find((r) => toRoleNames([r.value])[0] === role)
        if (!appRole) throw new NotFoundError(`The app registration has no "${role}" app role. Add it under App roles.`)

        const theirs = (await getAssignmentsAs(token, sp.id)).filter((a) => a.principalId === principalId)
        if (!theirs.some((a) => a.appRoleId === appRole.id)) {
            // Add the new role before removing the old one, so they never lose access in between.
            await graphRequestAs(token, `/servicePrincipals/${sp.id}/appRoleAssignedTo`, {
                method: 'POST',
                body: { principalId, resourceId: sp.id, appRoleId: appRole.id },
            })
        }
        // Only this app's own roles: leave Entra's "Default Access" (created by consent) alone.
        const ownRoleIds = new Set(sp.appRoles.filter((r) => toRoleNames([r.value]).length).map((r) => r.id))
        for (const old of theirs.filter((a) => a.appRoleId !== appRole.id && ownRoleIds.has(a.appRoleId))) {
            await graphRequestAs(token, `/servicePrincipals/${sp.id}/appRoleAssignedTo/${old.id}`, { method: 'DELETE' })
        }
    } catch (error) {
        throw roleEditingError(error)
    }
}

/** Takes away one role assignment (the person loses access if it was their only role). */
export const removeRoleAssignment = async (token: string, user: SessionUser, assignmentId: string) => {
    try {
        const sp = await getServicePrincipalAs(token)
        const assignment = (await getAssignmentsAs(token, sp.id)).find((a) => a.id === assignmentId)
        if (!assignment) throw new NotFoundError('That role assignment no longer exists.')
        refuseOwnRole(user, assignment.principalId)
        await graphRequestAs(token, `/servicePrincipals/${sp.id}/appRoleAssignedTo/${assignmentId}`, {
            method: 'DELETE',
        })
    } catch (error) {
        throw roleEditingError(error)
    }
}
