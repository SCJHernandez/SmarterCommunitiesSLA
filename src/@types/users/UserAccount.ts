import { type RoleName } from '@/@types/auth/Roles'

export type PrincipalType = 'User' | 'Group'

/** A user or group assigned one of this app's roles in Entra ID. */
export interface UserAccount {
    /** Assignment id (a principal can hold several roles) */
    id: string
    principalId: string
    principalType: PrincipalType
    name: string
    email: string | null
    jobTitle: string | null
    role: RoleName
    assignedOn: Date
}

export interface RoleDirectory {
    accounts: UserAccount[]
    /** Where an administrator assigns roles (the app in the Entra admin centre) */
    manageUrl: string | null
    /** Why the list couldn't be read, e.g. a missing Graph permission */
    problem: string | null
    /** The signed-in Admin has enabled role editing (their consent is held for about an hour) */
    canManage: boolean
}

/** Someone in the organisation's directory, found by the people picker. */
export interface DirectoryPerson {
    id: string
    name: string
    email: string | null
    jobTitle: string | null
}
