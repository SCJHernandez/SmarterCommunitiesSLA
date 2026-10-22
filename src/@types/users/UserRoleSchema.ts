import { z } from 'zod'
import { ROLE_NAMES } from '@/@types/auth/Roles'

// Request schemas for changing roles from the app (written to Entra ID as the signed-in Admin).

/** PUT /api/users/roles — give a person (or group) this role, replacing any other role they have */
export const SetUserRoleSchema = z.object({
    principalId: z.string().uuid(),
    role: z.enum(ROLE_NAMES),
})

export type SetUserRoleRequest = z.input<typeof SetUserRoleSchema>

/** GET /api/users/search?q= */
export const SearchPeopleSchema = z.object({
    q: z.string().trim().min(2, 'Type at least 2 characters').max(60),
})

/** Entra ID app role assignment ids (base64url-like) */
export const AssignmentIdSchema = z
    .string()
    .min(10)
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid assignment id')
