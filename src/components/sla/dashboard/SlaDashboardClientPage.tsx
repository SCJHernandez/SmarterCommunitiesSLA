'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import PageHeader from '@/components/shared/PageHeader'
import SlaCaseDrawer from '@/components/sla/details/SlaCaseDrawer'
import SlaFilterBar from '@/components/sla/SlaFilterBar'
import SlaRefreshButton from '@/components/sla/SlaRefreshButton'
import SlaActionCenter from './SlaActionCenter'
import SlaBreakdownChart from './SlaBreakdownChart'
import SlaHealthCard from './SlaHealthCard'
import SlaInsightsPanel from './SlaInsightsPanel'
import SlaKpiCard from './SlaKpiCard'
import SlaTrendChart from './SlaTrendChart'
import Skeleton from '@/components/ui/Skeleton'
import { BreachedIcon, CaseIcon, InfoIcon, SuccessIcon, TimeIcon } from '@/configs/icons.config'
import { getHelpArticlePath } from '@/configs/app.config'
import { useSlaStore } from '@/stores/SlaStore'
import { getPriorityLabel } from '@/utils/sla/priority'
import useSlaDashboard from '@/utils/hooks/useSlaDashboard'
import useSlaDrillDown from '@/utils/hooks/useSlaDrillDown'

interface SectionHeadingProps {
    title: string
    description: string
    /** The help article that explains this section */
    help?: { href: string; label: string }
}

function SectionHeading({ title, description, help }: SectionHeadingProps) {
    return (
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
                <h4 className="mb-1">{title}</h4>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            {help && (
                <Link
                    href={help.href}
                    className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                    <InfoIcon className="text-base" />
                    {help.label}
                </Link>
            )}
        </div>
    )
}

/**
 * The SLA dashboard, top to bottom: a snapshot of the period (headline numbers), what needs action now (insights,
 * open SLAs, Action Center), then how the period went over time (trend and breakdowns).
 */
