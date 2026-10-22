import type { ReactNode } from 'react'

interface PageHeaderProps {
    title: ReactNode
    description?: ReactNode
    actions?: ReactNode
}

/** Page title, one-line description and page-level actions. */
export default function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <h3 className="mb-1">{title}</h3>
                {description && <p className="text-gray-500">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    )
}
