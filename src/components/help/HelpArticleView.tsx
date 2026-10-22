import Link from 'next/link'
import Tag from '@/components/ui/Tag'
import PageBreadcrumbs from '@/components/shared/PageBreadcrumbs'
import HelpArticleCard from './HelpArticleCard'
import HelpTableOfContents from './HelpTableOfContents'
import { getHelpArticle, getHelpCategory, toHelpArticleSummary } from './articles'
import { TroubleshootingIcon } from '@/configs/icons.config'
import { getHelpArticlePath, helpPath } from '@/configs/app.config'
import { type HelpArticle } from '@/@types/help/HelpArticle'
import { formatDate } from '@/utils/dates'

/** A help article: its sections down the page, "In this page" alongside, and related articles to finish. */
export default function HelpArticleView({ article }: { article: HelpArticle }) {
    const category = getHelpCategory(article.category)
    const related = (article.related ?? [])
        .map(getHelpArticle)
        .filter((a): a is HelpArticle => !!a)
        .map(toHelpArticleSummary)

    return (
        <>
            <PageBreadcrumbs
                items={[
                    { label: 'Help Center', href: helpPath },
                    { label: category.title, href: `${helpPath}#topic-${category.key}` },
                    { label: article.title },
                ]}
            />
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
                <article className="min-w-0 max-w-3xl">
                    <header className="mb-8">
                        <h3 className="mb-3">{article.title}</h3>
                        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <Tag className="border-transparent bg-primary-subtle text-primary">{category.title}</Tag>
                            <span>Updated {formatDate(article.updatedOn)}</span>
                            <span aria-hidden>•</span>
                            <span>{article.readMinutes} min read</span>
                        </div>
                        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{article.summary}</p>
                    </header>

                    {article.sections.map((section) => (
                        <section key={section.id} className="mb-8">
                            <h5 id={section.id} className="mb-3 scroll-mt-24">
                                {section.title}
                            </h5>
                            {section.body}
                        </section>
                    ))}

                    {related.length > 0 && (
                        <section className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
                            <h5 className="mb-4">Related articles</h5>
                            <div className="flex flex-col gap-3">
                                {related.map((a) => (
                                    <HelpArticleCard
                                        key={a.slug}
                                        article={a}
                                        meta={getHelpCategory(a.category).title}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </article>

                <aside className="hidden lg:block">
                    <div className="sticky top-24 flex flex-col gap-4">
                        <HelpTableOfContents sections={article.sections.map(({ id, title }) => ({ id, title }))} />
                        {article.slug !== 'faq' && (
                            <Link
                                href={getHelpArticlePath('faq')}
                                className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 text-sm hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                            >
                                <TroubleshootingIcon className="shrink-0 text-2xl text-primary" />
                                <span>
                                    <span className="block font-semibold text-gray-900 dark:text-gray-100">
                                        Something not right?
                                    </span>
                                    <span className="text-gray-500">See the frequently asked questions</span>
                                </span>
                            </Link>
                        )}
                    </div>
                </aside>
            </div>
        </>
    )
}
