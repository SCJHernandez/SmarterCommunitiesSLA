import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpLink, HelpList, HelpNote, HelpTable, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'what-is-sla-performance',
    title: 'What SLA Performance does',
    summary: 'An overview: what the dashboard is for, the two kinds of SLAs it shows, and where its numbers come from.',
    category: 'getting-started',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: ['overview', 'introduction', 'dashboard', 'dynamics', 'dataverse', 'read-only'],
    related: ['daily-routine', 'how-metrics-are-calculated', 'sla-statuses'],
    sections: [
        {
            id: 'purpose',
            title: 'What it’s for',
            body: (
                <>
                    <HelpText>
                        SLA Performance watches the service-level agreements (SLAs) on Dynamics 365 Customer Service
                        cases. It shows which SLAs need someone’s attention right now, and how well SLAs have been met
                        over time.
                    </HelpText>
                    <HelpText>
                        It only reads from Dynamics 365. To act on a case (reassign it, update it, resolve it), open it
                        in Dynamics with <UiLabel>Open in Dynamics</UiLabel> on the case panel.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'two-kinds',
            title: 'Two questions, two sets of SLAs',
            body: (
                <>
                    <HelpText>
                        The dashboard answers two different questions, so each part counts different SLAs:
                    </HelpText>
                    <HelpTable
                        headers={['Part of the dashboard', 'Which SLAs', 'Answers']}
                        rows={[
                            [
                                <UiLabel key="p">Performance and Trends</UiLabel>,
                                'SLAs that started in the period you picked, compared with the period before',
                                'How did we do?',
                            ],
                            [
                                <UiLabel key="n">Needs attention now</UiLabel>,
                                'Every SLA still running, paused or breached on a case that’s open now, whenever it started',
                                'What needs doing today?',
                            ],
                        ]}
                    />
                    <HelpNote>
                        The period never hides open work: a breach from three weeks ago on a case that’s still open
                        shows under <UiLabel>Needs attention now</UiLabel> even with <UiLabel>7 days</UiLabel> picked.
                    </HelpNote>
                </>
            ),
        },
        {
            id: 'layout',
            title: 'What’s on the dashboard',
            body: (
                <HelpList
                    items={[
                        <>
                            <UiLabel>Performance</UiLabel>: four headline numbers for the period: SLAs started, success
                            rate, breached and median time to meet.{' '}
                            <HelpLink slug="how-metrics-are-calculated">How they’re calculated</HelpLink>
                        </>,
                        <>
                            <UiLabel>Needs attention now</UiLabel>: insights (what stands out), the open SLAs bar and
                            the <HelpLink slug="action-center">Action Center</HelpLink>, a to-do list of open SLAs.
                        </>,
                        <>
                            <UiLabel>Trends</UiLabel>: SLAs started, met and breached each day, and where breaches
                            concentrate. <HelpLink slug="charts-explained">Reading the charts</HelpLink>
                        </>,
                        <>
                            <UiLabel>SLA Records</UiLabel> (side menu): every SLA, with status chips and a search.
                        </>,
                    ]}
                />
            ),
        },
        {
            id: 'data',
            title: 'Where the data comes from',
            body: (
                <>
                    <HelpText>
                        Each row is an SLA KPI instance from Dynamics 365: one SLA timer on one case. The dashboard adds
                        the case’s number, subject, priority and owner, and the SLA item it measures.
                    </HelpText>
                    <HelpText>
                        The data refreshes by itself every 5 minutes, and whenever you press <UiLabel>Refresh</UiLabel>.
                        It can be a few minutes behind Dynamics.{' '}
                        <HelpLink slug="faq" section="freshness">
                            How fresh is the data?
                        </HelpLink>
                    </HelpText>
                </>
            ),
        },
    ],
}
