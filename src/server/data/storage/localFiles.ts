import 'server-only'
import path from 'path'

// Local storage under uploads/ (git-ignored), e.g. the profile-photo cache.

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
