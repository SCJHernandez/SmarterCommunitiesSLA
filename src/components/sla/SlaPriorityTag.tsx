import Tag from '@/components/ui/Tag'
import { getPriorityLabel, getPriorityTagClass } from '@/utils/sla/priority'
import classNames from '@/utils/classNames'

interface SlaPriorityTagProps {
    /** Dataverse priority, e.g. "1 - Emergency" */
    priority: string
    className?: string
}

export default function SlaPriorityTag({ priority, className }: SlaPriorityTagProps) {
    return (
        <span title={priority}>
            <Tag className={classNames('whitespace-nowrap', getPriorityTagClass(priority), className)}>
                {getPriorityLabel(priority) || '—'}
            </Tag>
        </span>
    )
}
