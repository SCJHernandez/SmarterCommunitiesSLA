/** "Angelina Gotelli" → "AG", "Hernandez, Jaypee" → "JH", "AI extraction" → "AE". */
export const getInitials = (name: string | null | undefined) => {
    const parts = (name ?? '')
        .split(',')
        .reverse()
        .join(' ')
        .split(/[\s@._-]+/)
        .filter(Boolean)
    if (!parts.length) return '?'
    const first = parts[0][0]
    const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? '')
    return `${first}${last}`.toUpperCase()
}
