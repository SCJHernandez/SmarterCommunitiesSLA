import classNames from '@/utils/classNames'
import type { ComponentType } from 'react'

export interface WithHeaderItemProps {
    className?: string
    hoverable?: boolean
}

/** Wraps a header control with the header's spacing and hover styles. */
export default function withHeaderItem<P extends object>(Component: ComponentType<P>) {
    const Wrapped = ({ className, hoverable = true, ...rest }: P & WithHeaderItemProps) => (
        <div className={classNames('header-action-item', hoverable && 'header-action-item-hoverable', className)}>
            <Component {...(rest as P)} />
        </div>
    )
    Wrapped.displayName = `withHeaderItem(${Component.displayName || Component.name || 'Component'})`
    return Wrapped
}
