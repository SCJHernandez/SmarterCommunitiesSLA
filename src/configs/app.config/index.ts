// Client-visible configuration. Secrets never go here — server-only settings are read from
// process.env inside src/server. NEXT_PUBLIC_* values are fixed when the app is built.

export const portalName = process.env.NEXT_PUBLIC_PORTAL_NAME || 'SLA Performance'
export const portalDescription =
    process.env.NEXT_PUBLIC_PORTAL_DESCRIPTION || 'Resolution KPI monitoring and action center.'
export const companyName = 'Smarter Communities'

// Paths
export const homePath = '/'
export const apiPath = '/api'
export const slaRecordsPath = '/records'
export const rolesPath = '/settings/roles'
export const loginPath = '/login'
export const helpPath = '/help'
export const signInUrl = '/api/auth/login'
export const signOutUrl = '/api/auth/logout'

/** For template/HeaderSearch (turned off in this app — the records page has its own search) */
export const searchPath = slaRecordsPath
export const searchPlaceholder = 'Search cases, owners or SLA items…'

/** A built-in help article, optionally at one of its sections. */
export const getHelpArticlePath = (slug: string, section?: string) =>
    `${helpPath}/${slug}${section ? `#${section}` : ''}`

/** The SLA records page with a case's details open (`?case=` is the SLA KPI instance id). */
export const getSlaCasePath = (instanceId: string) => `${slaRecordsPath}?case=${encodeURIComponent(instanceId)}`

// Dynamics 365 (deep links to Case records)
const crmBaseUrl = process.env.NEXT_PUBLIC_CRM_BASE_URL || 'https://smartercommunities.crm6.dynamics.com'
const crmAppId = process.env.NEXT_PUBLIC_CRM_APP_ID || '4bdd0e5b-3187-4907-b71f-bb4e5e3bf8f0'

/** Deep link to a Case (incident) record in Dynamics 365. */
export const getCrmCaseUrl = (caseId: string) =>
    `${crmBaseUrl}/main.aspx?${new URLSearchParams({ appid: crmAppId, pagetype: 'entityrecord', etn: 'incident', id: caseId })}`

export const termsOfUseUrl = 'https://www.smartercommunities.com.au/terms-of-use'
export const privacyPolicyUrl = 'https://www.smartercommunities.com.au/privacy-policy'

export const activeNavTranslation = false
