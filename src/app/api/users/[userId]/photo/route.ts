import { NotFoundError } from '@/@types/errors'
import { apiAuthHandler } from '@/server/routes/api'
import { getImageResponse } from '@/server/utils/response'
import { getUserPhoto } from '@/server/actions/users'

// GET -> the person's Microsoft 365 profile photo (404 when there's none; the UI shows initials)
export const GET = apiAuthHandler<{ userId: string }>('sla.view', async (_req, ctx) => {
    const { userId } = await ctx.params
    const photo = await getUserPhoto(userId)
    if (!photo) throw new NotFoundError('No photo.')
    return getImageResponse(photo.bytes, photo.contentType)
})
