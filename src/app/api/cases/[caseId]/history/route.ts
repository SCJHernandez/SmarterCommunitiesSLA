import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getCaseHistory } from '@/server/actions/cases'

// GET -> the Case's audit history from Dataverse (who changed what, newest first)
export const GET = apiAuthHandler<{ caseId: string }>('sla.view', async (_req, ctx) => {
    const { caseId } = await ctx.params
    return getJsonResponse(await getCaseHistory(caseId))
})
