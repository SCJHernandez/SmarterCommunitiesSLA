import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import HelpArticleView from '@/components/help/HelpArticleView'
import { getHelpArticle } from '@/components/help/articles'

type HelpArticlePageProps = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: HelpArticlePageProps): Promise<Metadata> {
    const article = getHelpArticle((await params).slug)
    return article ? { title: article.title, description: article.summary } : { title: 'Help Center' }
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
    const article = getHelpArticle((await params).slug)
    if (!article) notFound()

    return <HelpArticleView article={article} />
}