export default function SlaDashboardClientPage() {
    const loading = useSlaStore((state) => state.loading)
    const error = useSlaStore((state) => state.error)
    const refresh = useSlaStore((state) => state.refresh)
    const resetFilter = useSlaStore((state) => state.resetFilter)
    const dashboard = useSlaDashboard()
    const drillDown = useSlaDrillDown()
    const { kpiStats, healthStats, totalRecords, period } = dashboard.summary
    const versus = `vs ${period.previousLabel}`

    const breakdowns = [
        {
            key: 'owner',
            title: 'Breaches by owner',
            series: dashboard.breakdown.owner,
            onSelect: (owner: string) => drillDown({ owner, status: 'Breached', openOnly: false }),
        },
        {
            key: 'priority',
            title: 'Breaches by priority',
            series: dashboard.breakdown.priority,
            formatName: getPriorityLabel,
            onSelect: (priority: string) => drillDown({ priority, status: 'Breached', openOnly: false }),
        },
        {
            key: 'kpi',
            title: 'Breaches by SLA item',
            series: dashboard.breakdown.kpi,
            onSelect: (slaKpi: string) => drillDown({ slaKpi, status: 'Breached', openOnly: false }),
        },
        // One group (e.g. every SLA is "Normal" priority) has nothing to compare
    ].filter((b) => b.series.groups > 1)

    const noneStarted = !loading && totalRecords === 0

    const content = () => {
        if (error && !loading) return <ErrorState message={error} onRetry={() => void refresh()} />

        return (
            <div className="flex flex-col gap-8">
                {/* Snapshot: how the period went, compared like-for-like with the period before */}
                <section className="flex flex-col gap-4">
                    <SectionHeading
                        title={`Performance ${period.label}`}
                        description={`SLAs started ${period.label}, compared with ${period.previousLabel}.`}
                        help={{
                            href: getHelpArticlePath('how-metrics-are-calculated'),
                            label: 'How these are calculated',
                        }}
                    />
                    {noneStarted ? (
                        <EmptyState
                            title="No SLAs started in this period"
                            description="Nothing was created in the selected period with these filters. Choose a longer period or clear the filters."
                            action={
                                <Button size="sm" variant="default" onClick={() => resetFilter()}>
                                    Clear filters
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SlaKpiCard
                                title="SLAs started"
                                value={kpiStats.startedCount.toLocaleString()}
                                description="SLA timers that started on cases"
                                icon={<CaseIcon />}
                                trend={kpiStats.startedTrend}
                                trendLabel={versus}
                                neutralTrend
                                loading={loading}
                                onClick={() => drillDown({ status: 'All', openOnly: false })}
                            />
                            <SlaKpiCard
                                title="SLA success rate"
                                value={kpiStats.successRate === null ? '—' : `${kpiStats.successRate}%`}
                                description="Met, out of the SLAs met or breached"
                                icon={<SuccessIcon />}
                                trend={kpiStats.successRateTrend}
                                trendLabel={`pts ${versus}`}
                                loading={loading}
                                onClick={() => drillDown({ status: 'Met', openOnly: false })}
                            />
                            <SlaKpiCard
                                title="Breached"
                                value={kpiStats.breachedCount.toLocaleString()}
                                description={`Missed the deadline (${healthStats.breached} on cases still open)`}
                                icon={<BreachedIcon />}
                                trend={kpiStats.breachedTrend}
                                trendLabel={versus}
                                inverseTrend
                                loading={loading}
                                onClick={() => drillDown({ status: 'Breached', openOnly: false })}
                            />
                            <SlaKpiCard
                                title="Median time to meet"
                                value={kpiStats.medianTimeToMeet === null ? '—' : `${kpiStats.medianTimeToMeet}h`}
                                description="From the SLA starting to being met (calendar hours)"
                                icon={<TimeIcon />}
                                trend={kpiStats.medianTimeToMeetTrend}
                                trendUnit="h"
                                trendLabel={versus}
                                inverseTrend
                                loading={loading}
                                onClick={() => drillDown({ status: 'Met', openOnly: false })}
                            />
                        </div>
                    )}
                </section>

                {/* What needs action: open work, whatever the period */}
                <section className="flex flex-col gap-4">
                    <SectionHeading
                        title="Needs attention now"
                        description="Every open case, whatever the period selected. Priority, SLA item and owner filters apply."
                        help={{ href: getHelpArticlePath('action-center'), label: 'Working the Action Center' }}
                    />
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            {loading ? (
                                <Skeleton height={160} />
                            ) : dashboard.insights.length ? (
                                <SlaInsightsPanel insights={dashboard.insights} onDrillDown={drillDown} />
                            ) : (
                                <EmptyState
                                    icon={SuccessIcon}
                                    title="Nothing needs attention"
                                    description="No open SLAs are breached, at risk or paused for long."
                                />
                            )}
                        </div>
                        {loading ? (
                            <Skeleton height={160} />
                        ) : (
                            <SlaHealthCard health={healthStats} onDrillDown={drillDown} />
                        )}
                    </div>
                    {loading ? <Skeleton height={360} /> : <SlaActionCenter records={dashboard.actionRecords} />}
                </section>

                {/* Analysis: the period day by day, and where breaches concentrate */}
                {!noneStarted && (
                    <section className="flex flex-col gap-4">
                        <SectionHeading
                            title={`Trends ${period.label}`}
                            description="SLAs started, met and breached each day, and where the breaches concentrate."
                            help={{ href: getHelpArticlePath('charts-explained'), label: 'Reading the charts' }}
                        />
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            {loading ? <Skeleton height={400} /> : <SlaTrendChart data={dashboard.trend} />}
                            <div className="grid grid-cols-1 content-start gap-6">
                                {loading ? (
                                    <Skeleton height={190} />
                                ) : breakdowns.length ? (
                                    breakdowns.map((b) => (
                                        <SlaBreakdownChart
                                            key={b.key}
                                            title={b.title}
                                            data={b.series.points}
                                            formatName={b.formatName}
                                            onSelect={b.onSelect}
                                        />
                                    ))
                                ) : (
                                    <EmptyState
                                        title="Nothing to compare"
                                        description="Every SLA in this period has the same owner, priority and SLA item."
                                    />
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title="SLA performance"
                description={
                    loading
                        ? 'Loading SLA data from Dynamics 365…'
                        : `${healthStats.breached + healthStats.atRisk} open SLAs need attention · ${totalRecords.toLocaleString()} SLAs started ${period.label}.`
                }
                actions={<SlaRefreshButton />}
            />
            <SlaFilterBar options={dashboard.filterOptions} statusCounts={dashboard.statusCounts} />
            {content()}
            <SlaCaseDrawer />
        </>
    )
}
