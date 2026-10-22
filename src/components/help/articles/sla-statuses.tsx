import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpLink, HelpNote, HelpTable, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'sla-statuses',
    title: 'SLA statuses explained',
    summary:
        'On track, At risk, Breached, Met, Paused and Cancelled, and how they map to the statuses in Dynamics 365.',
    category: 'metrics',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: [
        'status',
        'in progress',
        'nearing noncompliance',
        'noncompliant',
        'succeeded',
        'canceled',
        'overdue',
        'warning time',
        'failure time',
        'deadline',
        'pause',
    ],
    related: ['how-metrics-are-calculated', 'action-center'],
    sections: [
        {
            id: 'statuses',
            title: 'Statuses on the dashboard',
            body: (
                <HelpTable
                    headers={['Dashboard', 'In Dynamics 365', 'Means']}
                    rows={[
                        [
                            <UiLabel key="o">On track</UiLabel>,
                            'In Progress',
                            'Running, and not yet past the warning time',
                        ],
                        [
                            <UiLabel key="r">At risk</UiLabel>,
                            'Nearing Noncompliance, or In Progress past the warning time',
                            'The deadline is close: act now to meet it',
                        ],
                        [
                            <UiLabel key="b">Breached</UiLabel>,
                            'Noncompliant, or still running after the deadline',
                            'The deadline was missed',
                        ],
                        [<UiLabel key="m">Met</UiLabel>, 'Succeeded', 'Met before the deadline'],
                        [<UiLabel key="p">Paused</UiLabel>, 'Paused', 'The timer is stopped'],
                        [<UiLabel key="c">Cancelled</UiLabel>, 'Canceled', 'The SLA no longer applies'],
                    ]}
                />
            ),
        },
        {
            id: 'overdue',
            title: 'Breached here, In Progress in Dynamics',
            body: (
                <HelpText>
                    Dynamics updates SLA statuses in the background, so an SLA can still say In Progress a while after
                    its deadline. Once the deadline has passed the SLA has been missed, so the dashboard counts it as{' '}
                    <UiLabel>Breached</UiLabel> straight away.
                </HelpText>
            ),
        },
        {
            id: 'warning-and-deadline',
            title: 'Warning time and deadline',
            body: (
                <HelpText>
                    Each SLA item in Dynamics sets a <UiLabel>warning time</UiLabel> and a <UiLabel>deadline</UiLabel>{' '}
                    (failure time). Both are on the case panel’s <UiLabel>SLA timeline</UiLabel>. The warning time can
                    come before the SLA itself started, because Dynamics can measure it from when the case was created.
                </HelpText>
            ),
        },
        {
            id: 'paused',
            title: 'Paused SLAs',
            body: (
                <>
                    <HelpText>
                        The timer stops while a case is in a status set up to pause it, for example when waiting on the
                        customer. When it resumes, the deadline moves out by the time it was paused.
                    </HelpText>
                    <HelpText>
                        The case panel shows <UiLabel>Paused for (business hours)</UiLabel>: the total time the SLA
                        spent paused. The Action Center shows how long the current pause has lasted.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'closed-cases',
            title: 'Timers on closed cases',
            body: (
                <HelpNote>
                    Dynamics sometimes leaves an SLA “In Progress” after its case is resolved or cancelled. Nobody can
                    act on those, so the dashboard leaves them out of every count.{' '}
                    <HelpLink slug="faq" section="numbers-differ">
                        Why numbers can differ from Dynamics
                    </HelpLink>
                </HelpNote>
            ),
        },
    ],
}
