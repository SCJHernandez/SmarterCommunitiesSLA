import { SearchPeopleSchema } from '@/@types/users/UserRoleSchema'
import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { requireRoleAdminToken, searchPeople } from '@/server/actions/users'
import { ROLE_ADMIN_COOKIE } from '@/constants/auth.constant'

// GET ?q= -> people in the directory (searched as the signed-in Admin)
export const GET = apiAuthHandler('users.manage', async (req, _ctx, user) => {
    const { q } = SearchPeopleSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const token = await requireRoleAdminToken(req.cookies.get(ROLE_ADMIN_COOKIE)?.value, user)
    return getJsonResponse(await searchPeople(token, q))
})
