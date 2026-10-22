'use client'

import PageHeader from '@/components/shared/PageHeader'
import SlaCaseDrawer from '@/components/sla/details/SlaCaseDrawer'
import SlaFilterBar from '@/components/sla/SlaFilterBar'
import SlaRefreshButton from '@/components/sla/SlaRefreshButton'
import SlaRecordsTable from './SlaRecordsTable'
import { homePath } from '@/configs/app.config'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useSlaDashboard from '@/utils/hooks/useSlaDashboard'

/** Every SLA in the period that matches the filters, searchable and sortable. */
export default function SlaRecordsClientPage() {
    usePageBreadcrumbs([{ label: 'Dashboard', href: homePath }, { label: 'SLA records' }])
    const { records, filterOptions, statusCounts } = useSlaDashboard()

    return (
        <>
            <PageHeader
                title="SLA records"
                description="Click a case for its SLA timeline, or open it in Dynamics 365."
                actions={<SlaRefreshButton />}
            />
            <SlaFilterBar options={filterOptions} statusCounts={statusCounts} showStatusAndSearch />
            <SlaRecordsTable records={records} />
            <SlaCaseDrawer />
        </>
    )
}
