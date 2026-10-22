import cn from 'classnames'
import { twMerge } from 'tailwind-merge'

/** `classnames` + `tailwind-merge`: conditional classes where later Tailwind classes win. */
export default function classNames(...args: cn.ArgumentArray) {
    return twMerge(cn(args))
}
