import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpLink, HelpList, HelpNote, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'filters',
    title: 'Filtering, and saved filters',
    summary:
        'Narrowing the dashboard and SLA Records, clicking through to the SLAs behind a number, and how your filters are remembered.',
    category: 'using',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: [
        'filter',
        'period',
        'owner',
        'priority',
        'sla item',
        'status',
        'search',
        'saved',
        'remember',
        'clear',
        'drill down',
    ],
    related: ['comparing-periods', 'daily-routine'],
    sections: [
        {
            id: 'period',
            title: 'Period',
            body: (
                <HelpText>
                    Pick a rolling period or a month at the top of the dashboard or SLA Records. It applies to{' '}
                    <UiLabel>Performance</UiLabel>, <UiLabel>Trends</UiLabel> and the records list, but not to{' '}
                    <UiLabel>Needs attention now</UiLabel>, which always covers every open case.{' '}
                    <HelpLink slug="comparing-periods">How periods are compared</HelpLink>
                </HelpText>
            ),
        },
        {
            id: 'refine',
            title: 'Priority, SLA item and owner',
            body: (
                <>
                    <HelpText>
                        These narrow everything: the cards, Needs attention now, the charts and the records list. Each
                        lists the values found in the data; type in it to search.
                    </HelpText>
                    <HelpText>
                        A remembered choice with no SLAs in the current period shows as “(none in this period)”. Change
                        it or press <UiLabel>Clear</UiLabel>.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'records-only',
            title: 'Status, open cases and search (SLA Records)',
            body: (
                <HelpList
                    items={[
                        <>
                            <UiLabel>Status chips</UiLabel>: On track, At risk, Breached, Met, Paused, Cancelled, each
                            with how many SLAs it would show.{' '}
                            <HelpLink slug="sla-statuses">What each status means</HelpLink>
                        </>,
                        <>
                            <UiLabel>Open cases only</UiLabel>: lists every SLA on a case that’s open now, whatever the
                            period, the same SLAs as Needs attention now.
                        </>,
                        <>
                            <UiLabel>Search</UiLabel>: by case number, subject, owner or SLA item.
                        </>,
                    ]}
                />
            ),
        },
        {
            id: 'click-through',
            title: 'Clicking through to the SLAs',
            body: (
                <HelpText>
                    The cards, chart bars, insight links and open SLA counts can all be clicked. Each one sets the
                    matching filters and opens SLA Records, so you see exactly the SLAs behind the number.
                </HelpText>
            ),
        },
        {
            id: 'remembered',
            title: 'Your filters are remembered',
            body: (
                <>
                    <HelpText>
                        The dashboard and SLA Records open with the filters you used last: period, priority, SLA item,
                        owner, status and open cases only. The search box starts empty each time.
                    </HelpText>
                    <HelpNote>
                        They’re saved in this browser, for your account only. A different computer or browser, a private
                        window or clearing your browsing data starts from the defaults (the last 30 days, everything
                        else off). A month older than the last 12 goes back to the last 30 days.
                    </HelpNote>
                    <HelpText>
                        <UiLabel>Clear</UiLabel> turns the filters off but keeps the period.
                    </HelpText>
                </>
            ),
        },
    ],
}
