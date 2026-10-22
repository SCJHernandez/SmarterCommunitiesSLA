'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import Tabs from '@/components/ui/Tabs'
import Tag from '@/components/ui/Tag'
import EmptyState from '@/components/shared/EmptyState'
import UserAvatar from '@/components/shared/UserAvatar'
import SlaPriorityTag from '@/components/sla/SlaPriorityTag'
import SlaUrgency from '@/components/sla/SlaUrgency'
import { AtRiskIcon, BreachedIcon, PausedIcon, SuccessIcon, TimeIcon } from '@/configs/icons.config'
import { slaRecordsPath } from '@/configs/app.config'
import { type ActionCategory, type SlaActionRecord } from '@/@types/sla/SlaDashboard'
import { formatDateTime } from '@/utils/dates'
import { getPriorityRank } from '@/utils/sla/priority'
import useCaseDetails from '@/utils/hooks/useCaseDetails'
import type { ElementType } from 'react'

const { THead, TBody, Tr, Th, Td, Sorter } = Table

const PAGE_SIZE = 6

// Tabs in display order; also the fallback order when the active tab empties out
const TABS: { category: ActionCategory; label: string; icon: ElementType }[] = [
    { category: 'BREACHED', label: 'Breached', icon: BreachedIcon },
    { category: 'AT_RISK', label: 'At risk', icon: AtRiskIcon },
    { category: 'ON_TRACK', label: 'On track', icon: TimeIcon },
    { category: 'PAUSED', label: 'Paused', icon: PausedIcon },
]

type SortKey = 'urgency' | 'priority' | 'owner'

interface SlaActionCenterProps {
    records: SlaActionRecord[]
}

/** SLAs on open cases (any creation date) that may need someone to act, most urgent first; one row per case and SLA item. */
export default function SlaActionCenter({ records }: SlaActionCenterProps) {
    const { openCase } = useCaseDetails()
    const [selectedTab, setSelectedTab] = useState<ActionCategory>('BREACHED')
    const [order, setOrder] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
        key: 'urgency',
        direction: 'asc',
    })
    const [page, setPage] = useState(1)

    const counts = useMemo(() => {
        const result: Partial<Record<ActionCategory, number>> = {}
        for (const r of records) result[r.category] = (result[r.category] ?? 0) + 1
        return result
    }, [records])

    // If the chosen tab has emptied (e.g. after filtering), show the first one that has records
    const activeTab = counts[selectedTab]
        ? selectedTab
        : (TABS.find((t) => counts[t.category])?.category ?? selectedTab)

    // New data may have fewer pages: back to the first (adjusting state while rendering, not in an effect)
    const [pagedRecords, setPagedRecords] = useState(records)
    if (pagedRecords !== records) {
        setPagedRecords(records)
        setPage(1)
    }

    const selectTab = (tab: ActionCategory) => {
        setSelectedTab(tab)
        setPage(1)
    }

    const sorted = useMemo(() => {
        const value = (r: SlaActionRecord): string | number =>
            order.key === 'urgency'
                ? r.remainingMinutes
                : order.key === 'priority'
                  ? getPriorityRank(r.instance.priority)
                  : r.instance.owner.toLowerCase()
        const direction = order.direction === 'asc' ? 1 : -1
        return records
            .filter((r) => r.category === activeTab)
            .sort((a, b) => (value(a) > value(b) ? direction : value(a) < value(b) ? -direction : 0))
    }, [records, activeTab, order])

    const toggleOrder = (key: SortKey) =>
        setOrder((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))

    const sortable = (key: SortKey, label: string) => (
        <button type="button" className="inline-flex items-center gap-1 uppercase" onClick={() => toggleOrder(key)}>
            {label}
            <Sorter sort={order.key === key ? order.direction : false} />
        </button>
    )

    const header = {
        content: 'SLA Action Center',
        extra: (
            <Link href={slaRecordsPath} className="text-sm font-semibold text-primary hover:underline">
                All SLA records
            </Link>
        ),
    }

    if (!records.length) {
        return (
            <Card header={header}>
                <EmptyState
                    icon={SuccessIcon}
                    title="You're all caught up"
                    description="No open SLAs need attention for the selected period and filters."
                    className="border-none"
                />
            </Card>
        )
    }

    const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <Card header={header} bodyClass="p-0">
            <Tabs value={activeTab} onChange={(value) => selectTab(value as ActionCategory)}>
                <Tabs.TabList className="overflow-x-auto px-4">
                    {TABS.filter((t) => counts[t.category]).map((t) => (
                        <Tabs.TabNav key={t.category} value={t.category} icon={<t.icon />}>
                            <span className="flex items-center gap-2">
                                {t.label}
                                <Tag className="px-1.5 py-0 text-xs">{counts[t.category]}</Tag>
                            </span>
                        </Tabs.TabNav>
                    ))}
                </Tabs.TabList>
            </Tabs>
            <div className="overflow-x-auto">
                <Table hoverable>
                    <THead>
                        <Tr>
                            <Th>Case</Th>
                            <Th>{sortable('priority', 'Priority')}</Th>
                            <Th>{sortable('owner', 'Owner')}</Th>
                            <Th>{activeTab === 'BREACHED' ? 'Breached' : 'Deadline'}</Th>
                            <Th>{sortable('urgency', 'Urgency')}</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {visible.map((record) => (
                            <Tr
                                key={record.instance.id}
                                className="cursor-pointer"
                                onClick={() => openCase(record.instance.id)}
                            >
                                <Td>
                                    <button
                                        type="button"
                                        className="text-left font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            openCase(record.instance.id)
                                        }}
                                    >
                                        {record.instance.regardingNumber}
                                    </button>
                                    <div
                                        className="max-w-[220px] truncate text-xs text-gray-500"
                                        title={record.instance.regardingSubject}
                                    >
                                        {record.instance.regardingSubject}
                                    </div>
                                </Td>
                                <Td>
                                    <SlaPriorityTag priority={record.instance.priority} />
                                </Td>
                                <Td>
                                    <span className="flex items-center gap-2 whitespace-nowrap">
                                        <UserAvatar name={record.instance.owner} size={24} />
                                        {record.instance.owner}
                                    </span>
                                </Td>
                                <Td className="whitespace-nowrap">{formatDateTime(record.instance.failureTime)}</Td>
                                <Td className="whitespace-nowrap">
                                    <div>
                                        <SlaUrgency instance={record.instance} />
                                    </div>
                                    {record.recommendedAction && (
                                        <div className="text-xs text-gray-500">
                                            Next step: {record.recommendedAction}
                                        </div>
                                    )}
                                    {record.duplicates > 0 && (
                                        <div
                                            className="text-xs text-gray-400"
                                            title="Dynamics re-applied the SLA to this case"
                                        >
                                            +{record.duplicates} earlier SLA{record.duplicates === 1 ? '' : 's'} on this
                                            case
                                        </div>
                                    )}
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            </div>
            {sorted.length > PAGE_SIZE && (
                <div className="flex justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                    <Pagination
                        currentPage={page}
                        pageSize={PAGE_SIZE}
                        total={sorted.length}
                        onChange={setPage}
                        displayTotal
                    />
                </div>
            )}
        </Card>
    )
}
