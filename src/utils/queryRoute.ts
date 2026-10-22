import { type NavigationTree } from '@/@types/navigation'
import navigationConfig from '@/configs/navigation.config'

const findByPath = (nodes: NavigationTree[], path: string): NavigationTree | null => {
    for (const node of nodes) {
        if (node.path === path) return node
        const found = findByPath(node.subMenu, path)
        if (found) return found
    }
    return null
}

const findByPrefix = (nodes: NavigationTree[], path: string): NavigationTree | null => {
    let best: NavigationTree | null = null
    for (const node of nodes) {
        // Sections have no path ('') — never let them match.
        if (
            node.path &&
            node.path !== '/' &&
            path.startsWith(node.path) &&
            (!best || node.path.length > best.path.length)
        )
            best = node
        const found = findByPrefix(node.subMenu, path)
        if (found && (!best || found.path.length > best.path.length)) best = found
    }
    return best
}

/** The navigation entry for a URL path: exact match, else the longest matching prefix. */
export const queryRoute = (path: string): Pick<NavigationTree, 'key'> & Partial<NavigationTree> =>
    findByPath(navigationConfig, path) ?? findByPrefix(navigationConfig, path) ?? { key: 'home' }

export default queryRoute
