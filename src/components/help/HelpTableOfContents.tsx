'use client'

import { useEffect, useState } from 'react'
import classNames from '@/utils/classNames'

interface HelpTableOfContentsProps {
    sections: { id: string; title: string }[]
}

/** "In this page": the article's headings, with the one being read highlighted. */
export default function HelpTableOfContents({ sections }: HelpTableOfContentsProps) {
    const [active, setActive] = useState<string | null>(null)

    useEffect(() => {
        const elements = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el)
        const visible = new Set<string>()
        // A heading counts as "being read" from when it reaches the upper part of the screen
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target.id)
                    else visible.delete(entry.target.id)
                }
                const first = sections.find((s) => visible.has(s.id))
                if (first) setActive(first.id)
            },
            { rootMargin: '0px 0px -60% 0px' },
        )
        elements.forEach((el) => observer.observe(el))
        return () => observer.disconnect()
    }, [sections])

    return (
        <nav aria-label="In this page" className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
            <h6 className="mb-3">In this page</h6>
            <ul className="flex flex-col gap-1">
                {sections.map((section) => (
                    <li key={section.id}>
                        <a
                            href={`#${section.id}`}
                            onClick={() => setActive(section.id)}
                            className={classNames(
                                'block rounded-lg px-2 py-1.5 text-sm transition-colors',
                                active === section.id
                                    ? 'bg-primary-subtle font-semibold text-primary'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100',
                            )}
                        >
                            {section.title}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
