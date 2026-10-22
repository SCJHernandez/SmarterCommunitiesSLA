'use client'

import Avatar from '@/components/ui/Avatar'
import { getUserPhotoUrl } from '@/services/users'
import classNames from '@/utils/classNames'
import { getInitials } from '@/utils/initials'

interface UserAvatarProps {
    name: string | null | undefined
    /** Entra ID object id — shows their Microsoft 365 photo, falling back to initials */
    userId?: string | null
    size?: number
    className?: string
}

/** A person: their Microsoft 365 photo when we know who they are, otherwise their initials. */
export default function UserAvatar({ name, userId, size = 32, className }: UserAvatarProps) {
    return (
        <Avatar
            size={size}
            shape="circle"
            src={userId ? getUserPhotoUrl(userId) : undefined}
            alt={name ?? ''}
            className={classNames(
                'shrink-0 bg-primary-subtle font-semibold text-primary dark:bg-primary/20',
                className,
            )}
        >
            {getInitials(name)}
        </Avatar>
    )
}
