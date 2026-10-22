import { isValidElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { HELP_ARTICLES, HELP_CATEGORIES, POPULAR_HELP_ARTICLES, getHelpArticle, toHelpArticleSummary } from '.'
import { searchHelpArticles } from '@/utils/help/searchHelpArticles'

/** Every `<HelpLink slug section>` in a piece of content. */
const findLinks = (node: ReactNode): { slug: string; section?: string }[] => {
    if (Array.isArray(node)) return node.flatMap(findLinks)
    if (!isValidElement(node)) return []
    const props = node.props as {
        slug?: string
        section?: string
        children?: ReactNode
        items?: ReactNode[]
        rows?: ReactNode[][]
    }
    const own = typeof props.slug === 'string' ? [{ slug: props.slug, section: props.section }] : []
    return [
        ...own,
        ...findLinks(props.children),
        ...findLinks(props.items ?? []),
        ...findLinks((props.rows ?? []).flat()),
    ]
}

describe('help articles', () => {
    it('have unique slugs, and unique section ids within each article', () => {
        const slugs = HELP_ARTICLES.map((a) => a.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const article of HELP_ARTICLES) {
            const ids = article.sections.map((s) => s.id)
            expect(new Set(ids).size, article.slug).toBe(ids.length)
            expect(
                ids.every((id) => /^[a-z0-9-]+$/.test(id)),
                article.slug,
            ).toBe(true)
        }
    })

    it('belong to a category, and every category has articles', () => {
        const keys = HELP_CATEGORIES.map((c) => c.key)
        for (const article of HELP_ARTICLES) expect(keys).toContain(article.category)
        for (const key of keys)
            expect(
                HELP_ARTICLES.some((a) => a.category === key),
                key,
            ).toBe(true)
    })

    it('only link to articles and sections that exist', () => {
        const targets = [
            ...POPULAR_HELP_ARTICLES.map((slug) => ({ slug, from: 'popular' })),
            ...HELP_ARTICLES.flatMap((a) => (a.related ?? []).map((slug) => ({ slug, from: `${a.slug} related` }))),
            ...HELP_ARTICLES.flatMap((a) =>
                a.sections.flatMap((s) => findLinks(s.body).map((link) => ({ ...link, from: `${a.slug}#${s.id}` }))),
            ),
        ]
        expect(targets.length).toBeGreaterThan(20)
        for (const { slug, section, from } of targets as { slug: string; section?: string; from: string }[]) {
            const article = getHelpArticle(slug)
            expect(article, `${from} → ${slug}`).toBeDefined()
            if (section)
                expect(
                    article!.sections.map((s) => s.id),
                    `${from} → ${slug}#${section}`,
                ).toContain(section)
        }
    })
})

describe('searchHelpArticles', () => {
    const summaries = HELP_ARTICLES.map(toHelpArticleSummary)
    const search = (query: string) => searchHelpArticles(summaries, query).map((a) => a.slug)

    it('returns everything for an empty query', () => {
        expect(search('  ')).toHaveLength(HELP_ARTICLES.length)
    })

    it('finds articles by keyword, heading or title, best match first', () => {
        expect(search('median')[0]).toBe('how-metrics-are-calculated')
        expect(search('success rate formula')[0]).toBe('how-metrics-are-calculated')
        expect(search('overdue')).toContain('sla-statuses')
        expect(search('Action Center')[0]).toBe('action-center')
    })

    it('needs every word to match, ignoring case and punctuation', () => {
        expect(search('CAN’T SIGN')).toEqual(['faq'])
        expect(search('median nonsenseword')).toEqual([])
    })
})
