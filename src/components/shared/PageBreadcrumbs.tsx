'use client'

import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'

/** Sets the layout's breadcrumbs from a server-rendered page (which can't call the hook itself). */
export default function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    usePageBreadcrumbs(items)
    return null
}
