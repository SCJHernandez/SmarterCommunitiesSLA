import { describe, expect, it } from 'vitest'
import { firstSegmentValue } from './segmentValue'

describe('firstSegmentValue', () => {
    it('reads a single selection (a string) whole, not its first character', () => {
        expect(firstSegmentValue('Last 7 Days')).toBe('Last 7 Days')
    })

    it('reads the first of a multiple selection', () => {
        expect(firstSegmentValue(['Breached', 'Met'])).toBe('Breached')
    })

    it('is undefined when nothing is selected', () => {
        expect(firstSegmentValue('')).toBeUndefined()
        expect(firstSegmentValue([])).toBeUndefined()
    })
})
