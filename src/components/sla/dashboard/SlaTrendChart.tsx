'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '@/components/ui/Card'
import { type SlaTrendPoint } from '@/@types/sla/SlaDashboard'
import useTokenColors from '@/utils/hooks/useTokenColors'

const TOKENS = ['success', 'error', 'info', 'gray-200', 'gray-500', 'gray-900'] as const

// Started (neutral blue) vs outcomes (status colours), named in the legend and the tooltip
const SERIES = [
    { key: 'Created', label: 'Started', token: 'info' },
    { key: 'Succeeded', label: 'Met', token: 'success' },
    { key: 'Failed', label: 'Breached', token: 'error' },
] as const

interface SlaTrendChartProps {
    data: SlaTrendPoint[]
}

/** Daily SLA outcomes over the period. */
export default function SlaTrendChart({ data }: SlaTrendChartProps) {
    const colors = useTokenColors(TOKENS)

    return (
        <Card bodyClass="flex h-[400px] flex-col">
            <div className="mb-4">
                <h5>SLA flow per day</h5>
                <p className="text-sm text-gray-500">
                    SLAs started, and SLAs met or breached (at their deadline) each day
                </p>
            </div>
            <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={colors['gray-200']} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: colors['gray-500'] }}
                            minTickGap={24}
                            dy={8}
                        />
                        <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: colors['gray-500'] }}
                        />
                        <Tooltip
                            cursor={{ stroke: colors['gray-500'], strokeWidth: 1 }}
                            contentStyle={{ borderRadius: 12, borderColor: colors['gray-200'] }}
                            labelStyle={{ color: colors['gray-500'], marginBottom: 4 }}
                            itemStyle={{ color: colors['gray-900'], fontWeight: 600 }}
                        />
                        <Legend
                            iconType="plainline"
                            verticalAlign="top"
                            align="right"
                            wrapperStyle={{ fontSize: 12, top: -8 }}
                        />
                        {SERIES.map((series) => (
                            <Line
                                key={series.key}
                                type="monotone"
                                dataKey={series.key}
                                name={series.label}
                                stroke={colors[series.token]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2 }}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
