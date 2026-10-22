import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getOpenSlaKpis } from '@/server/actions/sla'

// GET -> open work: SLAs still running, paused or breached on cases that are open now (any creation date)
export const GET = apiAuthHandler('sla.view', async () => getJsonResponse(await getOpenSlaKpis()))
