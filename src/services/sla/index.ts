import useSWR, { type SWRConfiguration } from 'swr'
import api, { type ApiOptions } from '@/services/api'
import { type Collection } from '@/@types/dynamics/collections'
import { type DateRange } from '@/@types/sla/SlaFilter'
import { type SlaKpiInstance, type SlaKpiInstanceDto } from '@/@types/sla/SlaKpiInstance'
import { tryParseDate } from '@/utils/parse'
import { getSlaPeriod } from '@/utils/sla/slaPeriod'

export const slaKpisUrl = '/sla/kpis'
export const openSlaKpisUrl = '/sla/kpis/open'

/** JSON dates arrive as strings — turn them back into Date objects. */
export const ensureSlaKpiInstance = (dto: SlaKpiInstanceDto): SlaKpiInstance => ({
    ...dto,
    failureTime: tryParseDate(dto.failureTime),
    warningTime: tryParseDate(dto.warningTime),
    succeededOn: tryParseDate(dto.succeededOn),
    pausedOn: tryParseDate(dto.pausedOn),
    createdOn: tryParseDate(dto.createdOn) ?? new Date(0),
    modifiedOn: tryParseDate(dto.modifiedOn) ?? new Date(0),
    isCaseResolved: dto.isCaseResolved ?? false,
    pausedBusinessMinutes: dto.pausedBusinessMinutes ?? undefined,
})

/**
 * SLA KPI instances for the period and the one it's compared with (utils/sla/slaPeriod). The browser works out the
 * dates, so calendar months follow the user's time zone.
 */
export const apiGetSlaKpis = async (range: DateRange, apiOptions?: ApiOptions): Promise<Collection<SlaKpiInstance>> => {
    const period = getSlaPeriod(range)
    const collection = await api.fetchJson<Collection<SlaKpiInstanceDto>>({
        ...apiOptions,
        method: 'get',
        url: slaKpisUrl,
        params: {
            startDate: period.previousStart.toISOString(),
            endDate: period.end.toISOString(),
        },
    })
    return { ...collection, records: collection.records.map(ensureSlaKpiInstance) }
}

/** Open work: SLAs still running, paused or breached on cases that are open now, whenever they were created. */
export const apiGetOpenSlaKpis = async (apiOptions?: ApiOptions): Promise<Collection<SlaKpiInstance>> => {
    const collection = await api.fetchJson<Collection<SlaKpiInstanceDto>>({
        ...apiOptions,
        method: 'get',
        url: openSlaKpisUrl,
    })
    return { ...collection, records: collection.records.map(ensureSlaKpiInstance) }
}

export const useSWROpenSlaKpis = (config?: SWRConfiguration<Collection<SlaKpiInstance>>) =>
    useSWR(openSlaKpisUrl, () => apiGetOpenSlaKpis(), config)

/** Keyed by range (not the exact time), so pages share one cached fetch per range. `null` waits (fetches nothing). */
export const useSWRSlaKpis = (range: DateRange | null, config?: SWRConfiguration<Collection<SlaKpiInstance>>) =>
    useSWR(range ? [slaKpisUrl, range] : null, ([, r]: [string, DateRange]) => apiGetSlaKpis(r), config)
