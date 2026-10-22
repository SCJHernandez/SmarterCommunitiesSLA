import { THEME_ENUM } from '@/constants/theme.constant'
import type { PartialTheme } from '@/@types/theme'

/**
 * Since some configurations need to be match with specific themes,
 * we recommend to use the configuration that generated from demo.
 */
export const themeConfig: PartialTheme = {
    themeSchema: '',
    direction: THEME_ENUM.DIR_LTR,
    mode: THEME_ENUM.MODE_LIGHT, //mode: undefinded, // note: set to undefined to use the 'system theme' mode
    panelExpand: false,
    controlSize: 'md',
    layout: {
        type: THEME_ENUM.LAYOUT_COLLAPSIBLE_SIDE,
        sideNavCollapse: false,
    },
}
