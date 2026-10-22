import { HiOutlineMenu, HiOutlineMenuAlt2 } from 'react-icons/hi'
import type { CommonProps } from '@/@types/common'

export interface NavToggleProps extends CommonProps {
    toggled?: boolean
}

/** Hamburger icon for opening/collapsing the side navigation. */
export default function NavToggle({ toggled, className }: NavToggleProps) {
    return <div className={className}>{toggled ? <HiOutlineMenu /> : <HiOutlineMenuAlt2 />}</div>
}
