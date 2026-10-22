'use client'

import { useEffect, useMemo, useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import PageHeader from '@/components/shared/PageHeader'
import Loading from '@/components/shared/Loading'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import UserAvatar from '@/components/shared/UserAvatar'
import AddPersonDialog from './dialogs/AddPersonDialog'
import {
    AddIcon,
    DeleteIcon,
    ExternalLinkIcon,
    LockedIcon,
    RefreshIcon,
    RolesIcon,
    SearchIcon,
    SuccessIcon,
} from '@/configs/icons.config'
import { rolesPath } from '@/configs/app.config'
import {
    PERMISSIONS,
    PERMISSION_LABELS,
    ROLE_DESCRIPTIONS,
    ROLE_NAMES,
    ROLE_PERMISSIONS,
    type RoleName,
    roleTagClass,
} from '@/@types/auth/Roles'
import { type UserAccount } from '@/@types/users/UserAccount'
import { apiRemoveRoleAssignment, apiSetUserRole, getEnableRoleEditingUrl } from '@/services/users'
import { getVisibleAccounts, useUsersStore } from '@/stores/UsersStore'
import { formatDate } from '@/utils/dates'
import { getErrorCode, tryGetErrorMessage } from '@/utils/errors'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useSession from '@/utils/hooks/useSession'

const { THead, TBody, Tr, Th, Td } = Table

const selectClass =
    'h-12 rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'

const MAX_FACES = 4

interface RolesClientPageProps {
    /** Result of "Enable role editing" (?roleEditing= on the way back from Microsoft) */
    roleEditing?: 'enabled' | 'failed' | null
}

/**
 * Roles & permissions. Roles are Entra ID app roles: this page shows who has each one, and lets an
 * Admin who has enabled role editing add people and change or remove their roles — saved to Entra
 * ID with the Admin's own Microsoft permissions.
 */
export default function RolesClientPage({ roleEditing }: RolesClientPageProps) {
    usePageBreadcrumbs([{ label: 'Roles & permissions' }])
    const records = useUsersStore((state) => state.records)
    const manageUrl = useUsersStore((state) => state.manageUrl)
    const problem = useUsersStore((state) => state.problem)
    const canManage = useUsersStore((state) => state.canManage)
    const loading = useUsersStore((state) => state.loading)
    const validating = useUsersStore((state) => state.validating)
    const error = useUsersStore((state) => state.error)
    const filter = useUsersStore((state) => state.filter)
    const setFilter = useUsersStore((state) => state.setFilter)
    const refresh = useUsersStore((state) => state.refresh)
    const { user, can } = useSession()
    const isAdmin = can('users.manage')

    /** Role preset for the Add person dialog; null = closed */
    const [adding, setAdding] = useState<RoleName | null>(null)
    const [removing, setRemoving] = useState<UserAccount | null>(null)
    /** Assignment being changed or removed right now */
    const [busy, setBusy] = useState<string | null>(null)

    const visible = useMemo(() => getVisibleAccounts(records, filter), [records, filter])
    const byRole = useMemo(
        () => new Map(ROLE_NAMES.map((role) => [role, records.filter((a) => a.role === role)])),
        [records],
    )

    // Back from Microsoft: say whether role editing was turned on, then tidy the address bar.
    useEffect(() => {
        if (!roleEditing) return
        if (roleEditing === 'enabled') toastSuccess('Role editing is on for about an hour.')
        window.history.replaceState(null, '', rolesPath)
    }, [roleEditing])

    const enableUrl = getEnableRoleEditingUrl(rolesPath)

    /** A failed change: offer to re-enable when that's the problem, then reload the list. */
    const reportFailure = (action: string, err: unknown) => {
        toastError(
            getErrorCode(err) === 'ROLE_EDITING_NOT_ENABLED'
                ? 'Role editing has expired. Click "Enable role editing" and try again.'
                : `Couldn't ${action}: ${tryGetErrorMessage(err)}`,
        )
        void refresh()
    }

    const changeRole = async (account: UserAccount, role: RoleName) => {
        if (role === account.role) return
        setBusy(account.id)
        try {
            await apiSetUserRole({ principalId: account.principalId, role })
            toastSuccess(`${account.name} is now ${role}. It applies when they next sign in.`)
            await refresh()
        } catch (err) {
            reportFailure(`change ${account.name}'s role`, err)
        }
        setBusy(null)
    }

    const remove = async () => {
        if (!removing) return
        const account = removing
        setBusy(account.id)
        try {
            await apiRemoveRoleAssignment(account.id)
            toastSuccess(`${account.name} no longer has the ${account.role} role.`)
            setRemoving(null)
            await refresh()
        } catch (err) {
            reportFailure(`remove ${account.name}'s role`, err)
        }
        setBusy(null)
    }

    const manageLink = (label: string, className?: string) =>
        manageUrl ? (
            <a href={manageUrl} target="_blank" rel="noreferrer" className={className}>
                {label}
            </a>
        ) : null

    const assignAction = (role: RoleName) => {
        const className =
            'inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-primary dark:text-gray-200'
        if (canManage) {
            return (
                <button type="button" className={className} onClick={() => setAdding(role)}>
                    <AddIcon /> Assign
                </button>
            )
        }
        return manageLink('Assign in Entra ID', className)
    }

    const roleCard = (role: RoleName) => {
        const members = byRole.get(role) ?? []
        return (
            <div key={role} className="flex flex-col rounded-2xl bg-gray-100 p-5 dark:bg-gray-700/60">
                <div className="mb-1 flex items-center justify-between gap-2">
                    <h6>{role}</h6>
                    <Tag className={roleTagClass[role]}>{members.length}</Tag>
                </div>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{ROLE_DESCRIPTIONS[role]}</p>
                <ul className="mb-4 space-y-1 text-xs">
                    {PERMISSIONS.map((permission) => {
                        const allowed = ROLE_PERMISSIONS[role].includes(permission)
                        return (
                            <li
                                key={permission}
                                className={
                                    allowed
                                        ? 'flex gap-1.5 text-gray-700 dark:text-gray-200'
                                        : 'flex gap-1.5 text-gray-400 line-through'
                                }
                            >
                                <SuccessIcon
                                    className={allowed ? 'mt-px shrink-0 text-success' : 'mt-px shrink-0 opacity-0'}
                                />
                                {PERMISSION_LABELS[permission]}
                            </li>
                        )
                    })}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex -space-x-2">
                        {members.slice(0, MAX_FACES).map((m) => (
                            <UserAvatar
                                key={m.id}
                                name={m.name}
                                userId={m.principalType === 'User' ? m.principalId : null}
                                size={28}
                                className="ring-2 ring-gray-100 dark:ring-gray-700"
                            />
                        ))}
                        {members.length > MAX_FACES && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-[11px] font-semibold text-gray-700 ring-2 ring-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:ring-gray-700">
                                +{members.length - MAX_FACES}
                            </span>
                        )}
                    </div>
                    {assignAction(role)}
                </div>
            </div>
        )
    }

    const roleCell = (account: UserAccount) => {
        const isMe = account.principalId === user?.id
        if (!canManage || isMe) {
            return (
                <span className="inline-flex items-center gap-1.5">
                    <Tag className={roleTagClass[account.role]}>{account.role}</Tag>
                    {canManage && isMe && (
                        <span title="You can't change your own role here, so nobody locks themselves out">
                            <LockedIcon className="text-gray-400" />
                        </span>
                    )}
                </span>
            )
        }
        return (
            <select
                aria-label={`Role for ${account.name}`}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={account.role}
                disabled={busy === account.id}
                onChange={(e) => void changeRole(account, e.target.value as RoleName)}
            >
                {ROLE_NAMES.map((role) => (
                    <option key={role}>{role}</option>
                ))}
            </select>
        )
    }

    const accounts = () => {
        if (loading && !records.length) return <Loading loading message="Loading accounts…" />
        if (error && !records.length) return <ErrorState message={error} onRetry={() => void refresh()} />
        if (!visible.length) {
            return (
                <EmptyState
                    icon={RolesIcon}
                    title={records.length ? 'No accounts match' : 'Nobody has a role yet'}
                    description={
                        records.length
                            ? 'Try another name or role.'
                            : 'Until someone is given a role, everyone who signs in gets the default role.'
                    }
                    action={
                        canManage ? (
                            <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setAdding('Viewer')}>
                                Add a person
                            </Button>
                        ) : (
                            manageLink('Open in Entra ID', 'text-sm font-semibold text-primary hover:underline')
                        )
                    }
                />
            )
        }
        return (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                <Table hoverable>
                    <THead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Type</Th>
                            <Th>Role</Th>
                            <Th>Assigned</Th>
                            {canManage && <Th />}
                        </Tr>
                    </THead>
                    <TBody>
                        {visible.map((account) => (
                            <Tr key={account.id}>
                                <Td>
                                    <div className="flex items-center gap-3">
                                        <UserAvatar
                                            name={account.name}
                                            userId={account.principalType === 'User' ? account.principalId : null}
                                            size={36}
                                        />
                                        <div className="min-w-0">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                {account.name}
                                                {account.principalId === user?.id && (
                                                    <span className="ml-1.5 text-xs font-normal text-gray-500">
                                                        (you)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="truncate text-xs text-gray-500">
                                                {account.email ??
                                                    (account.principalType === 'Group'
                                                        ? 'Everyone in this group'
                                                        : account.jobTitle)}
                                            </div>
                                        </div>
                                    </div>
                                </Td>
                                <Td>
                                    <Tag>{account.principalType === 'Group' ? 'Group' : 'User'}</Tag>
                                </Td>
                                <Td>{roleCell(account)}</Td>
                                <Td className="whitespace-nowrap">{formatDate(account.assignedOn)}</Td>
                                {canManage && (
                                    <Td className="text-right">
                                        {account.principalId !== user?.id && (
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                className="text-error"
                                                icon={<DeleteIcon />}
                                                disabled={busy === account.id}
                                                onClick={() => setRemoving(account)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </Td>
                                )}
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            </div>
        )
    }

    return (
        <>
            <PageHeader
                title="Roles & permissions"
                description="What each role can do and who has it. Roles are saved in Microsoft Entra ID and apply at the person's next sign-in."
                actions={
                    <>
                        <Button
                            size="sm"
                            variant="default"
                            icon={<RefreshIcon />}
                            loading={validating}
                            onClick={() => void refresh()}
                        >
                            Refresh
                        </Button>
                        {manageUrl && (
                            <a href={manageUrl} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="default" icon={<ExternalLinkIcon />}>
                                    Manage in Entra ID
                                </Button>
                            </a>
                        )}
                        {isAdmin &&
                            (canManage ? (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<AddIcon />}
                                    onClick={() => setAdding('Viewer')}
                                >
                                    Add person
                                </Button>
                            ) : (
                                // A full page load: Microsoft asks for consent, then sends them back here.
                                <a href={enableUrl}>
                                    <Button size="sm" variant="solid" icon={<RolesIcon />}>
                                        Enable role editing
                                    </Button>
                                </a>
                            ))}
                    </>
                }
            />

            {roleEditing === 'failed' && (
                <Alert showIcon type="danger" className="mb-6">
                    Role editing couldn&apos;t be turned on. The app registration needs the delegated permissions
                    AppRoleAssignment.ReadWrite.All, Application.Read.All and User.ReadBasic.All with admin consent, and
                    you need to be an owner of its enterprise application.
                </Alert>
            )}
            {problem && (
                <Alert showIcon type="warning" className="mb-6">
                    {problem}
                </Alert>
            )}
            {isAdmin && !canManage && !problem && roleEditing !== 'failed' && (
                <p className="mb-6 text-sm text-gray-500">
                    To add people or change roles here, click <span className="font-semibold">Enable role editing</span>{' '}
                    — Microsoft asks you to confirm, and changes are then saved to Entra ID as you.
                </p>
            )}

            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{ROLE_NAMES.map(roleCard)}</div>

            <h4 className="mb-4">All accounts</h4>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:max-w-sm">
                    <Input
                        prefix={<SearchIcon className="text-lg" />}
                        placeholder="Search by name or email…"
                        value={filter.query}
                        onChange={(e) => setFilter({ query: e.target.value })}
                        aria-label="Search accounts"
                    />
                </div>
                <select
                    aria-label="Role"
                    className={selectClass}
                    value={filter.role}
                    onChange={(e) => setFilter({ role: e.target.value as 'All' | RoleName })}
                >
                    <option value="All">All roles</option>
                    {ROLE_NAMES.map((role) => (
                        <option key={role}>{role}</option>
                    ))}
                </select>
            </div>
            {accounts()}

            {/* Keyed so each opening starts fresh with its preset role */}
            {adding && <AddPersonDialog key={adding} isOpen initialRole={adding} onClose={() => setAdding(null)} />}
            <ConfirmDialog
                isOpen={!!removing}
                type="danger"
                title={`Remove ${removing?.name}'s role?`}
                confirmText="Remove role"
                onConfirm={remove}
                onClose={() => setRemoving(null)}
                closable={busy !== removing?.id}
                confirmButtonProps={{ loading: !!removing && busy === removing.id }}
            >
                {removing?.principalType === 'Group'
                    ? `Everyone in ${removing?.name} loses the ${removing?.role} role`
                    : `${removing?.name} loses the ${removing?.role} role`}{' '}
                when they next sign in. Without any role they get the default role, or no access if your administrator
                has turned that off.
            </ConfirmDialog>
        </>
    )
}
