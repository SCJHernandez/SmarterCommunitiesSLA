'use client'

import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { MicrosoftIcon } from '@/configs/icons.config'
import { companyName, portalName, signInUrl } from '@/configs/app.config'
import { RETURN_TO_URL_KEY } from '@/constants/auth.constant'

/** The sign-in route, returning to `returnTo`. `chooseAccount` asks Microsoft which account to use. */
export const getSignInHref = (returnTo: string, chooseAccount: boolean) => {
    const params = new URLSearchParams({ [RETURN_TO_URL_KEY]: returnTo })
    if (chooseAccount) params.set('select', '1')
    return `${signInUrl}?${params}`
}

interface SignInCardProps {
    returnTo: string
    error: string | null
    signedOut: boolean
    /** e.g. ['smarterdirectory.com.au'] */
    allowedDomains: string[]
}

/** Sign in with a Microsoft 365 work account (on the landing page). */
export default function SignInCard({ returnTo, error, signedOut, allowedDomains }: SignInCardProps) {
    // After an error or signing out, let them pick a different account instead of signing straight back in.
    const href = getSignInHref(returnTo, !!error || signedOut)

    return (
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <h4 className="mb-1">Sign in</h4>
            <p className="mb-6 text-gray-500">
                {portalName} uses your {companyName} Microsoft 365 account
                {allowedDomains.length > 0 && (
                    <>
                        {' '}
                        (<span className="font-semibold">name@{allowedDomains.join(' or name@')}</span>)
                    </>
                )}
                .
            </p>
            {error && (
                <Alert showIcon type="danger" className="mb-5">
                    {error}
                </Alert>
            )}
            {signedOut && !error && (
                <Alert showIcon type="success" className="mb-5">
                    You&apos;ve signed out.
                </Alert>
            )}
            {/* A full page load: the route redirects to Microsoft */}
            <a href={href}>
                <Button block variant="solid" icon={<MicrosoftIcon />}>
                    Sign in with Microsoft
                </Button>
            </a>
            <p className="mt-6 text-center text-xs text-gray-500">
                Access is managed by your administrator in Microsoft Entra ID.
            </p>
        </div>
    )
}
