import { AssignmentIdSchema } from '@/@types/users/UserRoleSchema'
import { apiAuthHandler } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'
import { removeRoleAssignment, requireRoleAdminToken } from '@/server/actions/users'
import { ROLE_ADMIN_COOKIE } from '@/constants/auth.constant'

// DELETE -> removes that role assignment in Entra ID
export const DELETE = apiAuthHandler<{ assignmentId: string }>('users.manage', async (req, ctx, user) => {
    const assignmentId = AssignmentIdSchema.parse((await ctx.params).assignmentId)
    const token = await requireRoleAdminToken(req.cookies.get(ROLE_ADMIN_COOKIE)?.value, user)
    await removeRoleAssignment(token, user, assignmentId)
    return getEmptyResponse()
})
