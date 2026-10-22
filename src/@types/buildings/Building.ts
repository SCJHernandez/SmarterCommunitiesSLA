import { type BuildingMeta } from './BuildingMeta'

export type BuildingStatusName = 'Active' | 'Inactive'

export interface Building extends BuildingMeta {
    number?: string
    address?: string
    doorAddress?: string
    city?: string
    postcode?: string
    state?: string
    division?: string
    accountManager?: string
    status: BuildingStatusName
    modifiedOn?: Date
}
