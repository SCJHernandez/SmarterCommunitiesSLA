import 'server-only'
import fs from 'fs'
import path from 'path'
import { assertGuid } from '@/server/data/dataverse'
import { UPLOADS_DIR } from './localFiles'

// Microsoft 365 profile photos, cached under uploads/_photos/<Entra object id>.jpg. Each person's
// photo is saved when they sign in (read with their own User.Read consent), so photos show without
// the app needing User.Read.All. Refreshed at every sign-in.

const PHOTOS_DIR = path.join(UPLOADS_DIR, '_photos')

const photoPath = (userId: string) => path.join(PHOTOS_DIR, `${assertGuid(userId, 'user id')}.jpg`)

export const saveCachedPhoto = (userId: string, bytes: Buffer) => {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true })
    fs.writeFileSync(photoPath(userId), bytes)
}

/** They have no photo (any more): drop the cached one. */
export const deleteCachedPhoto = (userId: string) => fs.rmSync(photoPath(userId), { force: true })

export const loadCachedPhoto = (userId: string): Buffer | null => {
    const file = photoPath(userId)
    return fs.existsSync(file) ? fs.readFileSync(file) : null
}
