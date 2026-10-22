import 'server-only'
import { ApiRouteError, DataError } from '@/@types/errors'

// Small Dataverse Web API client. Every server action goes through this.

/** A failed Dataverse call. Surfaces as a 502 with the Dataverse message in `details`. */
export class DataverseError extends ApiRouteError {
    readonly dataverseStatus: number
    readonly details: string

    constructor(message: string, dataverseStatus: number, details: string) {
        super(dataverseStatus === 400 ? 400 : 502, message, 'DATAVERSE_ERROR', { details: details.slice(0, 1000) })
        this.dataverseStatus = dataverseStatus
        this.details = details
    }
}

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isGuid = (value: unknown): value is string => typeof value === 'string' && GUID_RE.test(value)

/** Guards ids interpolated into OData URLs. */
export const assertGuid = (value: unknown, label = 'id'): string => {
    if (!isGuid(value)) throw new DataError(`Invalid ${label}.`, 'INVALID_ID')
    return value
}

/** `Microsoft.Dynamics.CRM.In` filter against a list of GUIDs. Use the column's logical name (`sc_bylawid`, not `_sc_bylawid_value`). */
export const inFilter = (attribute: string, ids: string[]) =>
    `Microsoft.Dynamics.CRM.In(PropertyName='${attribute}',PropertyValues=[${ids.map((id) => `'${assertGuid(id)}'`).join(',')}])`

/** Escapes a value for an OData string literal. */
export const odataString = (value: string) => `'${value.replace(/'/g, "''")}'`

const FORMATTED_VALUES = 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'

/** Display text Dataverse returns for a lookup/choice/date column (needs the formatted-values header). */
export const formatted = (row: Record<string, unknown>, column: string): string | undefined =>
    (row[`${column}@OData.Community.Display.V1.FormattedValue`] as string | undefined) ?? undefined

interface ODataCollection<T> {
    value: T[]
    '@odata.nextLink'?: string
}

export class DataverseClient {
    constructor(
        private readonly getToken: () => Promise<string>,
        private readonly baseUrl: string,
    ) {}

    get configured(): boolean {
        return !!this.baseUrl
    }

    private async send(path: string, init: RequestInit & { headers?: Record<string, string> } = {}): Promise<Response> {
        const token = await this.getToken()
        const url = path.startsWith('http') ? path : `${this.baseUrl}/api/data/v9.2/${path}`
        const res = await fetch(url, {
            ...init,
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                Accept: 'application/json',
                ...init.headers,
            },
        })
        if (!res.ok && res.status !== 404) {
            const details = await res.text()
            throw new DataverseError(
                `Dataverse ${init.method || 'GET'} ${path.split('?')[0]} failed (${res.status})`,
                res.status,
                details,
            )
        }
        return res
    }

    /** One record or query result (with formatted values); null when Dataverse returns 404. */
    async get<T = Record<string, unknown>>(path: string): Promise<T | null> {
        const res = await this.send(path, { headers: { Prefer: FORMATTED_VALUES } })
        return res.status === 404 ? null : res.json()
    }

    /** All rows of a collection query, following @odata.nextLink paging. */
    async getAll<T = Record<string, unknown>>(path: string): Promise<T[]> {
        const rows: T[] = []
        let next: string | undefined = path
        while (next) {
            const page: ODataCollection<T> | null = await this.get<ODataCollection<T>>(next)
            if (!page) break
            rows.push(...page.value)
            next = page['@odata.nextLink']
        }
        return rows
    }

    async create<T = Record<string, unknown>>(entitySet: string, body: unknown): Promise<T> {
        const res = await this.send(entitySet, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
            body: JSON.stringify(body),
        })
        if (res.status === 404) throw new DataverseError(`Dataverse table ${entitySet} not found`, 404, '')
        return res.json()
    }

    async delete(entitySet: string, id: string): Promise<void> {
        await this.send(`${entitySet}(${assertGuid(id)})`, { method: 'DELETE' })
    }

    async update(entitySet: string, id: string, body: unknown): Promise<void> {
        const res = await this.send(`${entitySet}(${assertGuid(id)})`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        if (res.status === 404) throw new DataverseError(`${entitySet}(${id}) not found`, 404, '')
    }

    /**
     * Single-request upload to a File column (Dataverse supports this for files < 128 MB).
     * Always sent as application/octet-stream — a JSON content type makes Dataverse parse the
     * body as a record payload (400). The file's type comes from `x-ms-file-name`.
     */
    async uploadFile(entitySet: string, id: string, column: string, fileName: string, bytes: Buffer): Promise<void> {
        const res = await this.send(`${entitySet}(${assertGuid(id)})/${column}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/octet-stream', 'x-ms-file-name': fileName },
            body: new Uint8Array(bytes),
        })
        if (res.status === 404) throw new DataverseError(`${entitySet}(${id})/${column} not found`, 404, '')
    }

    /** Null when the record has no file in that column. */
    async downloadFile(entitySet: string, id: string, column: string): Promise<Buffer | null> {
        const res = await this.send(`${entitySet}(${assertGuid(id)})/${column}/$value`, { headers: { Accept: '*/*' } })
        if (res.status === 404 || res.status === 204) return null
        return Buffer.from(await res.arrayBuffer())
    }
}
