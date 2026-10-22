import { z } from 'zod'

const MAX_SPAN_DAYS = 400

/** GET /api/sla/kpis — SLA KPI instances created in [startDate, endDate) (the browser sends both periods). */
export const SlaKpisQuerySchema = z
    .object({
        startDate: z.string().datetime({ offset: true }),
        endDate: z.string().datetime({ offset: true }),
    })
    .refine((q) => new Date(q.startDate) <= new Date(q.endDate), {
        message: 'startDate must be on or before endDate',
        path: ['startDate'],
    })
    .refine((q) => new Date(q.endDate).getTime() - new Date(q.startDate).getTime() <= MAX_SPAN_DAYS * 86_400_000, {
        message: `The range can be at most ${MAX_SPAN_DAYS} days`,
        path: ['endDate'],
    })

export type SlaKpisQuery = z.input<typeof SlaKpisQuerySchema>
