import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpLink, HelpList, HelpNote, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'case-details-and-history',
    title: 'Case details and history',
    summary:
        'The case panel: the SLA’s status and timeline, the case’s audit history, and opening the case in Dynamics.',
    category: 'using',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: ['case', 'drawer', 'panel', 'timeline', 'history', 'audit', 'who changed', 'dynamics', 'link', 'share'],
    related: ['action-center', 'faq'],
    sections: [
        {
            id: 'opening',
            title: 'Opening a case',
            body: (
                <HelpText>
                    Click a case in the Action Center or SLA Records, or under <UiLabel>Recently viewed</UiLabel> in the
                    side menu. The panel has its own web address, so you can copy it from the address bar and send it to
                    someone.
                </HelpText>
            ),
        },
        {
            id: 'whats-shown',
            title: 'What the panel shows',
            body: (
                <HelpList
                    items={[
                        <>
                            <UiLabel>Status</UiLabel>: a one-line summary, such as “Breached 2 days ago” or “3h 10m left
                            before the deadline”.
                        </>,
                        <>
                            <UiLabel>Case</UiLabel>: subject, priority and owner.
                        </>,
                        <>
                            <UiLabel>SLA</UiLabel>: the SLA item and status.{' '}
                            <UiLabel>Paused for (business hours)</UiLabel> is the total time spent paused.{' '}
                            <UiLabel>Time to meet</UiLabel> shows for met SLAs.
                        </>,
                        <>
                            <UiLabel>SLA timeline</UiLabel>: started, warning threshold, and met, deadline or breached,
                            in the order they happened.
                        </>,
                    ]}
                />
            ),
        },
        {
            id: 'case-history',
            title: 'Case history',
            body: (
                <>
                    <HelpText>
                        The case’s audit history from Dynamics 365, newest first (the latest 50 changes): who created,
                        assigned, updated, merged or deleted it, and what changed from what. Bookkeeping fields that
                        change on every save are left out.
                    </HelpText>
                    <HelpText>
                        Use it to see who has the case now, when it last moved, and whether it has been passed around.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'history-unavailable',
            title: 'If the history isn’t available',
            body: (
                <HelpNote type="warning">
                    The app reads the history with its own Dynamics account, which needs the “View Audit History”
                    privilege. If the panel says the history isn’t available, ask your Dynamics administrator to check
                    that privilege. Everything else on the panel still works.
                </HelpNote>
            ),
        },
        {
            id: 'acting',
            title: 'Acting on the case',
            body: (
                <HelpText>
                    SLA Performance is read-only. <UiLabel>Open in Dynamics</UiLabel> opens the case in Dynamics 365 in
                    a new tab, where you can update it. The dashboard picks the change up on its next refresh.{' '}
                    <HelpLink slug="faq" section="freshness">
                        How fresh is the data?
                    </HelpLink>
                </HelpText>
            ),
        },
    ],
}
