/** Moves keyboard focus to an element (and scrolls it into view) on the next frame. */
export const focusElement = (element: HTMLElement | null | undefined) => {
    if (!element) return
    requestAnimationFrame(() => {
        element.focus({ preventScroll: true })
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
}
