import classNames from '@/utils/classNames'
import type { CommonProps } from '@/@types/common'

export default function Container({ children, className }: CommonProps) {
    return <div className={classNames('container mx-auto', className)}>{children}</div>
}
