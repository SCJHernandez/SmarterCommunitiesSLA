import {
    type HelpArticle,
    type HelpArticleSummary,
    type HelpCategory,
    type HelpCategoryKey,
} from '@/@types/help/HelpArticle'
import { article as actionCenter } from './action-center'
import { article as caseDetailsAndHistory } from './case-details-and-history'
import { article as chartsExplained } from './charts-explained'
import { article as comparingPeriods } from './comparing-periods'
import { article as dailyRoutine } from './daily-routine'
import { article as faq } from './faq'
import { article as filters } from './filters'
import { article as howMetricsAreCalculated } from './how-metrics-are-calculated'
import { article as insights } from './insights'
import { article as rolesAndAccess } from './roles-and-access'
import { article as slaStatuses } from './sla-statuses'
import { article as whatIsSlaPerformance } from './what-is-sla-performance'

// The Help Center's contents. To add an article: write it next to these (one file per article, built from
// ../HelpContent), add it to HELP_ARTICLES in reading order, and link it from related articles.

export const HELP_CATEGORIES: HelpCategory[] = [
    {
        key: 'getting-started',
        title: 'Getting started',
        description: 'What the dashboard is for, a daily routine, and signing in.',
    },
    {
        key: 'metrics',
        title: 'Metrics & formulas',
        description: 'How every number is calculated, compared and charted.',
    },
    {
        key: 'using',
        title: 'Using the dashboard',
        description: 'Filters, the Action Center, insights and case details.',
    },
    {
        key: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Answers when something looks wrong or is missing.',
    },
]

/** In reading order within each category. */
export const HELP_ARTICLES: HelpArticle[] = [
    whatIsSlaPerformance,
    dailyRoutine,
    rolesAndAccess,
    howMetricsAreCalculated,
    comparingPeriods,
    slaStatuses,
    chartsExplained,
    filters,
    actionCenter,
    insights,
    caseDetailsAndHistory,
    faq,
]

/** Shown first on the Help Center */
export const POPULAR_HELP_ARTICLES = ['how-metrics-are-calculated', 'daily-routine', 'action-center', 'faq']

export const getHelpArticle = (slug: string) => HELP_ARTICLES.find((a) => a.slug === slug)

export const getHelpCategory = (key: HelpCategoryKey) => HELP_CATEGORIES.find((c) => c.key === key)!

/** Everything but the content, for listing and searching (and for passing to client components). */
export const toHelpArticleSummary = ({ sections, ...article }: HelpArticle): HelpArticleSummary => ({
    ...article,
    sectionTitles: sections.map((s) => s.title),
})
