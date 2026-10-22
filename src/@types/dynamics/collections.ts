/** Standard list wrapper returned by every collection API route. */
export interface Collection<T> {
    total: number
    records: T[]
}
