import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpLink, HelpList, HelpNote, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'daily-routine',
    title: 'A daily SLA routine',
    summary: 'A few minutes each morning to catch breaches and near-misses, and a weekly look at how things are going.',
    category: 'getting-started',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: ['workflow', 'routine', 'checklist', 'morning', 'weekly', 'escalate', 'how to'],
    related: ['action-center', 'insights', 'filters'],
    sections: [
        {
            id: 'start-of-day',
            title: 'Start of the day',
            body: (
                <HelpList
                    ordered
                    items={[
                        <>
                            Open the <UiLabel>Dashboard</UiLabel>. Read the first insights under{' '}
                            <UiLabel>Needs attention now</UiLabel>. They’re in order of urgency, and{' '}
                            <UiLabel>Show more</UiLabel> lists the rest.
                        </>,
                        <>
                            In the <UiLabel>Action Center</UiLabel>, start with the <UiLabel>Breached</UiLabel> tab.
                            These SLAs missed their deadline and the case is still open.
                        </>,
                        <>
                            Then <UiLabel>At risk</UiLabel>: past the warning time, but there’s still time to meet the
                            deadline.
                        </>,
                        <>
                            Finally <UiLabel>Paused</UiLabel>: check that each pause still makes sense (for example, the
                            case really is waiting on the customer).
                        </>,
                    ]}
                />
            ),
        },
        {
            id: 'breached',
            title: 'Working a breached SLA',
            body: (
                <>
                    <HelpList
                        items={[
                            <>
                                Click the row to open the case panel. The <UiLabel>SLA timeline</UiLabel> shows when it
                                started and breached. <UiLabel>Case history</UiLabel> shows who has it and what changed
                                last.
                            </>,
                            <>
                                Use <UiLabel>Open in Dynamics</UiLabel> to act: reassign, update the customer, or
                                escalate to a lead.
                            </>,
                        ]}
                    />
                    <HelpNote>
                        A breach can’t be undone. Resolving the case takes it off <UiLabel>Needs attention now</UiLabel>
                        , but it still counts as breached in the period’s performance.
                    </HelpNote>
                </>
            ),
        },
        {
            id: 'at-risk',
            title: 'Getting ahead of at-risk SLAs',
            body: (
                <HelpText>
                    Sort the Action Center by <UiLabel>Urgency</UiLabel>. Time left turns amber under 4 hours and red
                    under 1 hour. Anything red is the next breach unless someone acts.{' '}
                    <HelpLink slug="action-center" section="urgency">
                        Urgency explained
                    </HelpLink>
                </HelpText>
            ),
        },
        {
            id: 'weekly',
            title: 'Once a week',
            body: (
                <HelpList
                    items={[
                        <>
                            Compare the <UiLabel>Performance</UiLabel> cards with the previous period. A red arrow means
                            worse.
                        </>,
                        <>
                            Look at <UiLabel>Breaches by owner</UiLabel> and any <UiLabel>High breach rate</UiLabel>{' '}
                            insight. They point to workload or routing problems.
                        </>,
                        <>
                            For monthly reporting, pick the month in the period filter: each month is compared with the
                            one before. <HelpLink slug="comparing-periods">How periods are compared</HelpLink>
                        </>,
                    ]}
                />
            ),
        },
        {
            id: 'tips',
            title: 'Tips',
            body: (
                <HelpList
                    items={[
                        <>
                            Pick yourself in the <UiLabel>Owner</UiLabel> filter to see only your cases. Your filters
                            are remembered next time you open the dashboard.
                        </>,
                        <>Copy the address bar while a case panel is open to send someone a link straight to it.</>,
                        <>
                            Cases you opened recently are listed under <UiLabel>Recently viewed</UiLabel> in the side
                            menu.
                        </>,
                    ]}
                />
            ),
        },
    ],
}
