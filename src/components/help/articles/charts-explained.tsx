import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpLink, HelpList, HelpNote, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'charts-explained',
    title: 'Reading the charts',
    summary: 'What the SLA flow per day and the breach breakdowns show, and why they count what they count.',
    category: 'metrics',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: ['chart', 'graph', 'trend', 'flow', 'per day', 'breakdown', 'owner', 'priority', 'sla item', 'bar'],
    related: ['insights', 'how-metrics-are-calculated'],
    sections: [
        {
            id: 'flow-per-day',
            title: 'SLA flow per day',
            body: (
                <>
                    <HelpText>Three lines, one point per day of the period:</HelpText>
                    <HelpList
                        items={[
                            <>
                                <UiLabel>Started</UiLabel>: SLAs created that day. This is incoming work.
                            </>,
                            <>
                                <UiLabel>Met</UiLabel>: SLAs met that day.
                            </>,
                            <>
                                <UiLabel>Breached</UiLabel>: SLAs whose deadline passed that day without being met.
                            </>,
                        ]}
                    />
                    <HelpText>
                        Met and breached count on the day they happened, so an SLA that started last period and breached
                        this period appears here. When Started stays above Met for days, work is piling up. Hover over
                        the chart for the exact numbers.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'breakdowns',
            title: 'Breaches by owner, priority and SLA item',
            body: (
                <>
                    <HelpText>
                        Breached SLAs that started in the period, grouped by the case owner, the case priority or the
                        SLA item. The eight largest groups are shown, and the largest is highlighted in red.
                    </HelpText>
                    <HelpList
                        items={[
                            <>Click a bar to open those breaches in SLA Records.</>,
                            <>
                                A breakdown with only one group is hidden (for example, when every case has the same
                                priority). A single bar has nothing to compare.
                            </>,
                        ]}
                    />
                </>
            ),
        },
        {
            id: 'counts-and-rates',
            title: 'Counts, not rates',
            body: (
                <HelpNote>
                    The breakdowns count breaches, so whoever handles the most cases often has the most breaches. To
                    find who or what breaches <em>more often</em> than usual, see the{' '}
                    <HelpLink slug="insights" section="each-insight">
                        High breach rate
                    </HelpLink>{' '}
                    insight, which compares rates.
                </HelpNote>
            ),
        },
    ],
}
