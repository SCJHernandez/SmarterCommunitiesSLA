'use client'

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '@/components/ui/Card'
import { type BreakdownDataPoint } from '@/@types/sla/SlaDashboard'
import useTokenColors from '@/utils/hooks/useTokenColors'

const TOKENS = ['error', 'gray-300', 'gray-100', 'gray-200', 'gray-500', 'gray-900'] as const

interface SlaBreakdownChartProps {
    title: string
    data: BreakdownDataPoint[]
    /** Shown on the axis instead of the raw value (e.g. priority without its number) */
    formatName?: (name: string) => string
    onSelect?: (name: string) => void
}

/** Breaches by one dimension, largest first; the worst offender is highlighted. */
export default function SlaBreakdownChart({
    title,
    data,
    formatName = (name) => name,
    onSelect,
}: SlaBreakdownChartProps) {
    const colors = useTokenColors(TOKENS)
    const maxValue = Math.max(0, ...data.map((d) => d.value))
    const rows = data.slice(0, 8)

    return (
        <Card>
            <h6 className="mb-4">{title}</h6>
            {rows.length ? (
                <div style={{ height: Math.max(120, rows.length * 36) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={rows}
                            layout="vertical"
                            margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                            barCategoryGap={6}
                        >
                            <XAxis type="number" hide allowDecimals={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                width={120}
                                tickFormatter={formatName}
                                tick={{ fontSize: 12, fill: colors['gray-500'] }}
                            />
                            <Tooltip
                                cursor={{ fill: colors['gray-100'] }}
                                contentStyle={{ borderRadius: 12, borderColor: colors['gray-200'] }}
                                itemStyle={{ color: colors['gray-900'], fontWeight: 600 }}
                                labelFormatter={(name) => formatName(String(name))}
                                formatter={(value) => [`${value ?? 0} breaches`, '']}
                            />
                            <Bar
                                dataKey="value"
                                radius={[0, 4, 4, 0]}
                                maxBarSize={24}
                                isAnimationActive={false}
                                cursor={onSelect ? 'pointer' : 'default'}
                                onClick={(entry) => {
                                    if (onSelect && entry.name) onSelect(String(entry.name))
                                }}
                            >
                                {rows.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={entry.value === maxValue ? colors.error : colors['gray-300']}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="py-8 text-center text-sm text-gray-500">No breaches in this period.</p>
            )}
        </Card>
    )
}
