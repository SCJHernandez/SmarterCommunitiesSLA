import 'server-only'
import { DataverseClient } from './client'

// Client-credentials token for Dataverse, cached until a minute before it expires.

const DATAVERSE_URL = (process.env.DATAVERSE_URL || '').replace(/\/$/, '')

let cachedToken: { value: string; expiresAt: number } | null = null

export const getDataverseToken = async (): Promise<string> => {
    if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value

    const res = await fetch(`https://login.microsoftonline.com/${process.env.DATAVERSE_TENANT_ID}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.DATAVERSE_CLIENT_ID || '',
            client_secret: process.env.DATAVERSE_CLIENT_SECRET || '',
            resource: DATAVERSE_URL,
        }),
        cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Failed to fetch Dataverse token: ${res.status} ${await res.text()}`)

    const data = await res.json()
    cachedToken = { value: data.access_token, expiresAt: Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000 }
    return cachedToken.value
}

export const dataverse = new DataverseClient(getDataverseToken, DATAVERSE_URL)

export { DataverseError, assertGuid, formatted, isGuid, inFilter, odataString } from './client'
