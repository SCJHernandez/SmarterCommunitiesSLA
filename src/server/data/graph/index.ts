import 'server-only'

// Microsoft Graph app-only token, cached until shortly before expiry. Uses the GRAPH_* app
// registration, falling back to the Dataverse one.

let cachedToken: { value: string; expiresAt: number } | null = null

const graphCredentials = () => ({
    tenantId: process.env.GRAPH_TENANT_ID || process.env.DATAVERSE_TENANT_ID || '',
    clientId: process.env.GRAPH_CLIENT_ID || process.env.DATAVERSE_CLIENT_ID || '',
    clientSecret: process.env.GRAPH_CLIENT_SECRET || process.env.DATAVERSE_CLIENT_SECRET || '',
})

export const getGraphToken = async (): Promise<string> => {
    if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value

    const { tenantId, clientId, clientSecret } = graphCredentials()
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            scope: 'https://graph.microsoft.com/.default',
        }),
        cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Failed to fetch Graph token: ${await res.text()}`)

    const data = await res.json()
    cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
    return cachedToken.value
}

/** Graph error with its HTTP status, so callers can tell "not found" / "no access" from an outage. */
export class GraphError extends Error {
    readonly status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

/** GET a Graph v1.0 path (or full URL) as JSON with the app token. */
export const graphGet = async <T>(pathOrUrl: string, init?: RequestInit): Promise<T> => {
    const url = pathOrUrl.startsWith('https://') ? pathOrUrl : `https://graph.microsoft.com/v1.0${pathOrUrl}`
    const res = await fetch(url, {
        ...init,
        headers: { Authorization: `Bearer ${await getGraphToken()}`, ...init?.headers },
        cache: 'no-store',
    })
    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new GraphError(res.status, body?.error?.message || `Microsoft Graph returned ${res.status}`)
    }
    return res.json() as Promise<T>
}

/**
 * A Graph v1.0 request made as a signed-in person, with their own (delegated) token — Entra ID
 * then applies *their* rights. Path or full URL (e.g. an @odata.nextLink); null for 204 No Content.
 */
export const graphRequestAs = async <T>(
    accessToken: string,
    path: string,
    init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T | null> => {
    const url = path.startsWith('https://') ? path : `https://graph.microsoft.com/v1.0${path}`
    const res = await fetch(url, {
        method: init.method ?? 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...init.headers,
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        cache: 'no-store',
    })
    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new GraphError(res.status, body?.error?.message || `Microsoft Graph returned ${res.status}`)
    }
    return res.status === 204 ? null : ((await res.json()) as T)
}

/** POST JSON to a Graph v1.0 path with the app token. */
export const graphPost = <T>(path: string, body: unknown): Promise<T> =>
    graphGet<T>(path, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

/** Every page of a Graph collection (follows @odata.nextLink). */
export const graphGetAll = async <T>(path: string): Promise<T[]> => {
    const items: T[] = []
    let next: string | undefined = path
    while (next) {
        const page: { value: T[]; '@odata.nextLink'?: string } = await graphGet(next)
        items.push(...page.value)
        next = page['@odata.nextLink']
    }
    return items
}

/** GET a Graph binary (photo, file content) with the app token; null when it doesn't exist. */
export const graphGetBytes = async (path: string): Promise<{ bytes: Buffer; contentType: string } | null> => {
    const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
        headers: { Authorization: `Bearer ${await getGraphToken()}` },
        cache: 'no-store',
    })
    if (res.status === 404) return null
    if (!res.ok) throw new GraphError(res.status, `Microsoft Graph returned ${res.status}`)
    return {
        bytes: Buffer.from(await res.arrayBuffer()),
        contentType: res.headers.get('content-type') || 'application/octet-stream',
    }
}
