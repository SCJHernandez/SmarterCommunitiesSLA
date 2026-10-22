import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpLink, HelpList, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'faq',
    title: 'Frequently asked questions',
    summary:
        'Numbers that differ from Dynamics, data freshness, missing cases, sign-in problems and filters that reset.',
    category: 'troubleshooting',
    updatedOn: '2026-10-22',
    readMinutes: 4,
    keywords: [
        'faq',
        'problem',
        'troubleshoot',
        'wrong',
        'missing',
        'refresh',
        'stale',
        'cannot',
        "can't",
        'error',
        'reset',
    ],
    related: ['how-metrics-are-calculated', 'roles-and-access'],
    sections: [
        {
            id: 'numbers-differ',
            title: 'Why don’t the numbers match a Dynamics view?',
            body: (
                <HelpList
                    items={[
                        <>
                            SLA timers left running on resolved or cancelled cases are left out.{' '}
                            <HelpLink slug="sla-statuses" section="closed-cases">
                                Why
                            </HelpLink>
                        </>,
                        <>
                            SLAs past their deadline count as breached even if Dynamics still says In Progress.{' '}
                            <HelpLink slug="sla-statuses" section="overdue">
                                Why
                            </HelpLink>
                        </>,
                        <>
                            Periods go by when the SLA started, in your time zone. A Dynamics view may filter by the
                            case’s dates instead.
                        </>,
                        <>The dashboard can be a few minutes behind (see below).</>,
                    ]}
                />
            ),
        },
        {
            id: 'freshness',
            title: 'How fresh is the data?',
            body: (
                <HelpText>
                    The dashboard reloads by itself every 5 minutes, and when you press <UiLabel>Refresh</UiLabel>. The
                    time of the last update is next to the button. To keep Dynamics fast, results are reused for up to 3
                    minutes (1 minute for open cases), so a change made in Dynamics can take a few minutes to appear.
                </HelpText>
            ),
        },
        {
            id: 'missing-case',
            title: 'I can’t find a case',
            body: (
                <HelpList
                    items={[
                        <>
                            Check the period: SLA Records lists SLAs that <em>started</em> in it. Turn on{' '}
                            <UiLabel>Open cases only</UiLabel> to list every open case, whatever the period.
                        </>,
                        <>
                            Check the other filters, and press <UiLabel>Clear</UiLabel> if any are on. They’re
                            remembered from last time.
                        </>,
                        <>Only cases with an SLA are listed.</>,
                    ]}
                />
            ),
        },
        {
            id: 'not-in-period',
            title: 'A case says it isn’t in the selected period',
            body: (
                <HelpText>
                    That SLA started outside the period and its case is closed. Pick a longer period, or the month it
                    started in.
                </HelpText>
            ),
        },
        {
            id: 'no-history',
            title: 'The case history isn’t available',
            body: (
                <HelpText>
                    The app needs a Dynamics privilege to read it.{' '}
                    <HelpLink slug="case-details-and-history" section="history-unavailable">
                        What to ask for
                    </HelpLink>
                </HelpText>
            ),
        },
        {
            id: 'roles-page',
            title: 'I can’t see Roles & Permissions',
            body: (
                <HelpText>
                    Only Admins can. <HelpLink slug="roles-and-access">Roles and how to get one</HelpLink>
                </HelpText>
            ),
        },
        {
            id: 'sign-in',
            title: 'I can’t sign in',
            body: (
                <HelpList
                    items={[
                        <>Use your work account: a company email address, not a personal Microsoft account.</>,
                        <>
                            Signed in with the wrong account? Sign out, then sign in again. You’ll be asked which
                            account to use.
                        </>,
                        <>If you’re told you don’t have access, ask an Admin for a role.</>,
                    ]}
                />
            ),
        },
        {
            id: 'filters-reset',
            title: 'My filters reset',
            body: (
                <HelpText>
                    Filters are remembered in this browser only. A different computer or browser, a private window, or
                    clearing your browsing data starts from the defaults.{' '}
                    <HelpLink slug="filters" section="remembered">
                        Saved filters
                    </HelpLink>
                </HelpText>
            ),
        },
    ],
}
