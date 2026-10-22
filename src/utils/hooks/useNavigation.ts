'use client'

import { useMemo } from 'react'
import navigationConfig from '@/configs/navigation.config'
import { type NavigationTree } from '@/@types/navigation'
import { type Permission } from '@/@types/auth/Roles'
import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'
import useSession from '@/utils/hooks/useSession'

/** Items the user's roles allow (`authority`), at every level; sections left empty are dropped. */
const filterTree = (nodes: NavigationTree[], can: (permission: Permission) => boolean): NavigationTree[] =>
    nodes
        .filter((nav) => nav.authority.every((permission) => can(permission as Permission)))
        .map((nav) => ({ ...nav, subMenu: filterTree(nav.subMenu, can) }))
        .filter((nav) => nav.type === NAV_ITEM_TYPE_ITEM || nav.subMenu.length > 0)

/** The side-navigation tree for the signed-in user. */
export const useNavigation = () => {
    const { can } = useSession()
    const navigationTree = useMemo(() => filterTree(navigationConfig, can), [can])
    return { navigationTree }
}

export default useNavigation
