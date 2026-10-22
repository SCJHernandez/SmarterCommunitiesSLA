import type { SegmentValue } from '@/components/ui/Segment/context'

/**
 * The selected value from a `ui/Segment` onChange. Single selection reports a string, multiple selection an array —
 * reading a single selection as an array gives its first character.
 */
export const firstSegmentValue = (value: SegmentValue): string | undefined =>
    (Array.isArray(value) ? value[0] : value) || undefined
