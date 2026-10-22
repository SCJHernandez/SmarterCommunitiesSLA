import { apiHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'

export const GET = apiHandler(async () => getJsonResponse({ status: 'ok', dataverse: !!process.env.DATAVERSE_URL }))
