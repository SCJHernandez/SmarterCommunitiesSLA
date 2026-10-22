'use client'

import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
import MobileNav from '@/components/template/MobileNav'
import SideNavToggle from '@/components/template/SideNavToggle'
import HeaderSearch from '@/components/template/HeaderSearch'
import PageContainer from '@/components/template/PageContainer'
import UserDropdown from '@/components/template/UserDropdown'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import useBreadcrumbs from '@/utils/hooks/useBreadcrumbs'
import type { ProviderProps } from '@/@types/common'

interface PostLoginLayoutProps extends ProviderProps {
    /** Show the search box in the header (off when the app has no search page of its own) */
    headerSearch?: boolean
}

/** The app shell: collapsible side navigation, header, breadcrumbs and page container. */
export default function PostLoginLayout({ children, headerSearch = true }: PostLoginLayoutProps) {
    const breadcrumbs = useBreadcrumbs((state) => state.items)

    return (
        <div className="app-layout-collapsible-side flex flex-auto flex-col">
            <div className="flex min-w-0 flex-auto">
                <SideNav />
                <div className="relative flex min-h-screen w-full min-w-0 flex-auto flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Header
                        className="shadow-sm dark:shadow-2xl"
                        headerStart={
                            <>
                                <MobileNav />
                                <SideNavToggle />
                                {headerSearch && <HeaderSearch />}
                            </>
                        }
                        headerEnd={<UserDropdown />}
                    />
                    <div className="flex h-full flex-auto flex-col">
                        <PageContainer>
                            {breadcrumbs.length > 0 && (
                                <div className="mb-6">
                                    <Breadcrumbs items={breadcrumbs} />
                                </div>
                            )}
                            {children}
                        </PageContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
