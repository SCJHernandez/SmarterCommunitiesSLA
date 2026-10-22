'use client'

import { useMemo } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import Switcher from '@/components/ui/Switcher'
import { ClearIcon, SearchIcon } from '@/configs/icons.config'
import { type MonthRange, ROLLING_RANGES, type RollingRange, isMonthRange } from '@/@types/sla/SlaFilter'
import { SLA_STATUS_FILTERS, SLA_STATUS_FILTER_HINTS, type SlaStatusFilter } from '@/@types/sla/SlaStatusOptions'
import { type SlaDashboardData, type SlaFilterOptions } from '@/@types/sla/SlaDashboard'
import { countActiveFilters, useSlaStore } from '@/stores/SlaStore'
import { getPriorityLabel } from '@/utils/sla/priority'
import { getRecentMonths } from '@/utils/sla/slaPeriod'
import classNames from '@/utils/classNames'
import { firstSegmentValue } from '@/utils/segmentValue'

interface Option {
    value: string
    label: string
}

const RANGE_LABELS: Record<RollingRange, string> = {
    Today: '24 hours',
    'Last 7 Days': '7 days',
    'Last 30 Days': '30 days',
    'Last 90 Days': '90 days',
}

const withAll = (
    allLabel: string,
    values: readonly string[],
    label: (value: string) => string = (v) => v,
): Option[] => [{ value: 'All', label: allLabel }, ...values.map((value) => ({ value, label: label(value) }))]

interface FilterSelectProps {
    id: string
    label: string
    value: string
    options: Option[]
    onChange: (value: string) => void
}

function FilterSelect({ id, label, value, options: available, onChange }: FilterSelectProps) {
    // A remembered choice with no SLAs in this period still shows (and can be cleared), rather than "All"
    const options =
        value === 'All' || available.some((o) => o.value === value)
            ? available
            : [...available, { value, label: `${value} (none in this period)` }]
    return (
        <div className="min-w-[180px] flex-1">
            <label htmlFor={id} className="mb-1 block text-xs font-semibold text-gray-500">
                {label}
            </label>
            <Select<Option>
                inputId={id}
                instanceId={id}
                size="sm"
                isSearchable
                options={options}
                value={options.find((o) => o.value === value) ?? options[0]}
                onChange={(option) => onChange(option?.value ?? 'All')}
            />
        </div>
    )
}

interface SlaFilterBarProps {
    options: SlaFilterOptions
    statusCounts: SlaDashboardData['statusCounts']
    /**
     * The records page: status chips, "Open cases only" and the search. The dashboard already splits by status and
     * shows open cases in their own section, so these would change nothing there.
     */
    showStatusAndSearch?: boolean
}

