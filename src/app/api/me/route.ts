import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'

// GET -> the signed-in user (Microsoft 365 profile and roles)
export const GET = apiAuthHandler('sla.view', async (_req, _ctx, user) => getJsonResponse(user))
