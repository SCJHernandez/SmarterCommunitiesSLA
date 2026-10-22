import type { Metadata } from 'next'
import HelpCenterClientPage from '@/components/help/HelpCenterClientPage'
import { HELP_ARTICLES, HELP_CATEGORIES, POPULAR_HELP_ARTICLES, toHelpArticleSummary } from '@/components/help/articles'

export const metadata: Metadata = { title: 'Help Center' }

export default function HelpCenterPage() {
    // Summaries only: the articles' content stays on the server
    return (
        <HelpCenterClientPage
            articles={HELP_ARTICLES.map(toHelpArticleSummary)}
            categories={HELP_CATEGORIES}
            popular={POPULAR_HELP_ARTICLES}
        />
    )
}
