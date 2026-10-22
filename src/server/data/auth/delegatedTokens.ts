import 'server-only'
import { randomToken, seal, unseal } from './session'

// Microsoft Graph tokens an Admin granted for editing roles, held in server memory only. The
// browser gets an encrypted reference (cookie) bound to that user. Tokens last about an hour; after
// a restart (or on another server instance) the Admin simply enables role editing again.

interface StoredToken {
    userId: string
    accessToken: string
    expiresAt: number
}

const registry = globalThis as typeof globalThis & { __roleAdminTokens?: Map<string, StoredToken> }
const tokens = (registry.__roleAdminTokens ??= new Map<string, StoredToken>())

const prune = () => {
    const now = Date.now()
    for (const [key, token] of tokens) if (token.expiresAt <= now) tokens.delete(key)
}

/** Keeps the token; returns the cookie value that refers to it and how long it lasts. */
export const storeRoleAdminToken = async (userId: string, accessToken: string, expiresInSeconds: number) => {
    prune()
    const key = randomToken()
    // A minute's margin so a request never starts with a token about to expire.
    const ttl = Math.max(60, expiresInSeconds - 60)
    tokens.set(key, { userId, accessToken, expiresAt: Date.now() + ttl * 1000 })
    return { cookie: await seal({ key, userId }, ttl), maxAge: ttl }
}

/** The token for this user, or null if they haven't enabled role editing (or it expired). */
export const getRoleAdminToken = async (cookie: string | undefined, userId: string): Promise<string | null> => {
    const ref = await unseal<{ key: string; userId: string }>(cookie)
    if (!ref || ref.userId !== userId) return null
    const token = tokens.get(ref.key)
    if (!token || token.userId !== userId || token.expiresAt <= Date.now()) return null
    return token.accessToken
}
