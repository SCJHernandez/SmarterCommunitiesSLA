'use client'

import Dialog from '@/components/ui/Dialog'
import Button, { type ButtonProps } from '@/components/ui/Button'
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

type ConfirmDialogType = 'info' | 'success' | 'warning' | 'danger'

interface ConfirmDialogProps {
    isOpen: boolean
    type?: ConfirmDialogType
    title: string
    children?: ReactNode
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    onClose: () => void
    /** Disables closing (Esc/overlay/×) while an action runs */
    closable?: boolean
    /** Submit a <form id={confirmForm}> in the body instead of calling onConfirm */
    confirmForm?: string
    confirmButtonProps?: Pick<ButtonProps, 'loading' | 'disabled'>
}

const TYPE_STYLE: Record<ConfirmDialogType, { icon: ReactNode; iconClass: string; buttonClass?: string }> = {
    info: { icon: <InfoIcon />, iconClass: 'bg-info-subtle text-info' },
    success: { icon: <SuccessIcon />, iconClass: 'bg-success-subtle text-success' },
    warning: { icon: <WarningIcon />, iconClass: 'bg-warning-subtle text-warning' },
    danger: { icon: <ErrorIcon />, iconClass: 'bg-error-subtle text-error', buttonClass: 'bg-error hover:bg-error' },
}

/** Confirm/cancel dialog. Put form fields in `children` and set `confirmForm` to validate them. */
export default function ConfirmDialog({
    isOpen,
    type = 'info',
    title,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onClose,
    closable = true,
    confirmForm,
    confirmButtonProps,
}: ConfirmDialogProps) {
    const style = TYPE_STYLE[type]
    return (
        <Dialog
            isOpen={isOpen}
            closable={closable}
            onClose={() => closable && onClose()}
            onRequestClose={() => closable && onClose()}
            shouldCloseOnOverlayClick={closable}
            shouldCloseOnEsc={closable}
            contentClassName="pb-0 px-0"
        >
            <div className="flex items-start gap-4 px-6 pb-6">
                <div
                    className={classNames(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl',
                        style.iconClass,
                    )}
                >
                    {style.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h5 className="mb-2">{title}</h5>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{children}</div>
                </div>
            </div>
            <div className="flex justify-end gap-2 rounded-b-2xl border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
                <Button size="sm" variant="default" onClick={onClose} disabled={!closable}>
                    {cancelText}
                </Button>
                <Button
                    size="sm"
                    variant="solid"
                    className={style.buttonClass}
                    type={confirmForm ? 'submit' : 'button'}
                    form={confirmForm}
                    onClick={confirmForm ? undefined : onConfirm}
                    {...confirmButtonProps}
                >
                    {confirmText}
                </Button>
            </div>
        </Dialog>
    )
}
