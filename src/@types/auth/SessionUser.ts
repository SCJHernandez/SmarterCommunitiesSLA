import { type RoleName } from './Roles'

/** The signed-in user, from their Microsoft 365 account. Kept in the encrypted session cookie. */
export interface SessionUser {
    /** Entra ID object id */
    id: string
    name: string
    email: string
    jobTitle: string | null
    department: string | null
    roles: RoleName[]
}
