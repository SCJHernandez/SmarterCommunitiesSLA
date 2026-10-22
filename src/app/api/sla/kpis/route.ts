import { SlaKpisQuerySchema } from '@/@types/sla/SlaKpisSchema'
import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getSlaKpis } from '@/server/actions/sla'

// GET ?startDate&endDate (ISO) -> SLA KPI instances created in that window, as Collection<SlaKpiInstance>
export const GET = apiAuthHandler('sla.view', async (req) => {
    const { startDate, endDate } = SlaKpisQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    return getJsonResponse(await getSlaKpis(new Date(startDate), new Date(endDate)))
})
