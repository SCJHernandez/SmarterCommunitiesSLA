import Tag from '@/components/ui/Tag'
import { type SlaStatusName, slaStatusTagClass } from '@/@types/sla/SlaStatusOptions'
import classNames from '@/utils/classNames'

interface SlaStatusTagProps {
    status: SlaStatusName
    className?: string
}

export default function SlaStatusTag({ status, className }: SlaStatusTagProps) {
    return <Tag className={classNames('whitespace-nowrap', slaStatusTagClass[status], className)}>{status}</Tag>
}
