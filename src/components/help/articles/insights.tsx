import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpExample, HelpTable, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'insights',
    title: 'Insights: what triggers each one',
    summary: 'The findings at the top of Needs attention now: the exact rule behind each one, and how they’re ordered.',
    category: 'using',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: ['insight', 'alert', 'warning', 'breach rate', 'outlier', 'adherence', 'paused', 'threshold', 'rule'],
    related: ['charts-explained', 'action-center'],
    sections: [
        {
            id: 'how-they-work',
            title: 'How insights work',
            body: (
                <HelpText>
                    The dashboard checks a few rules and shows up to five findings, most serious first: what needs
                    action, then how the period is going. The first two show straight away, and{' '}
                    <UiLabel>Show more</UiLabel> lists the rest. Most come with a link to the SLAs behind them.
                </HelpText>
            ),
        },
        {
            id: 'each-insight',
            title: 'Each insight, and when it appears',
            body: (
                <HelpTable
                    headers={['Insight', 'Appears when']}
                    rows={[
                        [<UiLabel key="1">Breached SLAs on open cases</UiLabel>, 'Any open case has a breached SLA'],
                        [
                            <UiLabel key="2">Approaching deadlines</UiLabel>,
                            'Any open SLA is at risk (it also gives the share of running SLAs at risk)',
                        ],
                        [
                            <UiLabel key="3">High breach rate: …</UiLabel>,
                            'An owner, priority or SLA item breached at least 1.5 times as often as everyone together, and at least 10 points more. It needs 5 or more met-or-breached SLAs, and something to compare with. The biggest gap is shown.',
                        ],
                        [
                            <UiLabel key="4">Adherence falling / improving</UiLabel>,
                            'The success rate moved by 5 points or more from the previous period',
                        ],
                        [
                            <UiLabel key="5">SLAs met faster</UiLabel>,
                            'The median time to meet is lower than in the previous period',
                        ],
                        [
                            <UiLabel key="6">Long-paused SLAs</UiLabel>,
                            'An open SLA has been paused for more than 7 days',
                        ],
                    ]}
                />
            ),
        },
        {
            id: 'breach-rate-example',
            title: 'Example: high breach rate',
            body: (
                <HelpExample>
                    Across all owners, 40% of SLAs with a result were breached. Ann had 8, and 6 of them breached: 75%.
                    That’s more than 1.5 × 40% (60%) and more than 40% + 10 points (50%), so the insight reads “75% of
                    SLAs for Ann were breached (6 of 8), against 40% overall.”
                </HelpExample>
            ),
        },
        {
            id: 'none',
            title: 'When there are none',
            body: (
                <HelpText>
                    <UiLabel>Nothing needs attention</UiLabel> means no open SLA is breached, at risk or long paused,
                    and nothing about the period stood out.
                </HelpText>
            ),
        },
    ],
}
