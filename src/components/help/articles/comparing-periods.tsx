import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpExample, HelpList, HelpNote, HelpTable, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'comparing-periods',
    title: 'How periods are compared',
    summary: 'Rolling periods, calendar months, and what each one is compared with, always like for like.',
    category: 'metrics',
    updatedOn: '2026-10-22',
    readMinutes: 3,
    keywords: ['period', 'month', 'vs last period', 'previous', 'comparison', 'trend', '30 days', 'time zone'],
    related: ['how-metrics-are-calculated', 'filters'],
    sections: [
        {
            id: 'choosing',
            title: 'Choosing a period',
            body: (
                <HelpList
                    items={[
                        <>
                            <UiLabel>24 hours</UiLabel>, <UiLabel>7 days</UiLabel>, <UiLabel>30 days</UiLabel>,{' '}
                            <UiLabel>90 days</UiLabel>: a rolling window that ends now.
                        </>,
                        <>
                            <UiLabel>Or pick a month…</UiLabel>: any of the last 12 calendar months. This month runs up
                            to now.
                        </>,
                    ]}
                />
            ),
        },
        {
            id: 'compared-with',
            title: 'What each period is compared with',
            body: (
                <HelpTable
                    headers={['You pick', 'Compared with']}
                    rows={[
                        ['The last 24 hours, 7, 30 or 90 days', 'The same length of time just before it'],
                        ['A finished month (e.g. September)', 'The whole month before (August)'],
                        ['This month, so far (e.g. 1–22 October)', 'The same days of last month (1–22 September)'],
                    ]}
                />
            ),
        },
        {
            id: 'like-for-like',
            title: 'Why like for like',
            body: (
                <HelpExample>
                    On 22 October, comparing October so far with the whole of September would put 22 days against 30.
                    October would look quieter just because it isn’t over. Comparing 1–22 October with 1–22 September
                    keeps it fair.
                </HelpExample>
            ),
        },
        {
            id: 'which-period',
            title: 'Which period an SLA belongs to',
            body: (
                <>
                    <HelpText>
                        An SLA belongs to the period it <em>started</em> in, even if it was met or breached later. Days
                        and months follow your computer’s time zone.
                    </HelpText>
                    <HelpExample>
                        An SLA that started on 31 August and breached on 2 September counts in August’s cards. On the{' '}
                        <UiLabel>SLA flow per day</UiLabel> chart, its breach shows on 2 September, the day it happened.
                    </HelpExample>
                </>
            ),
        },
        {
            id: 'nothing-to-compare',
            title: 'When there’s nothing to compare',
            body: (
                <HelpNote>
                    If the previous period has no SLAs (or none met or breached, for the success rate), the card says
                    “No data to compare with …” instead of showing a change of 0.
                </HelpNote>
            ),
        },
    ],
}
