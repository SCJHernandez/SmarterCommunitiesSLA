import useSWR, { type SWRConfiguration } from 'swr'
import api, { type ApiOptions } from '@/services/api'
import { type Building } from '@/@types/buildings/Building'
import { type Collection } from '@/@types/dynamics/collections'
import { tryParseDate } from '@/utils/parse'

export const buildingsUrl = '/buildings'
export const getBuildingUrl = (buildingId: string) => `${buildingsUrl}/${buildingId}`

/** JSON dates arrive as strings — turn them back into Date objects. */
export const ensureBuilding = (building: Building): Building => ({
    ...building,
    modifiedOn: tryParseDate(building.modifiedOn),
})

const ensureCollection = (collection: Collection<Building>): Collection<Building> => ({
    ...collection,
    records: collection.records.map(ensureBuilding),
})

export const apiGetBuildings = async (apiOptions?: ApiOptions) =>
    ensureCollection(await api.fetchJson<Collection<Building>>({ ...apiOptions, method: 'get', url: buildingsUrl }))

export const apiGetBuilding = async (buildingId: string, apiOptions?: ApiOptions) =>
    ensureBuilding(await api.fetchJson<Building>({ ...apiOptions, method: 'get', url: getBuildingUrl(buildingId) }))

export const useSWRBuildings = (config?: SWRConfiguration<Collection<Building>>) =>
    useSWR(buildingsUrl, () => apiGetBuildings(), config)

export const useSWRBuilding = (buildingId: string | null | undefined, config?: SWRConfiguration<Building>) =>
    useSWR(buildingId ? getBuildingUrl(buildingId) : null, () => apiGetBuilding(buildingId!), config)
