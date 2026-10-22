'use client'

import { useEffect, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import Spinner from '@/components/ui/Spinner'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import UserAvatar from '@/components/shared/UserAvatar'
import { SearchIcon } from '@/configs/icons.config'
import { ROLE_DESCRIPTIONS, ROLE_NAMES, type RoleName, roleTagClass } from '@/@types/auth/Roles'
import { type DirectoryPerson } from '@/@types/users/UserAccount'
import { apiSearchPeople, apiSetUserRole } from '@/services/users'
import { useUsersStore } from '@/stores/UsersStore'
import useSession from '@/utils/hooks/useSession'
import classNames from '@/utils/classNames'
import { tryGetErrorMessage } from '@/utils/errors'

interface AddPersonDialogProps {
    isOpen: boolean
    /** Role picked when the dialog opens (e.g. from a role card's "Assign") */
    initialRole?: RoleName
    onClose: () => void
}

const SEARCH_DELAY_MS = 300

/** Find someone in the organisation and give them a role (written to Entra ID as you). */
export default function AddPersonDialog({ isOpen, initialRole = 'Viewer', onClose }: AddPersonDialogProps) {
    const records = useUsersStore((state) => state.records)
    const refresh = useUsersStore((state) => state.refresh)
    const { user } = useSession()

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<DirectoryPerson[]>([])
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [person, setPerson] = useState<DirectoryPerson | null>(null)
    const [role, setRole] = useState<RoleName>(initialRole)
    const [saving, setSaving] = useState(false)

    // Search as they type, once they pause.
    useEffect(() => {
        const q = query.trim()
        if (q.length < 2) return
        const controller = new AbortController()
        const timer = setTimeout(() => {
            setSearching(true)
            apiSearchPeople(q, { signal: controller.signal })
                .then((found) => {
                    setResults(found)
                    setSearchError(null)
                })
                .catch((error) => {
                    if (!controller.signal.aborted) setSearchError(tryGetErrorMessage(error))
                })
                .finally(() => !controller.signal.aborted && setSearching(false))
        }, SEARCH_DELAY_MS)
        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [query])

    const currentRole = (id: string) => records.find((a) => a.principalId === id)?.role

    const save = async () => {
        if (!person) return
        setSaving(true)
        try {
            await apiSetUserRole({ principalId: person.id, role })
            toastSuccess(
                `${person.name} is now ${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}. It applies when they next sign in.`,
            )
            await refresh()
            onClose()
        } catch (error) {
            toastError(`Couldn't give ${person.name} a role: ${tryGetErrorMessage(error)}`)
        }
        setSaving(false)
    }

    const visible = query.trim().length >= 2 ? results : []

    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={620} closable={!saving}>
            <h4 className="mb-1">Add a person</h4>
            <p className="mb-4 text-sm text-gray-500">
                Search your organisation, choose a role, and it&apos;s saved to Microsoft Entra ID. It applies the next
                time they sign in.
            </p>

            <Input
                autoFocus
                prefix={<SearchIcon className="text-lg" />}
                suffix={searching ? <Spinner size={18} /> : undefined}
                placeholder="Name or email…"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    setPerson(null)
                }}
                aria-label="Search people"
            />
            <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                {searchError ? (
                    <p className="p-4 text-sm text-error">{searchError}</p>
                ) : !visible.length ? (
                    <p className="p-4 text-sm text-gray-500">
                        {query.trim().length < 2
                            ? 'Type at least 2 letters of their name or email.'
                            : searching
                              ? 'Searching…'
                              : 'Nobody found.'}
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {visible.map((p) => {
                            const existing = currentRole(p.id)
                            const isMe = p.id === user?.id
                            return (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        disabled={isMe}
                                        className={classNames(
                                            'flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700/50',
                                            person?.id === p.id && 'bg-primary-subtle dark:bg-primary/10',
                                        )}
                                        onClick={() => {
                                            setPerson(p)
                                            if (existing) setRole(existing)
                                        }}
                                        title={isMe ? "You can't change your own role" : undefined}
                                    >
                                        <UserAvatar userId={p.id} name={p.name} size={34} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-semibold text-gray-900 dark:text-gray-100">
                                                {p.name}
                                            </span>
                                            <span className="block truncate text-xs text-gray-500">
                                                {[p.email, p.jobTitle].filter(Boolean).join(' · ')}
                                            </span>
                                        </span>
                                        {existing && <Tag className={roleTagClass[existing]}>{existing}</Tag>}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Role</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ROLE_NAMES.map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            aria-pressed={role === r}
                            className={classNames(
                                'rounded-xl border px-3 py-2 text-left',
                                role === r
                                    ? 'border-primary bg-primary-subtle dark:bg-primary/10'
                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600',
                            )}
                        >
                            <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{r}</span>
                            <span className="block text-xs text-gray-500">{ROLE_DESCRIPTIONS[r]}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
                <Button size="sm" variant="default" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button size="sm" variant="solid" loading={saving} disabled={!person} onClick={save}>
                    {person
                        ? currentRole(person.id)
                            ? `Change ${person.name.split(' ')[0]} to ${role}`
                            : `Give ${person.name.split(' ')[0]} the ${role} role`
                        : 'Choose a person'}
                </Button>
            </div>
        </Dialog>
    )
}
