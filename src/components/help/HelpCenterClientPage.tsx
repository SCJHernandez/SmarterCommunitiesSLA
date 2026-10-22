'use client'

import { useMemo, useState } from 'react'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/shared/EmptyState'
import HelpArticleCard from './HelpArticleCard'
import {
    ActionCenterIcon,
    ClearIcon,
    GettingStartedIcon,
    MetricsIcon,
    SearchIcon,
    TroubleshootingIcon,
} from '@/configs/icons.config'
import { type HelpArticleSummary, type HelpCategory, type HelpCategoryKey } from '@/@types/help/HelpArticle'
import { searchHelpArticles } from '@/utils/help/searchHelpArticles'
import type { ElementType } from 'react'

const CATEGORY_ICON: Record<HelpCategoryKey, ElementType> = {
    'getting-started': GettingStartedIcon,
    metrics: MetricsIcon,
    using: ActionCenterIcon,
    troubleshooting: TroubleshootingIcon,
}

const categoryAnchor = (key: HelpCategoryKey) => `topic-${key}`

interface HelpCenterClientPageProps {
    articles: HelpArticleSummary[]
    categories: HelpCategory[]
    popular: string[]
}

/** The Help Center: a search over every article, topics to browse, and the most useful articles first. */
export default function HelpCenterClientPage({ articles, categories, popular }: HelpCenterClientPageProps) {
    const [query, setQuery] = useState('')
    const results = useMemo(() => searchHelpArticles(articles, query), [articles, query])
    const searching = query.trim().length > 0
    const categoryTitle = (key: HelpCategoryKey) => categories.find((c) => c.key === key)?.title

    return (
        <div className="flex flex-col gap-10">
            {/* Search */}
            <section className="rounded-2xl bg-linear-to-br from-primary-subtle via-white to-cyan-50 px-4 py-12 text-center sm:px-8 dark:from-gray-700 dark:via-gray-800 dark:to-gray-800">
                <h2 className="mb-2">Help Center</h2>
                <p className="mx-auto mb-6 max-w-xl text-gray-500">
                    How the dashboard works, how every number is calculated, and what to do when something looks wrong.
                </p>
                <div className="mx-auto max-w-2xl">
                    <Input
                        size="lg"
                        autoFocus
                        className="shadow-sm"
                        prefix={<SearchIcon className="text-xl" />}
                        suffix={
                            searching ? (
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={() => setQuery('')}
                                    aria-label="Clear the search"
                                >
                                    <ClearIcon className="text-lg" />
                                </button>
                            ) : undefined
                        }
                        placeholder="Search, e.g. “success rate”, “paused” or “can’t find a case”"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search the help articles"
                    />
                </div>
            </section>

            {searching ? (
                <section className="flex flex-col gap-4">
                    <h5>
                        {results.length} {results.length === 1 ? 'article' : 'articles'} for “{query.trim()}”
                    </h5>
                    {results.length ? (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {results.map((article) => (
                                <HelpArticleCard
                                    key={article.slug}
                                    article={article}
                                    meta={categoryTitle(article.category)}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={SearchIcon}
                            title="No articles match"
                            description="Try fewer or different words, or browse the topics below."
                        />
                    )}
                </section>
            ) : (
                <>
                    {/* Topics */}
                    <section className="flex flex-col gap-4">
                        <h4>Browse by topic</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {categories.map((category) => {
                                const Icon = CATEGORY_ICON[category.key]
                                const count = articles.filter((a) => a.category === category.key).length
                                return (
                                    <a
                                        key={category.key}
                                        href={`#${categoryAnchor(category.key)}`}
                                        className="flex flex-col items-center rounded-2xl bg-gray-50 p-6 text-center transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                                    >
                                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-primary shadow-sm dark:bg-gray-800">
                                            <Icon />
                                        </span>
                                        <h6 className="mb-1">{category.title}</h6>
                                        <p className="mb-3 text-sm text-gray-500">{category.description}</p>
                                        <span className="mt-auto text-sm font-semibold text-primary">
                                            {count} {count === 1 ? 'article' : 'articles'}
                                        </span>
                                    </a>
                                )
                            })}
                        </div>
                    </section>

                    {/* Most useful first */}
                    <section className="flex flex-col gap-4">
                        <h4>Popular articles</h4>
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {popular
                                .map((slug) => articles.find((a) => a.slug === slug))
                                .filter((a): a is HelpArticleSummary => !!a)
                                .map((article) => (
                                    <HelpArticleCard
                                        key={article.slug}
                                        article={article}
                                        meta={categoryTitle(article.category)}
                                    />
                                ))}
                        </div>
                    </section>

                    {/* Every article, by topic */}
                    {categories.map((category) => (
                        <section
                            key={category.key}
                            id={categoryAnchor(category.key)}
                            className="flex scroll-mt-24 flex-col gap-4"
                        >
                            <div>
                                <h4 className="mb-1">{category.title}</h4>
                                <p className="text-sm text-gray-500">{category.description}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {articles
                                    .filter((a) => a.category === category.key)
                                    .map((article) => (
                                        <HelpArticleCard key={article.slug} article={article} />
                                    ))}
                            </div>
                        </section>
                    ))}
                </>
            )}
        </div>
    )
}
