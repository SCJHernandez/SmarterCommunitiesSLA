'use client'

import Link from 'next/link'
import Dropdown from '@/components/ui/Dropdown'
import Tag from '@/components/ui/Tag'
import UserAvatar from '@/components/shared/UserAvatar'
import { RolesIcon, SignOutIcon } from '@/configs/icons.config'
import { rolesPath, signOutUrl } from '@/configs/app.config'
import { roleTagClass } from '@/@types/auth/Roles'
import useSession from '@/utils/hooks/useSession'

/** The signed-in user in the header: who they are, their roles, and sign out. */
export default function UserDropdown() {
    const { user, can } = useSession()
    if (!user) return null

    return (
        <Dropdown
            placement="bottom-end"
            renderTitle={
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={`Signed in as ${user.name}`}
                >
                    <UserAvatar userId={user.id} name={user.name} size={34} />
                    <span className="hidden text-left leading-tight md:block">
                        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {user.name}
                        </span>
                        <span className="block text-xs text-gray-500">{user.roles.join(', ')}</span>
                    </span>
                </button>
            }
        >
            <Dropdown.Item variant="header">
                <div className="flex items-center gap-3 px-2 py-2">
                    <UserAvatar userId={user.id} name={user.name} size={40} />
                    <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                        <div className="truncate text-xs text-gray-500">{user.email}</div>
                        {(user.jobTitle || user.department) && (
                            <div className="truncate text-xs text-gray-500">
                                {[user.jobTitle, user.department].filter(Boolean).join(' · ')}
                            </div>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                                <Tag key={role} className={roleTagClass[role]}>
                                    {role}
                                </Tag>
                            ))}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            {can('users.view') && (
                <Dropdown.Item eventKey="roles" className="px-0">
                    <Link href={rolesPath} className="flex h-full w-full items-center gap-2 px-2">
                        <RolesIcon className="text-lg" /> Roles &amp; permissions
                    </Link>
                </Dropdown.Item>
            )}
            <Dropdown.Item eventKey="sign-out" className="px-0">
                {/* A full page load: the route clears the session cookie and redirects */}
                <a href={signOutUrl} className="flex h-full w-full items-center gap-2 px-2">
                    <SignOutIcon className="text-lg" /> Sign out
                </a>
            </Dropdown.Item>
        </Dropdown>
    )
}
