'use client'

import Button from '@/components/ui/Button'
import { ErrorIcon, RefreshIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface ErrorStateProps {
    title?: string
    message: ReactNode
    onRetry?: () => void
    retryText?: string
    action?: ReactNode
    className?: string
}

/** Something failed — say what happened and offer the next step. */
export default function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    retryText = 'Try again',
    action,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={classNames(
                'flex flex-col items-center justify-center rounded-2xl border border-error/20 bg-error-subtle p-8 text-center',
                className,
            )}
            role="alert"
        >
            <ErrorIcon className="mb-3 text-4xl text-error" />
            <h5 className="mb-1">{title}</h5>
            <div className="mb-5 max-w-md text-sm text-gray-700 dark:text-gray-200">{message}</div>
            <div className="flex flex-wrap justify-center gap-2">
                {onRetry && (
                    <Button size="sm" variant="solid" icon={<RefreshIcon />} onClick={onRetry}>
                        {retryText}
                    </Button>
                )}
                {action}
            </div>
        </div>
    )
}
