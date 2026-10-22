import Link from 'next/link'
import Alert from '@/components/ui/Alert'
import { getHelpArticlePath } from '@/configs/app.config'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

// Building blocks for help articles, so every article reads the same way.

export function HelpText({ children }: { children: ReactNode }) {
    return <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-300">{children}</p>
}

/** A bulleted (or numbered) list */
export function HelpList({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
    const List = ordered ? 'ol' : 'ul'
    return (
        <List
            className={classNames(
                'mb-4 flex flex-col gap-2 pl-6 leading-relaxed text-gray-600 dark:text-gray-300',
                ordered ? 'list-decimal' : 'list-disc',
            )}
        >
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </List>
    )
}

/** A calculation, set apart so it's easy to find and read */
export function HelpFormula({ label, children }: { label?: string; children: ReactNode }) {
    return (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
            {label && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>}
            <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{children}</div>
        </div>
    )
}

/** A worked example */
export function HelpExample({ children }: { children: ReactNode }) {
    return (
        <div className="mb-4 border-l-4 border-primary pl-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Example. </span>
            {children}
        </div>
    )
}

export function HelpTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
    return (
        <div className="mb-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-4 py-2 font-semibold">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-600 dark:divide-gray-700 dark:text-gray-300">
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {row.map((cell, column) => (
                                <td key={column} className="px-4 py-2 align-top">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/** A tip or caveat */
export function HelpNote({ type = 'info', children }: { type?: 'info' | 'warning'; children: ReactNode }) {
    return (
        <Alert showIcon type={type} className="mb-4">
            {children}
        </Alert>
    )
}

/** A link to another article (or one of its sections) */
export function HelpLink({ slug, section, children }: { slug: string; section?: string; children: ReactNode }) {
    return (
        <Link href={getHelpArticlePath(slug, section)} className="font-semibold text-primary hover:underline">
            {children}
        </Link>
    )
}

/** The name of something on screen (a button, tab or filter) */
export function UiLabel({ children }: { children: ReactNode }) {
    return <span className="font-semibold text-gray-900 dark:text-gray-100">{children}</span>
}
