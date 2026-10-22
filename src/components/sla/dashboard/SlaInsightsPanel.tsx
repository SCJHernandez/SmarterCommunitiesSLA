'use client'

import { useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { CollapseIcon, ExpandIcon, ForwardIcon } from '@/configs/icons.config'
import { type Insight, type InsightSeverity } from '@/@types/sla/SlaDashboard'
import { type SlaFilter } from '@/@types/sla/SlaFilter'

const ALERT_TYPE: Record<InsightSeverity, 'danger' | 'warning' | 'success' | 'info'> = {
    critical: 'danger',
    warning: 'warning',
    positive: 'success',
    info: 'info',
}

interface SlaInsightsPanelProps {
    insights: Insight[]
    onDrillDown: (filter: Partial<SlaFilter>) => void
    /** How many show before "Show more" — the most severe come first */
    visibleCount?: number
}

/** What stands out, most severe first, each with the cases behind it. The rest fold away behind "Show more". */
export default function SlaInsightsPanel({ insights, onDrillDown, visibleCount = 2 }: SlaInsightsPanelProps) {
    const [expanded, setExpanded] = useState(false)
    if (!insights.length) return null

    const hidden = insights.length - visibleCount
    const shown = expanded || hidden <= 0 ? insights : insights.slice(0, visibleCount)

    return (
        <div className="flex flex-col gap-3">
            {shown.map((insight) => (
                <Alert key={insight.title} showIcon type={ALERT_TYPE[insight.severity]} title={insight.title}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <span>{insight.message}</span>
                        {insight.actionLabel && insight.actionFilter && (
                            <Button
                                size="xs"
                                variant="plain"
                                className="-ml-3 shrink-0 sm:ml-0"
                                icon={<ForwardIcon />}
                                iconAlignment="end"
                                onClick={() => onDrillDown(insight.actionFilter!)}
                            >
                                {insight.actionLabel}
                            </Button>
                        )}
                    </div>
                </Alert>
            ))}
            {hidden > 0 && (
                <Button
                    size="sm"
                    variant="plain"
                    className="self-start"
                    icon={expanded ? <CollapseIcon /> : <ExpandIcon />}
                    aria-expanded={expanded}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? 'Show less' : `Show ${hidden} more ${hidden === 1 ? 'insight' : 'insights'}`}
                </Button>
            )}
        </div>
    )
}
