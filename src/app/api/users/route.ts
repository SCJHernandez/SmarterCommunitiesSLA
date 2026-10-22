import { hasPermission } from '@/@types/auth/Roles'
import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getRoleDirectory } from '@/server/actions/users'
import { getRoleAdminToken } from '@/server/data/auth/delegatedTokens'
import { ROLE_ADMIN_COOKIE } from '@/constants/auth.constant'

// GET -> everyone assigned a role in this app (from Entra ID), and whether this Admin can change roles now
export const GET = apiAuthHandler('users.view', async (req, _ctx, user) => {
    const canManage =
        hasPermission(user.roles, 'users.manage') &&
        !!(await getRoleAdminToken(req.cookies.get(ROLE_ADMIN_COOKIE)?.value, user.id))
    return getJsonResponse(await getRoleDirectory(canManage))
})
