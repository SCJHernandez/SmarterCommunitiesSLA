import { type HelpArticleSummary } from '@/@types/help/HelpArticle'

const normalize = (text: string) =>
    text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[’']/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()

/**
 * Articles matching every word of the query (in the title, summary, section headings or keywords), best first:
 * matches in the title, then in a section heading or keyword, then anywhere.
 */
export const searchHelpArticles = (articles: HelpArticleSummary[], query: string): HelpArticleSummary[] => {
    const words = normalize(query).split(' ').filter(Boolean)
    if (!words.length) return articles

    const scored = articles.flatMap((article) => {
        const title = normalize(article.title)
        const headings = normalize([...article.sectionTitles, ...article.keywords].join(' '))
        const everything = `${title} ${headings} ${normalize(article.summary)}`
        if (!words.every((word) => everything.includes(word))) return []
        const score = words.reduce((sum, word) => sum + (title.includes(word) ? 3 : headings.includes(word) ? 2 : 1), 0)
        return [{ article, score }]
    })
    return scored.sort((a, b) => b.score - a.score).map((s) => s.article)
}
