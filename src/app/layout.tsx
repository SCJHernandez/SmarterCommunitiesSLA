import type { Metadata } from 'next'
import ThemeProvider from '@/components/template/Theme/ThemeProvider'
import SWRAppConfig from '@/components/swr/SWRAppConfig'
import { themeConfig } from '@/configs/theme.config'
import { portalDescription, portalName } from '@/configs/app.config'
import { getTheme } from '@/server/actions/theme'
import type { PartialTheme } from '@/@types/theme'
import '@/assets/styles/app.css'

export const metadata: Metadata = {
    title: { default: portalName, template: `%s | ${portalName}` },
    description: portalDescription,
    icons: {
        icon: [
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
    },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const saved = await getTheme()
    const theme: PartialTheme = {
        ...themeConfig,
        ...saved,
        layout: { ...themeConfig.layout, ...saved.layout },
    }

    return (
        <html lang="en" className={theme.mode === 'dark' ? 'dark' : 'light'} suppressHydrationWarning>
            <body>
                <ThemeProvider theme={theme}>
                    <SWRAppConfig>{children}</SWRAppConfig>
                </ThemeProvider>
            </body>
        </html>
    )
}
