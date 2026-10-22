'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import UserAvatar from '@/components/shared/UserAvatar'
import SlaPriorityTag from '@/components/sla/SlaPriorityTag'
import SlaStatusTag from '@/components/sla/SlaStatusTag'
import SlaUrgency from '@/components/sla/SlaUrgency'
import { CaseIcon } from '@/configs/icons.config'
import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'
import { type SlaRecordsSortKey, getVisibleSlaRecords, useSlaStore } from '@/stores/SlaStore'
import { formatDateTime } from '@/utils/dates'
import useCaseDetails from '@/utils/hooks/useCaseDetails'

const { THead, TBody, Tr, Th, Td, Sorter } = Table

const PAGE_SIZE = 15

interface SlaRecordsTableProps {
    /** Records in the period that match the filters (useSlaDashboard) */
    records: SlaKpiInstance[]
}

export default function SlaRecordsTable({ records }: SlaRecordsTableProps) {
    const { openCase } = useCaseDetails()
    const filter = useSlaStore((state) => state.filter)
    const order = useSlaStore((state) => state.order)
    const loading = useSlaStore((state) => state.loading)
    const error = useSlaStore((state) => state.error)
    const refresh = useSlaStore((state) => state.refresh)
    const toggleOrder = useSlaStore((state) => state.toggleOrder)
    const resetFilter = useSlaStore((state) => state.resetFilter)
    const [page, setPage] = useState(1)
    const visible = useMemo(() => getVisibleSlaRecords(records, { filter, order }), [records, filter, order])

    // New filters or data may have fewer pages: back to the first (adjusting state while rendering, not in an effect)
    const [pagedRecords, setPagedRecords] = useState(visible)
    if (pagedRecords !== visible) {
        setPagedRecords(visible)
        setPage(1)
    }

    if (loading) return <Loading loading message="Loading SLA records…" />
    if (error) return <ErrorState message={error} onRetry={() => void refresh()} />
    if (!visible.length) {
        return (
            <EmptyState
                icon={CaseIcon}
                title="No SLA records match"
                description="Nothing in the selected period matches these filters. Choose a longer period or clear the filters."
                action={
                    <Button size="sm" variant="default" onClick={() => resetFilter()}>
                        Clear filters
                    </Button>
                }
            />
        )
    }

    const sortable = (key: SlaRecordsSortKey, label: string) => (
        <button type="button" className="inline-flex items-center gap-1 uppercase" onClick={() => toggleOrder(key)}>
            {label}
            <Sorter sort={order.key === key ? order.direction : false} />
        </button>
    )
    const now = new Date()

    return (
        <>
            <p className="mb-2 text-sm text-gray-500">
                {visible.length === records.length
                    ? `${records.length.toLocaleString()} SLA records`
                    : `${visible.length.toLocaleString()} of ${records.length.toLocaleString()} SLA records`}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table hoverable>
                    <THead>
                        <Tr>
                            <Th>{sortable('case', 'Case')}</Th>
                            <Th>{sortable('status', 'SLA status')}</Th>
                            <Th>{sortable('priority', 'Priority')}</Th>
                            <Th>{sortable('owner', 'Owner')}</Th>
                            <Th>{sortable('deadline', 'Deadline')}</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((record) => (
                            <Tr key={record.id} className="cursor-pointer" onClick={() => openCase(record.id)}>
                                <Td>
                                    <button
                                        type="button"
                                        className="text-left font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            openCase(record.id)
                                        }}
                                    >
                                        {record.regardingNumber}
                                    </button>
                                    <div
                                        className="max-w-[260px] truncate text-xs text-gray-500"
                                        title={record.regardingSubject}
                                    >
                                        {record.regardingSubject}
                                    </div>
                                </Td>
                                <Td>
                                    <SlaStatusTag status={record.status} />
                                    <div className="mt-1 whitespace-nowrap text-xs text-gray-500">{record.kpiName}</div>
                                </Td>
                                <Td>
                                    <SlaPriorityTag priority={record.priority} />
                                </Td>
                                <Td>
                                    <span className="flex items-center gap-2 whitespace-nowrap">
                                        <UserAvatar name={record.owner} size={24} />
                                        {record.owner}
                                    </span>
                                </Td>
                                <Td className="whitespace-nowrap">
                                    <div>{formatDateTime(record.failureTime)}</div>
                                    <div className="text-xs">
                                        <SlaUrgency instance={record} now={now} />
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            </div>
            {visible.length > PAGE_SIZE && (
                <div className="mt-4 flex justify-end">
                    <Pagination
                        currentPage={page}
                        pageSize={PAGE_SIZE}
                        total={visible.length}
                        onChange={setPage}
                        displayTotal
                    />
                </div>
            )}
        </>
    )
}
