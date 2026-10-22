import useSWR, { type SWRConfiguration } from 'swr'
import api, { type ApiOptions } from '@/services/api'
import { apiPath, signInUrl } from '@/configs/app.config'
import { RETURN_TO_URL_KEY } from '@/constants/auth.constant'
import { type DirectoryPerson, type RoleDirectory, type UserAccount } from '@/@types/users/UserAccount'
import { type SetUserRoleRequest } from '@/@types/users/UserRoleSchema'
import { tryParseDate } from '@/utils/parse'

export const usersUrl = '/users'

/** For <img src>: the person's Microsoft 365 photo (404 → show initials). */
export const getUserPhotoUrl = (userId: string) => `${apiPath}${usersUrl}/${userId}/photo`

export const ensureUserAccount = (account: UserAccount): UserAccount => ({
    ...account,
    assignedOn: tryParseDate(account.assignedOn) as Date,
})

export const apiGetRoleDirectory = async (apiOptions?: ApiOptions): Promise<RoleDirectory> => {
    const directory = await api.fetchJson<RoleDirectory>({ ...apiOptions, method: 'get', url: usersUrl })
    return { ...directory, accounts: directory.accounts.map(ensureUserAccount) }
}

export const useSWRRoleDirectory = (config?: SWRConfiguration<RoleDirectory>) =>
    useSWR(usersUrl, () => apiGetRoleDirectory(), config)

/** Full-page link: asks Microsoft for the Admin's consent to change roles, then comes back here. */
export const getEnableRoleEditingUrl = (returnTo: string) =>
    `${signInUrl}?${new URLSearchParams({ [RETURN_TO_URL_KEY]: returnTo, purpose: 'manage-roles' })}`

export const apiSearchPeople = (query: string, apiOptions?: ApiOptions) =>
    api.fetchJson<DirectoryPerson[]>({
        ...apiOptions,
        method: 'get',
        url: `${usersUrl}/search?${new URLSearchParams({ q: query })}`,
    })

/** Gives the person (or group) this role in Entra ID, replacing their other role. */
export const apiSetUserRole = (data: SetUserRoleRequest, apiOptions?: ApiOptions) =>
    api.fetchJson<void>({ ...apiOptions, method: 'put', url: `${usersUrl}/roles`, data })

export const apiRemoveRoleAssignment = (assignmentId: string, apiOptions?: ApiOptions) =>
    api.fetchJson<void>({ ...apiOptions, method: 'delete', url: `${usersUrl}/roles/${assignmentId}` })
