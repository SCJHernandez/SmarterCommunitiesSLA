import classNames from '@/utils/classNames'
import type { ElementType, ReactNode } from 'react'

interface EmptyStateProps {
    icon?: ElementType
    title: string
    description?: ReactNode
    action?: ReactNode
    className?: string
}

/** Nothing to show yet — always say why, and what to do next. */
export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={classNames(
                'flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-600 dark:bg-gray-800',
                className,
            )}
        >
            {Icon && (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-3xl text-gray-400 dark:bg-gray-700">
                    <Icon />
                </div>
            )}
            <h5 className="mb-1">{title}</h5>
            {description && <p className="mb-5 max-w-md text-sm text-gray-500">{description}</p>}
            {action}
        </div>
    )
}
