import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'
import { formatMinutes, minutesUntil } from '@/utils/sla/slaCalculations'
import classNames from '@/utils/classNames'

interface SlaUrgencyProps {
    instance: SlaKpiInstance
    now?: Date
}

/** Time left before the deadline, or how long ago it was breached. */
export default function SlaUrgency({ instance, now = new Date() }: SlaUrgencyProps) {
    if (instance.status === 'Succeeded') return <span className="text-success">Met</span>
    if (instance.status === 'Paused') {
        // How long it's been paused matters more than a deadline that isn't counting down
        return (
            <span className="text-gray-500">
                Paused{instance.pausedOn ? ` for ${formatMinutes(-minutesUntil(instance.pausedOn, now))}` : ''}
            </span>
        )
    }
    if (instance.status === 'Canceled' || !instance.failureTime) return <span className="text-gray-400">—</span>

    const minutes = minutesUntil(instance.failureTime, now)
    if (minutes < 0 || instance.status === 'Noncompliant') {
        return <span className="font-semibold text-error">Overdue {formatMinutes(-minutes)}</span>
    }
    return (
        <span
            className={classNames(
                'font-semibold',
                minutes < 60 ? 'text-error' : minutes < 240 ? 'text-warning' : 'text-gray-700 dark:text-gray-200',
            )}
        >
            {formatMinutes(minutes)} left
        </span>
    )
}
