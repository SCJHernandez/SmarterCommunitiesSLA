'use client'

import Alert from '@/components/ui/Alert'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import Timeline from '@/components/ui/Timeline'
import { AddCircleIcon, DeleteIcon, RefreshIcon } from '@/configs/icons.config'
import { type CaseFieldChange, type CaseHistoryEntry } from '@/@types/cases/CaseHistory'
import { useSWRCaseHistory } from '@/services/cases'
import { formatDateTime, fromNow } from '@/utils/dates'
import { getErrorCode, tryGetErrorMessage } from '@/utils/errors'
import { getInitials } from '@/utils/initials'
import type { ReactNode } from 'react'

/** Values longer than this are shown in a card under the line, like a comment. */
const LONG_TEXT = 120

const STATUS_FIELDS = new Set(['statecode', 'statuscode'])

/** Dot colour for a status value. */
const statusDotClass = (value: string | null) => {
    if (!value) return 'bg-gray-300'
    if (/resolv|solved|succeed|complet|closed/i.test(value)) return 'bg-success'
    if (/cancel/i.test(value)) return 'bg-gray-400'
    if (/hold|wait|pause/i.test(value)) return 'bg-warning'
    return 'bg-info'
}

const isLong = (value: string | null) => !!value && (value.length > LONG_TEXT || value.includes('\n'))

function Strong({ children }: { children: ReactNode }) {
    return <span className="font-semibold text-gray-900 dark:text-gray-100">{children}</span>
}

/** A value as it reads in a sentence: status with a coloured dot, otherwise bold text. */
function Value({ change, value }: { change: CaseFieldChange; value: string | null }) {
    if (value === null) return <span className="italic text-gray-400">empty</span>
    if (STATUS_FIELDS.has(change.field)) {
        return (
            <span className="inline-flex items-center gap-1">
                <Badge className={statusDotClass(value)} />
                <Strong>{value}</Strong>
            </span>
        )
    }
    return <Strong>{isLong(value) ? `${value.slice(0, 40)}…` : value}</Strong>
}

function TimelineAvatar({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <Avatar size={25} shape="circle" className={className}>
            {children}
        </Avatar>
    )
}

const entryMedia = (entry: CaseHistoryEntry) => {
    if (entry.action === 'created') {
        return (
            <TimelineAvatar className="bg-success-subtle text-success">
                <AddCircleIcon />
            </TimelineAvatar>
        )
    }
    if (entry.action === 'deleted') {
        return (
            <TimelineAvatar className="bg-error-subtle text-error">
                <DeleteIcon />
            </TimelineAvatar>
        )
    }
    return (
        <TimelineAvatar className="bg-primary-subtle font-semibold text-primary">
            {getInitials(entry.user)}
        </TimelineAvatar>
    )
}

/** "changed Status Reason to ● Resolved", or "updated 3 fields" with the details below. */
function EntrySentence({ entry }: { entry: CaseHistoryEntry }) {
    const owner = entry.changes.find((c) => c.field === 'ownerid')
    const [only] = entry.changes

    switch (entry.action) {
        case 'created':
            return <span>created the case</span>
        case 'assigned':
            return owner?.newValue ? (
                <span>
                    assigned the case to <Strong>{owner.newValue}</Strong>
                </span>
            ) : (
                <span>reassigned the case</span>
            )
        case 'merged': {
            const master = entry.changes.find((c) => c.field === 'masterid')?.newValue
            return master ? (
                <span>
                    merged this case into <Strong>{master}</Strong>
                </span>
            ) : (
                <span>merged another case into this one</span>
            )
        }
        case 'deleted':
            return <span>deleted the case</span>
        case 'updated':
            return entry.changes.length === 1 ? (
                <span>
                    changed <Strong>{only.label}</Strong> to <Value change={only} value={only.newValue} />
                </span>
            ) : (
                <span>updated {entry.changes.length} fields</span>
            )
        default:
            return entry.changes.length ? (
                <span>
                    {entry.actionLabel.toLowerCase()}: updated {entry.changes.length}{' '}
                    {entry.changes.length === 1 ? 'field' : 'fields'}
                </span>
            ) : (
                <span>{entry.actionLabel.toLowerCase()}</span>
            )
    }
}

function EntryDetails({ entry }: { entry: CaseHistoryEntry }) {
    const showList =
        (entry.action === 'updated' && entry.changes.length > 1) ||
        (entry.action === 'other' && entry.changes.length > 0)
    const longChanges = entry.changes.filter((c) => isLong(c.newValue))
    const single = entry.action === 'updated' && entry.changes.length === 1 ? entry.changes[0] : null

    return (
        <>
            {single && single.oldValue !== null && !isLong(single.oldValue) && (
                <p className="mt-1 text-xs text-gray-500">was {single.oldValue}</p>
            )}
            {showList && (
                <ul className="mt-2 space-y-1 text-sm">
                    {entry.changes
                        .filter((c) => !isLong(c.newValue))
                        .map((c) => (
                            <li key={c.field} className="flex flex-wrap items-center gap-x-1.5">
                                <span className="text-gray-500">{c.label}:</span>
                                {c.oldValue !== null && (
                                    <>
                                        <span className="text-gray-400 line-through">{c.oldValue}</span>
                                        <span className="text-gray-400">→</span>
                                    </>
                                )}
                                <Value change={c} value={c.newValue} />
                            </li>
                        ))}
                </ul>
            )}
            {longChanges.map((c) => (
                <Card key={c.field} className="mt-3" bodyClass="p-3">
                    <div className="mb-1 text-xs font-semibold text-gray-500">{c.label}</div>
                    <p className="whitespace-pre-line text-sm">{c.newValue}</p>
                </Card>
            ))}
        </>
    )
}

interface SlaCaseHistoryProps {
    /** The Case (incident) id */
    caseId: string
}

/** The Case's Dataverse audit history: who changed what, newest first. */
export default function SlaCaseHistory({ caseId }: SlaCaseHistoryProps) {
    const { data, error, isLoading, mutate } = useSWRCaseHistory(caseId)

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton variant="circle" width={25} height={25} />
                        <Skeleton height={14} width="70%" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return getErrorCode(error) === 'AUDIT_NOT_PERMITTED' ? (
            <Alert showIcon type="info" title="Case history isn't available yet">
                {tryGetErrorMessage(error)}
            </Alert>
        ) : (
            <Alert showIcon type="danger" title="Couldn't load the case history">
                <div className="flex flex-col items-start gap-2">
                    <span>{tryGetErrorMessage(error)}</span>
                    <Button size="xs" variant="default" icon={<RefreshIcon />} onClick={() => void mutate()}>
                        Try again
                    </Button>
                </div>
            </Alert>
        )
    }

    if (!data?.length) {
        return <p className="text-sm text-gray-500">No changes have been recorded for this case yet.</p>
    }

    return (
        <Timeline>
            {data.map((entry, index) => (
                <Timeline.Item key={entry.id || index} media={entryMedia(entry)} isLast={index === data.length - 1}>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
                        <Strong>{entry.user}</Strong>
                        <EntrySentence entry={entry} />
                        <span className="text-xs text-gray-400" title={formatDateTime(entry.createdOn)}>
                            {fromNow(entry.createdOn)}
                        </span>
                    </p>
                    <EntryDetails entry={entry} />
                </Timeline.Item>
            ))}
        </Timeline>
    )
}
