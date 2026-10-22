'use client'

import Card from '@/components/ui/Card'
import { type SlaHealthStats } from '@/@types/sla/SlaDashboard'
import { type SlaFilter } from '@/@types/sla/SlaFilter'
import classNames from '@/utils/classNames'

interface SlaHealthCardProps {
    health: SlaHealthStats
    onDrillDown: (filter: Partial<SlaFilter>) => void
}

/** SLAs on open cases (any creation date) by where they stand — one bar, four counts. */
export default function SlaHealthCard({ health, onDrillDown }: SlaHealthCardProps) {
    const total = health.healthy + health.atRisk + health.breached + health.paused
    const segments: { label: string; value: number; barClass: string; status: SlaFilter['status'] }[] = [
        { label: 'On track', value: health.healthy, barClass: 'bg-success', status: 'On track' },
        { label: 'At risk', value: health.atRisk, barClass: 'bg-warning', status: 'At risk' },
        { label: 'Breached', value: health.breached, barClass: 'bg-error', status: 'Breached' },
        { label: 'Paused', value: health.paused, barClass: 'bg-gray-400', status: 'Paused' },
    ]

    return (
        <Card bodyClass="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
                <h6>Open SLAs</h6>
                <span className="text-sm text-gray-500">{total} open</span>
            </div>
            <div
                className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"
                role="img"
                aria-label={segments.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ')}
            >
                {segments
                    .filter((s) => s.value > 0)
                    .map((s) => (
                        <div
                            key={s.label}
                            className={classNames('h-full transition-all duration-500', s.barClass)}
                            style={{ width: `${(s.value / total) * 100}%` }}
                        />
                    ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {segments.map((s) => (
                    <button
                        key={s.label}
                        type="button"
                        onClick={() => onDrillDown({ status: s.status, openOnly: true })}
                        className="rounded-lg p-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-gray-500">
                            <span className={classNames('h-2 w-2 rounded-full', s.barClass)} />
                            {s.label}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</span>
                    </button>
                ))}
            </div>
        </Card>
    )
}
