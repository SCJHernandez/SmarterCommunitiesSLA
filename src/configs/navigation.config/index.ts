import { type NavigationTree } from '@/@types/navigation'
import { type Permission } from '@/@types/auth/Roles'
import { NAV_ITEM_TYPE_COLLAPSE, NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant'
import { getHelpArticlePath, helpPath, homePath, rolesPath, slaRecordsPath } from '@/configs/app.config'

/** `authority`: permissions the user needs to see the item (see @types/auth/Roles). */
const item = (
    key: string,
    path: string,
    title: string,
    icon: string,
    authority: Permission[] = [],
): NavigationTree => ({
    key,
    path,
    title,
    icon,
    type: NAV_ITEM_TYPE_ITEM,
    authority,
    subMenu: [],
})

/** An item that opens to show its sub-items (shown with a dot, no icon). */
const collapse = (key: string, title: string, icon: string, subMenu: NavigationTree[]): NavigationTree => ({
    key,
    path: '',
    title,
    icon,
    type: NAV_ITEM_TYPE_COLLAPSE,
    authority: [],
    subMenu,
})

/** A titled section of items. Hidden when the user can see none of its items. */
const section = (key: string, title: string, subMenu: NavigationTree[]): NavigationTree => ({
    key,
    path: '',
    title,
    icon: '',
    type: NAV_ITEM_TYPE_TITLE,
    authority: [],
    subMenu,
})

/**
 * Side navigation, in titled sections. "Recently viewed" is added to the workspace section at
 * runtime (VerticalMenuContent). The entry whose path best prefixes the URL is highlighted.
 */
const navigationConfig: NavigationTree[] = [
    section('workspace', 'Workspace', [
        item('dashboard', homePath, 'Dashboard', 'dashboard', ['sla.view']),
        item('records', slaRecordsPath, 'SLA Records', 'records', ['sla.view']),
    ]),
    section('admin', 'Administration', [item('roles', rolesPath, 'Roles & Permissions', 'roles', ['users.view'])]),
    // Built-in articles (components/help/articles); other articles highlight "Support hub"
    section('support', 'Support', [
        collapse('help', 'Help Center', 'help', [
            item('help-hub', helpPath, 'Support hub', ''),
            item('help-metrics', getHelpArticlePath('how-metrics-are-calculated'), 'Metrics & formulas', ''),
            item('help-action-center', getHelpArticlePath('action-center'), 'Action Center guide', ''),
            item('help-faq', getHelpArticlePath('faq'), 'FAQ', ''),
        ]),
    ]),
]

export default navigationConfig
