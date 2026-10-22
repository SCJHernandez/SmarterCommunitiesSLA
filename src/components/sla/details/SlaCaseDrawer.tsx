'use client'

import { useMemo } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Drawer from '@/components/ui/Drawer'
import Timeline from '@/components/ui/Timeline'
import EmptyState from '@/components/shared/EmptyState'
import UserAvatar from '@/components/shared/UserAvatar'
import SlaPriorityTag from '@/components/sla/SlaPriorityTag'
import SlaStatusTag from '@/components/sla/SlaStatusTag'
import SlaCaseHistory from './SlaCaseHistory'
import { CaseIcon, ExternalLinkIcon } from '@/configs/icons.config'
import { getCrmCaseUrl, getSlaCasePath } from '@/configs/app.config'
import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'
import { useSlaStore } from '@/stores/SlaStore'
import { formatDateTime, fromNow } from '@/utils/dates'
import { formatMinutes, minutesUntil } from '@/utils/sla/slaCalculations'
import useCaseDetails from '@/utils/hooks/useCaseDetails'
import useRecordRecentItem from '@/utils/hooks/useRecordRecentItem'
import type { ReactNode } from 'react'

const statusAlert = (instance: SlaKpiInstance): { type: 'danger' | 'warning' | 'success' | 'info'; text: string } => {
    switch (instance.status) {
        case 'Noncompliant':
            return {
                type: 'danger',
                text: instance.failureTime
                    ? `Breached ${fromNow(instance.failureTime)}.`
                    : 'The SLA deadline was missed.',
            }
        case 'Nearing Noncompliance':
            return {
                type: 'warning',
                text: instance.failureTime
                    ? `${formatMinutes(minutesUntil(instance.failureTime))} left before the deadline.`
                    : 'Approaching the SLA deadline.',
            }
        case 'Succeeded':
            return { type: 'success', text: 'The SLA was met.' }
        case 'Paused':
            return { type: 'info', text: 'The SLA timer is paused.' }
        case 'Canceled':
            return { type: 'info', text: 'The SLA was cancelled.' }
        default:
            return { type: 'info', text: 'The SLA is on track.' }
    }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <div className="mb-1 text-xs text-gray-500">{label}</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{children}</div>
        </div>
    )
}

function CaseDetails({ instance }: { instance: SlaKpiInstance }) {
    const alert = statusAlert(instance)
    const milestones = [
        { label: 'SLA started', date: instance.createdOn },
        { label: 'Warning threshold', date: instance.warningTime },
        instance.succeededOn
            ? { label: 'SLA met', date: instance.succeededOn }
            : { label: instance.status === 'Noncompliant' ? 'Breached' : 'Deadline', date: instance.failureTime },
    ]
        .filter((m): m is { label: string; date: Date } => !!m.date)
        // Chronological: Dataverse measures the warning from the case's creation, which can precede the SLA record
        .sort((a, b) => a.date.getTime() - b.date.getTime())

    return (
        <div className="flex flex-col gap-6">
            <Alert showIcon type={alert.type} title={instance.status}>
                {alert.text}
            </Alert>

            <section className="flex flex-col gap-4">
                <h6>Case</h6>
                <Field label="Subject">{instance.regardingSubject}</Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Priority">
                        <SlaPriorityTag priority={instance.priority} />
                    </Field>
                    <Field label="Owner">
                        <span className="flex items-center gap-2">
                            <UserAvatar name={instance.owner} size={24} />
                            {instance.owner}
                        </span>
                    </Field>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h6>SLA</h6>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="SLA item">{instance.kpiName}</Field>
                    <Field label="Status">
                        <SlaStatusTag status={instance.status} />
                    </Field>
                    {!!instance.pausedBusinessMinutes && (
                        <Field label="Paused for (business hours)">
                            {formatMinutes(instance.pausedBusinessMinutes)}
                        </Field>
                    )}
                    {instance.status === 'Succeeded' && instance.succeededOn && (
                        <Field label="Time to meet">
                            {formatMinutes((instance.succeededOn.getTime() - instance.createdOn.getTime()) / 60_000)}
                        </Field>
                    )}
                </div>
            </section>

            <section>
                <h6 className="mb-4">SLA timeline</h6>
                <Timeline>
                    {milestones.map((m) => (
                        <Timeline.Item key={m.label}>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{m.label}</div>
                            <div className="text-xs text-gray-500">{formatDateTime(m.date)}</div>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </section>

            {instance.regardingType === 'incident' && instance.regardingId && (
                <section>
                    <h6 className="mb-1">Case history</h6>
                    <p className="mb-4 text-xs text-gray-500">Changes to the case in Dynamics 365, newest first.</p>
                    <SlaCaseHistory caseId={instance.regardingId} />
                </section>
            )}
        </div>
    )
}

/** Details of the SLA in `?case=`: status, case, SLA item and timeline, with a link to the case in Dynamics. */
export default function SlaCaseDrawer() {
    const { caseId, closeCase } = useCaseDetails()
    const records = useSlaStore((state) => state.records)
    const openRecords = useSlaStore((state) => state.openRecords)
    const loading = useSlaStore((state) => state.loading)
    // The period's SLAs, or open work — the Action Center lists open cases from before the period too
    const instance = useMemo(
        () => (caseId ? (records.find((r) => r.id === caseId) ?? openRecords.find((r) => r.id === caseId)) : undefined),
        [caseId, records, openRecords],
    )

    useRecordRecentItem(
        instance
            ? {
                  kind: 'case',
                  id: instance.id,
                  title: instance.regardingNumber,
                  subtitle: instance.regardingSubject,
                  href: getSlaCasePath(instance.id),
              }
            : null,
    )

    return (
        <Drawer
            isOpen={!!caseId}
            onClose={closeCase}
            onRequestClose={closeCase}
            width={480}
            title={
                <div>
                    <div className="text-xs font-semibold uppercase text-gray-500">Case</div>
                    <h4>{instance?.regardingNumber ?? '…'}</h4>
                </div>
            }
            footer={
                instance?.regardingId && (
                    <div className="flex w-full justify-end gap-2">
                        <Button variant="default" onClick={closeCase}>
                            Close
                        </Button>
                        <Button
                            variant="solid"
                            icon={<ExternalLinkIcon />}
                            onClick={() =>
                                window.open(getCrmCaseUrl(instance.regardingId), '_blank', 'noopener,noreferrer')
                            }
                        >
                            Open in Dynamics
                        </Button>
                    </div>
                )
            }
        >
            {instance ? (
                <CaseDetails instance={instance} />
            ) : (
                !loading && (
                    <EmptyState
                        icon={CaseIcon}
                        title="This SLA isn't in the selected period"
                        description="It started outside the period and its case is closed. Choose a longer period or a different month in the filters."
                    />
                )
            )}
        </Drawer>
    )
}
