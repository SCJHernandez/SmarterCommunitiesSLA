import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpExample, HelpLink, HelpList, HelpTable, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'action-center',
    title: 'Working the Action Center',
    summary: 'The to-do list of open SLAs: its tabs, the urgency column, the next step, and why each case shows once.',
    category: 'using',
    updatedOn: '2026-10-22',
    readMinutes: 4,
    keywords: [
        'action center',
        'to do',
        'tabs',
        'urgency',
        'overdue',
        'next step',
        'escalate',
        'review',
        'duplicates',
        'sort',
    ],
    related: ['daily-routine', 'case-details-and-history', 'sla-statuses'],
    sections: [
        {
            id: 'whats-in-it',
            title: 'What’s in it',
            body: (
                <>
                    <HelpText>
                        Every SLA on a case that’s open now and isn’t met or cancelled, whenever it started. The
                        priority, SLA item and owner filters apply; the period doesn’t.
                    </HelpText>
                    <HelpList
                        items={[
                            <>
                                <UiLabel>Breached</UiLabel>: the deadline has passed.
                            </>,
                            <>
                                <UiLabel>At risk</UiLabel>: past the warning time, deadline still ahead.
                            </>,
                            <>
                                <UiLabel>On track</UiLabel>: running with time to spare (only SLAs that have a
                                deadline).
                            </>,
                            <>
                                <UiLabel>Paused</UiLabel>: the timer is stopped.
                            </>,
                        ]}
                    />
                    <HelpText>
                        Each tab shows its count. Empty tabs are hidden, and the most urgent tab opens first.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'one-row-per-case',
            title: 'One row per case and SLA item',
            body: (
                <>
                    <HelpText>
                        A case can collect several timers for the same SLA item, for example when it’s reopened. The
                        Action Center shows the most urgent one and notes the rest.
                    </HelpText>
                    <HelpExample>
                        A case with three “Project Support” timers, one breached and two on track, shows once on the
                        Breached tab with “+2 earlier SLAs on this case”.
                    </HelpExample>
                </>
            ),
        },
        {
            id: 'urgency',
            title: 'Urgency and next step',
            body: (
                <HelpTable
                    headers={['Urgency shows', 'Means', 'Next step']}
                    rows={[
                        ['Overdue 3d 4h (red)', 'The deadline passed 3 days 4 hours ago', 'Escalate'],
                        ['45m left (red)', 'Under an hour to the deadline', 'Review (if at risk)'],
                        ['3h 10m left (amber)', 'Under 4 hours to the deadline', 'Review (if at risk)'],
                        ['2d 5h left', 'Plenty of time', '—'],
                        ['Paused for 9d 2h', 'How long the current pause has lasted: check it’s still right', '—'],
                    ]}
                />
            ),
        },
        {
            id: 'sorting',
            title: 'Sorting and pages',
            body: (
                <HelpText>
                    Sort by <UiLabel>Priority</UiLabel>, <UiLabel>Owner</UiLabel> or <UiLabel>Urgency</UiLabel> by
                    clicking the column heading. Six rows show per page. <UiLabel>All SLA records</UiLabel> opens the
                    full list with every filter.
                </HelpText>
            ),
        },
        {
            id: 'opening-a-case',
            title: 'Opening a case',
            body: (
                <HelpText>
                    Click a row to open the case panel: SLA timeline, case history and a link to the case in Dynamics.{' '}
                    <HelpLink slug="case-details-and-history">Case details and history</HelpLink>
                </HelpText>
            ),
        },
    ],
}
