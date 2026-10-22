// Roles and what each one may do. A user's roles come from the Entra ID app roles assigned to them
// (the `roles` claim of their sign-in token), so they're managed in Entra ID, not in this app. The
// app role *values* in the app registration must match these names exactly.

export const ROLE_NAMES = ['Admin', 'Viewer'] as const

export type RoleName = (typeof ROLE_NAMES)[number]

export const PERMISSIONS = ['sla.view', 'users.view', 'users.manage'] as const

export type Permission = (typeof PERMISSIONS)[number]

export const PERMISSION_LABELS: Record<Permission, string> = {
    'sla.view': 'View the SLA dashboard and records',
    'users.view': 'See who has which role',
    'users.manage': 'Give people roles and change them',
}

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
    Admin: ['sla.view', 'users.view', 'users.manage'],
    Viewer: ['sla.view'],
}

export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
    Admin: 'Full access, including giving people their roles.',
    Viewer: 'Views the SLA dashboard, records and case details.',
}

export const roleTagClass: Record<RoleName, string> = {
    Admin: 'border-transparent bg-primary-subtle text-primary',
    Viewer: '',
}

export const hasPermission = (roles: readonly RoleName[], permission: Permission) =>
    roles.some((role) => ROLE_PERMISSIONS[role].includes(permission))

/** Known role names from a token's `roles` claim (case-insensitive), most powerful first. */
export const toRoleNames = (values: unknown): RoleName[] => {
    const claimed = new Set(
        (Array.isArray(values) ? values : []).filter((v) => typeof v === 'string').map((v) => v.toLowerCase()),
    )
    return ROLE_NAMES.filter((role) => claimed.has(role.toLowerCase()))
}
