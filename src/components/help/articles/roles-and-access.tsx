import { type HelpArticle } from '@/@types/help/HelpArticle'
import { HelpList, HelpNote, HelpTable, HelpText, UiLabel } from '../HelpContent'

export const article: HelpArticle = {
    slug: 'roles-and-access',
    title: 'Signing in, roles and access',
    summary: 'Signing in with Microsoft 365, what Viewers and Admins can do, and how to get access.',
    category: 'getting-started',
    updatedOn: '2026-10-22',
    readMinutes: 2,
    keywords: ['login', 'sign in', 'sign out', 'microsoft', 'entra', 'admin', 'viewer', 'permission', 'access'],
    related: ['faq', 'what-is-sla-performance'],
    sections: [
        {
            id: 'sign-in',
            title: 'Signing in',
            body: (
                <>
                    <HelpText>
                        Sign in with your Smarter Communities Microsoft 365 work account. It’s the same account you use
                        for Outlook and Teams. Only company email addresses can sign in.
                    </HelpText>
                    <HelpText>
                        A sign-in lasts a working day (8 hours). After that you’re asked to sign in again.
                    </HelpText>
                </>
            ),
        },
        {
            id: 'roles',
            title: 'Roles',
            body: (
                <HelpTable
                    headers={['Role', 'Can']}
                    rows={[
                        [
                            <UiLabel key="v">Viewer</UiLabel>,
                            'See the dashboard, SLA records, case details and case history',
                        ],
                        [
                            <UiLabel key="a">Admin</UiLabel>,
                            <>
                                Everything a Viewer can, plus <UiLabel>Roles &amp; Permissions</UiLabel>: see who has
                                access and give people their roles
                            </>,
                        ],
                    ]}
                />
            ),
        },
        {
            id: 'getting-access',
            title: 'Getting access, or a different role',
            body: (
                <>
                    <HelpText>
                        Ask an Admin. They can assign roles on the <UiLabel>Roles &amp; Permissions</UiLabel> page.
                        Roles are kept in Microsoft Entra ID, so IT can assign them there too.
                    </HelpText>
                    <HelpNote>
                        A new role applies the next time you sign in: sign out and back in after an Admin changes it.
                    </HelpNote>
                </>
            ),
        },
        {
            id: 'signing-out',
            title: 'Signing out, and shared computers',
            body: (
                <HelpList
                    items={[
                        <>Sign out from your name in the top-right corner. Always sign out on a shared computer.</>,
                        <>
                            Your saved filters and recently viewed cases are kept in this browser, separately for each
                            person who signs in on it.
                        </>,
                    ]}
                />
            ),
        },
    ],
}
