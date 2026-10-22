import { SetUserRoleSchema } from '@/@types/users/UserRoleSchema'
import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'
import { requireRoleAdminToken, setPersonRole } from '@/server/actions/users'
import { ROLE_ADMIN_COOKIE } from '@/constants/auth.constant'

// PUT { principalId, role } -> gives that person (or group) the role, replacing their other role (in Entra ID)
export const PUT = apiAuthHandler('users.manage', async (req, _ctx, user) => {
    const { principalId, role } = SetUserRoleSchema.parse(await readJsonBody(req))
    const token = await requireRoleAdminToken(req.cookies.get(ROLE_ADMIN_COOKIE)?.value, user)
    await setPersonRole(token, user, principalId, role)
    return getEmptyResponse()
})
