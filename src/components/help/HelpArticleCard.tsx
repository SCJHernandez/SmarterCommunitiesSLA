import Link from 'next/link'
import { ArticleIcon, ForwardIcon } from '@/configs/icons.config'
import { getHelpArticlePath } from '@/configs/app.config'
import { type HelpArticleSummary } from '@/@types/help/HelpArticle'

interface HelpArticleCardProps {
    article: Pick<HelpArticleSummary, 'slug' | 'title' | 'summary' | 'readMinutes'>
    /** e.g. the category, shown after the reading time */
    meta?: string
}

/** One article in a list: title, summary and reading time; the whole row opens it. */
export default function HelpArticleCard({ article, meta }: HelpArticleCardProps) {
    return (
        <Link
            href={getHelpArticlePath(article.slug)}
            className="group flex items-start gap-4 rounded-2xl border border-gray-200 p-4 transition-colors hover:border-primary hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xl text-primary">
                <ArticleIcon />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold text-gray-900 group-hover:text-primary dark:text-gray-100">
                    {article.title}
                </span>
                <span className="text-sm text-gray-500">{article.summary}</span>
                <span className="text-xs text-gray-400">
                    {article.readMinutes} min read{meta ? ` · ${meta}` : ''}
                </span>
            </span>
            <ForwardIcon className="mt-3 shrink-0 text-gray-400 group-hover:text-primary" aria-hidden />
        </Link>
    )
}
