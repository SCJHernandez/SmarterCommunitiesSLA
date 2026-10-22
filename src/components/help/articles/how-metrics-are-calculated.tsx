import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpExample, HelpFormula, HelpLink, HelpList, HelpNote, HelpTable, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'how-metrics-are-calculated',
    title: 'How each metric is calculated',
    summary:
        'The formula behind every number on the dashboard: SLAs started, success rate, breached, median time to meet and open SLAs.',
    category: 'metrics',
    updatedOn: '2026-10-22',
    readMinutes: 6,
    keywords: [
        'formula',
        'calculation',
        'kpi',
        'success rate',
        'adherence',
        'compliance',
        'median',
        'average',
        'time to meet',
        'resolution time',
        'breached',
        'at risk',
        'percentage points',
    ],
    related: ['comparing-periods', 'sla-statuses', 'charts-explained'],
    sections: [
        {
            id: 'which-slas',
            title: 'Which SLAs are counted',
            body: (
                <>
                    <HelpText>
                        The <UiLabel>Performance</UiLabel> cards count SLAs that <em>started</em> in the selected
                        period, from its first moment up to (not including) its end. The <UiLabel>Priority</UiLabel>,{' '}
                        <UiLabel>SLA item</UiLabel> and <UiLabel>Owner</UiLabel> filters apply.
                    </HelpText>
                    <HelpText>
                        Left out everywhere: SLA timers Dynamics left running on cases that are already resolved or
                        cancelled. Nobody can act on them, and they would never be met.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'started',
            title: 'SLAs started',
            body: (
                <>
                    <HelpFormula>SLAs started = SLAs created in the period</HelpFormula>
                    <HelpText>This is workload. More isn’t better or worse, so the change is shown in grey.</HelpText>
                </>
            ),
        },
        {
            id: 'success-rate',
            title: 'SLA success rate',
            body: (
                <>
                    <HelpFormula>Success rate = Met ÷ (Met + Breached) × 100</HelpFormula>
                    <HelpText>
                        Only SLAs with a result count. SLAs still running, paused or cancelled are left out, so a busy
                        week isn’t marked down for work that’s still in progress. It shows <UiLabel>—</UiLabel> when
                        nothing has been met or breached yet.
                    </HelpText>
                    <HelpExample>
                        80 SLAs started: 45 met, 15 breached, 20 still running. Success rate = 45 ÷ (45 + 15) = 75%.
                    </HelpExample>
                    <HelpText>
                        The change is in <strong>percentage points</strong> (pts): from 80% to 75% is −5 pts.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'breached',
            title: 'Breached',
            body: (
                <>
                    <HelpFormula>Breached = SLAs started in the period that missed their deadline</HelpFormula>
                    <HelpText>
                        A lower number is better, so a fall shows green. The card also says how many breached SLAs are
                        on cases that are still open right now, from any period. Those are in the Action Center’s{' '}
                        <UiLabel>Breached</UiLabel> tab.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'median-time-to-meet',
            title: 'Median time to meet',
            body: (
                <>
                    <HelpFormula>
                        For each met SLA: time met − time started
                        <br />
                        Median time to meet = the middle value of those times
                    </HelpFormula>
                    <HelpText>
                        This is calendar time, in hours: nights, weekends and time spent paused all count, because
                        that’s how long the customer waited.
                    </HelpText>
                    <HelpText>It uses the median because a few long-running cases would distort an average:</HelpText>
                    <HelpExample>
                        Five SLAs met in 2, 3, 4, 5 and 120 hours. The average is 26.8 hours, but four of the five took
                        5 hours or less. The median, 4 hours, is the typical experience.
                    </HelpExample>
                    <HelpText>The change is in hours. Lower is better, so a fall shows green.</HelpText>
                </>
            ),
        },
        {
            id: 'open-slas',
            title: 'Open SLAs (needs attention)',
            body: (
                <>
                    <HelpText>
                        <UiLabel>Needs attention now</UiLabel> counts every SLA that isn’t met or cancelled, on a case
                        that’s open now, whenever it started. Each one is in exactly one state:
                    </HelpText>
                    <HelpTable
                        headers={['State', 'Rule']}
                        rows={[
                            [
                                <UiLabel key="b">Breached</UiLabel>,
                                'Noncompliant in Dynamics, or still running after its deadline (Dynamics can be slow to update the status)',
                            ],
                            [
                                <UiLabel key="r">At risk</UiLabel>,
                                'Nearing noncompliance in Dynamics, or past its warning time',
                            ],
                            [<UiLabel key="p">Paused</UiLabel>, 'Timer paused (for example, waiting on the customer)'],
                            [<UiLabel key="o">On track</UiLabel>, 'Running and not yet past its warning time'],
                        ]}
                    />
                    <HelpList
                        items={[
                            <>
                                The page header’s “N open SLAs need attention” is <strong>breached + at risk</strong>.
                            </>,
                            <>
                                The at-risk share in the insights is at risk ÷ running SLAs (on track + at risk). Paused
                                SLAs aren’t counting down, so they’re left out.
                            </>,
                            <>These are a snapshot of right now, so there’s no comparison with a previous period.</>,
                        ]}
                    />
                </>
            ),
        },
        {
            id: 'change-arrows',
            title: 'Reading the change',
            body: (
                <>
                    <HelpText>
                        Under each card, the change compares this period with the one before. Green means better and red
                        means worse, whichever way the number moved. Grey means neither (SLAs started).
                    </HelpText>
                    <HelpNote>
                        “No data to compare with …” means the previous period had nothing to compare with, not that
                        nothing changed. <HelpLink slug="comparing-periods">How periods are compared</HelpLink>
                    </HelpNote>
                </>
            ),
        },
    ],
}
