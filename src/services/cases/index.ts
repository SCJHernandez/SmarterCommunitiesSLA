import useSWR, { type SWRConfiguration } from 'swr'
import api, { type ApiOptions } from '@/services/api'
import { type CaseHistoryEntry, type CaseHistoryEntryDto } from '@/@types/cases/CaseHistory'
import { tryParseDate } from '@/utils/parse'

export const getCaseHistoryUrl = (caseId: string) => `/cases/${caseId}/history`

export const ensureCaseHistoryEntry = (entry: CaseHistoryEntryDto): CaseHistoryEntry => ({
    ...entry,
    createdOn: tryParseDate(entry.createdOn) ?? new Date(0),
})

export const apiGetCaseHistory = async (caseId: string, apiOptions?: ApiOptions) =>
    (await api.fetchJson<CaseHistoryEntryDto[]>({ ...apiOptions, method: 'get', url: getCaseHistoryUrl(caseId) })).map(
        ensureCaseHistoryEntry,
    )

export const useSWRCaseHistory = (caseId: string | null | undefined, config?: SWRConfiguration<CaseHistoryEntry[]>) =>
    useSWR(caseId ? getCaseHistoryUrl(caseId) : null, () => apiGetCaseHistory(caseId!), config)
