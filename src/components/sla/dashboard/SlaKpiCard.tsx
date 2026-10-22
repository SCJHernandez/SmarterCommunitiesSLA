'use client'

import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { TrendDownIcon, TrendFlatIcon, TrendUpIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface SlaKpiCardProps {
    title: string
    value: ReactNode
    description: string
    icon: ReactNode
    /** Change vs the previous period (or a share, with `hideTrendArrow`); null when there's nothing to compare with */
    trend: number | null
    trendUnit?: string
    trendLabel?: string
    /** A rise is bad (e.g. breaches, resolution time) */
    inverseTrend?: boolean
    /** Neither direction is good or bad (e.g. volume): the change stays grey */
    neutralTrend?: boolean
    /** Show the number without an up/down arrow; it turns red at `trendThreshold` */
    hideTrendArrow?: boolean
    trendThreshold?: number
    loading?: boolean
    /** Opens the matching records */
    onClick?: () => void
}

/** A headline number with its change vs the previous period. */
export default function SlaKpiCard({
    title,
    value,
    description,
    icon,
    trend,
    trendUnit = '',
    trendLabel = 'vs the previous period',
    inverseTrend = false,
    neutralTrend = false,
    hideTrendArrow = false,
    trendThreshold,
    loading = false,
    onClick,
}: SlaKpiCardProps) {
    let trendClass = 'text-gray-500'
    if (trend === null) {
        // No comparison: stays grey
    } else if (hideTrendArrow) {
        if (trendThreshold !== undefined && trend >= trendThreshold) trendClass = 'text-error'
    } else if (trend !== 0 && !neutralTrend) {
        trendClass = trend > 0 !== inverseTrend ? 'text-success' : 'text-error'
    }
    const TrendIcon = !trend ? TrendFlatIcon : trend > 0 ? TrendUpIcon : TrendDownIcon

    return (
        <Card
            clickable={!!onClick && !loading}
            onClick={loading ? undefined : onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (onClick && !loading && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onClick()
                }
            }}
            className={classNames(onClick && 'transition-colors hover:border-primary focus-visible:border-primary')}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-500">{title}</div>
                    {loading ? (
                        <Skeleton className="mt-2" height={36} width={96} />
                    ) : (
                        <div className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
                    )}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xl text-primary">
                    {icon}
                </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">{description}</p>
            {loading ? (
                <Skeleton className="mt-4" height={16} width="60%" />
            ) : (
                <div className="mt-4 flex items-center gap-2 text-sm">
                    {trend === null ? (
                        <span className="text-xs text-gray-500">
                            No data to compare {trendLabel.replace(/^(pts )?vs /, 'with ')}
                        </span>
                    ) : (
                        <>
                            <span className={classNames('flex items-center font-semibold', trendClass)}>
                                {!hideTrendArrow && <TrendIcon className="mr-0.5 text-base" />}
                                {Math.abs(trend)}
                                {trendUnit}
                            </span>
                            <span className="text-xs text-gray-500">{trendLabel}</span>
                        </>
                    )}
                </div>
            )}
        </Card>
    )
}
