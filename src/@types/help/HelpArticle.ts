import type { ReactNode } from 'react'

// Built-in help articles (src/components/help/articles). They ship with the app — no backend — so they always
// describe the version that's running.

export type HelpCategoryKey = 'getting-started' | 'metrics' | 'using' | 'troubleshooting'

export interface HelpCategory {
    key: HelpCategoryKey
    title: string
    description: string
}

/** A heading in an article, listed under "In this page" and linkable as `#id`. */
export interface HelpSection {
    id: string
    title: string
    body: ReactNode
}

export interface HelpArticle {
    slug: string
    title: string
    /** One or two sentences: shown on the Help Center and under the title */
    summary: string
    category: HelpCategoryKey
    /** ISO date the content was last checked against the app */
    updatedOn: string
    readMinutes: number
    /** Extra words people might search for (e.g. "formula", "overdue") */
    keywords: string[]
    sections: HelpSection[]
    /** Slugs of articles to suggest at the end */
    related?: string[]
}

/** An article without its content — what the Help Center lists and searches. */
export type HelpArticleSummary = Omit<HelpArticle, 'sections'> & { sectionTitles: string[] }
