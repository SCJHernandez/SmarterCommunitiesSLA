import 'server-only'
import crypto from 'crypto'
import { EncryptJWT, jwtDecrypt } from 'jose'
import { ServiceUnavailableError } from '@/@types/errors'

// Encrypted, tamper-proof cookie payloads (JWE, A256GCM). The key is derived from
// AUTH_SESSION_SECRET, so changing the secret signs everyone out.

let key: Uint8Array | null = null

const getKey = () => {
    if (key) return key
    const secret = process.env.AUTH_SESSION_SECRET
    if (!secret || secret.length < 32) {
        throw new ServiceUnavailableError('AUTH_SESSION_SECRET must be set (at least 32 characters).', 'NOT_CONFIGURED')
    }
    key = new Uint8Array(crypto.createHash('sha256').update(secret).digest())
    return key
}

export const seal = async <T extends object>(payload: T, ttlSeconds: number): Promise<string> =>
    new EncryptJWT({ data: payload })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime(`${ttlSeconds}s`)
        .encrypt(getKey())

/** The payload, or null if the value is missing, expired or was tampered with. */
export const unseal = async <T extends object>(value: string | null | undefined): Promise<T | null> => {
    if (!value) return null
    try {
        const { payload } = await jwtDecrypt(value, getKey())
        return (payload.data as T) ?? null
    } catch {
        return null
    }
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url')

export const pkceChallenge = (verifier: string) => crypto.createHash('sha256').update(verifier).digest('base64url')