/** Period, status and refinements. Changes apply straight away, on every SLA page. */
export default function SlaFilterBar({ options, statusCounts, showStatusAndSearch = false }: SlaFilterBarProps) {
    const filter = useSlaStore((state) => state.filter)
    const loading = useSlaStore((state) => state.loading)
    const setFilter = useSlaStore((state) => state.setFilter)
    const resetFilter = useSlaStore((state) => state.resetFilter)
    // On the dashboard the status, open-only and search don't apply, so don't count them
    const activeCount = countActiveFilters(
        showStatusAndSearch ? filter : { ...filter, status: 'All', query: '', openOnly: false },
    )
    const months = useMemo(() => getRecentMonths(), [])
    const selectedMonth = isMonthRange(filter.dateRange) ? months.find((m) => m.value === filter.dateRange) : undefined

    return (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            {/* Period */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Segment
                        size="sm"
                        value={isMonthRange(filter.dateRange) ? [] : [filter.dateRange]}
                        onChange={(value) => {
                            const range = firstSegmentValue(value) as RollingRange | undefined
                            if (range && ROLLING_RANGES.includes(range)) setFilter({ dateRange: range })
                        }}
                        aria-label="Rolling period"
                    >
                        {ROLLING_RANGES.map((range) => (
                            <Segment.Item key={range} value={range}>
                                {RANGE_LABELS[range]}
                            </Segment.Item>
                        ))}
                    </Segment>
                    <div className={classNames('min-w-[230px] rounded-xl', selectedMonth && 'ring-2 ring-primary')}>
                        <Select<{ value: MonthRange; label: string }>
                            inputId="sla-filter-month"
                            instanceId="sla-filter-month"
                            aria-label="Month"
                            size="sm"
                            placeholder="Or pick a month…"
                            options={months}
                            value={selectedMonth ?? null}
                            onChange={(option) => option && setFilter({ dateRange: option.value })}
                        />
                    </div>
                    {loading && (
                        <span className="flex items-center gap-2 text-sm text-gray-500" role="status">
                            <Spinner size={16} /> Loading…
                        </span>
                    )}
                </div>
                {showStatusAndSearch && (
                    <div className="w-full lg:max-w-sm">
                        <Input
                            size="sm"
                            prefix={<SearchIcon className="text-lg" />}
                            placeholder="Search case, subject, owner or SLA item…"
                            value={filter.query}
                            onChange={(e) => setFilter({ query: e.target.value })}
                            aria-label="Search SLA records"
                        />
                    </div>
                )}
            </div>

            {/* Status: one click, with how many SLAs each shows */}
            {showStatusAndSearch && (
                <div className="overflow-x-auto">
                    <Segment
                        size="sm"
                        value={[filter.status]}
                        onChange={(value) => {
                            const status = firstSegmentValue(value) as SlaStatusFilter | 'All' | undefined
                            if (status) setFilter({ status })
                        }}
                        aria-label="SLA status"
                    >
                        {(['All', ...SLA_STATUS_FILTERS] as const).map((status) => (
                            <Segment.Item
                                key={status}
                                value={status}
                                title={status === 'All' ? 'Every status' : SLA_STATUS_FILTER_HINTS[status]}
                                className="whitespace-nowrap"
                            >
                                <span className="flex items-center gap-2">
                                    {status}
                                    <span
                                        className={classNames(
                                            'rounded-full px-1.5 text-xs font-semibold',
                                            filter.status === status
                                                ? 'bg-primary-subtle text-primary'
                                                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200',
                                            statusCounts[status] === 0 && 'opacity-50',
                                        )}
                                    >
                                        {loading ? '…' : statusCounts[status]}
                                    </span>
                                </span>
                            </Segment.Item>
                        ))}
                    </Segment>
                </div>
            )}

            {/* Refine */}
            <div className="flex flex-wrap items-end gap-3">
                <FilterSelect
                    id="sla-filter-priority"
                    label="Priority"
                    value={filter.priority}
                    options={withAll('All priorities', options.priorities, getPriorityLabel)}
                    onChange={(priority) => setFilter({ priority })}
                />
                <FilterSelect
                    id="sla-filter-kpi"
                    label="SLA item"
                    value={filter.slaKpi}
                    options={withAll('All SLA items', options.kpis)}
                    onChange={(slaKpi) => setFilter({ slaKpi })}
                />
                <FilterSelect
                    id="sla-filter-owner"
                    label="Owner"
                    value={filter.owner}
                    options={withAll('All owners', options.owners)}
                    onChange={(owner) => setFilter({ owner })}
                />
                {showStatusAndSearch && (
                    <label className="flex h-9 cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Switcher checked={filter.openOnly} onChange={(openOnly) => setFilter({ openOnly })} />
                        <span title="Every SLA on a case that's open now, whatever the period">
                            Open cases only{filter.openOnly ? ' (any date)' : ''}
                        </span>
                    </label>
                )}
                {activeCount > 0 && (
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<ClearIcon />}
                        onClick={() =>
                            // On the dashboard, keep what was chosen on the records page
                            showStatusAndSearch ? resetFilter() : resetFilter({ keep: ['status', 'openOnly', 'query'] })
                        }
                    >
                        Clear {activeCount === 1 ? 'filter' : `${activeCount} filters`}
                    </Button>
                )}
            </div>
        </div>
    )
}
