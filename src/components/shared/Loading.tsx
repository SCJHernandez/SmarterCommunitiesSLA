import Spinner from '@/components/ui/Spinner'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface LoadingProps {
    loading: boolean
    /** Shown under the spinner — say what's loading */
    message?: string
    className?: string
    children?: ReactNode
}

/** Spinner while `loading`, children afterwards. */
export default function Loading({ loading, message, className, children }: LoadingProps) {
    if (!loading) return <>{children}</>
    return (
        <div className={classNames('flex flex-col items-center justify-center gap-3 py-16 text-gray-500', className)}>
            <Spinner size={36} />
            {message && <p className="text-sm font-medium">{message}</p>}
        </div>
    )
}
