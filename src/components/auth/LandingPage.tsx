'use client'

import Button from '@/components/ui/Button'
import Logo from '@/components/template/Logo'
import SignInCard, { getSignInHref } from './SignInCard'
import {
    ActionCenterIcon,
    AlertsIcon,
    InsightIcon,
    MicrosoftIcon,
    MonitorIcon,
    SuccessIcon,
} from '@/configs/icons.config'
import { companyName, portalName, privacyPolicyUrl, termsOfUseUrl } from '@/configs/app.config'
import useTheme from '@/utils/hooks/useTheme'
import type { ComponentProps, ElementType } from 'react'

const HIGHLIGHTS = [
    'Every breached and at-risk SLA on open cases, in one list',
    'Each period compared like for like with the one before',
    'Any case’s SLA timeline and change history, a click away',
]

const FEATURES: { icon: ElementType; title: string; description: string }[] = [
    {
        icon: AlertsIcon,
        title: 'Needs attention now',
        description: 'Breached, at-risk and long-paused SLAs on open cases, however long ago they started.',
    },
    {
        icon: ActionCenterIcon,
        title: 'Action Center',
        description: 'One row per case, most urgent first, with the time left or overdue and the next step.',
    },
    {
        icon: MonitorIcon,
        title: 'Performance and trends',
        description: 'Success rate, breaches and median time to meet, with what changed since the last period.',
    },
    {
        icon: InsightIcon,
        title: 'Insights',
        description: 'Plain-language findings: where breaches concentrate, adherence shifts, and forgotten pauses.',
    },
]

const STEPS = [
    { title: 'Sign in', description: `With your ${companyName} Microsoft 365 account. Nothing to install.` },
    { title: 'Start with what needs attention', description: 'Breached SLAs first, then those about to breach.' },
    { title: 'Open the case and act', description: 'See its SLA timeline and history, then open it in Dynamics 365.' },
]

/**
 * The first page people see before signing in: what the app is for, and the sign-in card. Also shown after
 * signing out, when a session ends, or when sign-in goes wrong (the card shows the message).
 */
export default function LandingPage(props: ComponentProps<typeof SignInCard>) {
    const mode = useTheme((state) => state.mode)
    const signInHref = getSignInHref(props.returnTo, !!props.error || props.signedOut)

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
            <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                <Logo mode={mode} type="full" logoWidth={160} />
                <a href={signInHref}>
                    <Button size="sm" variant="default" icon={<MicrosoftIcon />}>
                        Sign in
                    </Button>
                </a>
            </header>

            <main className="flex-auto">
                {/* What it is, and signing in */}
                <section className="bg-linear-to-br from-primary-subtle via-white to-cyan-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
                    <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-24">
                        <div>
                            <span className="mb-4 inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm dark:bg-gray-800">
                                {portalName} · Dynamics 365 Customer Service
                            </span>
                            <h1 className="mb-4 text-4xl leading-tight font-bold sm:text-5xl">
                                Stay ahead of every SLA
                            </h1>
                            <p className="mb-8 max-w-xl text-lg text-gray-600 dark:text-gray-300">
                                See which cases are about to miss their SLA, which already have, and how the team is
                                tracking, so the right case gets attention before the deadline passes.
                            </p>
                            <ul className="flex flex-col gap-3">
                                {HIGHLIGHTS.map((text) => (
                                    <li key={text} className="flex items-start gap-3 text-gray-700 dark:text-gray-200">
                                        <SuccessIcon className="mt-0.5 shrink-0 text-xl text-success" />
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <SignInCard {...props} />
                    </div>
                </section>

                {/* What's inside */}
                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                    <div className="mb-10 text-center">
                        <h2 className="mb-2 text-3xl">Built to monitor, and to act</h2>
                        <p className="mx-auto max-w-2xl text-gray-500">
                            One place for the SLA questions that matter each day: what’s breached, what’s next, and
                            whether things are getting better.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map(({ icon: Icon, title, description }) => (
                            <div
                                key={title}
                                className="flex flex-col items-center rounded-2xl bg-gray-50 p-6 text-center dark:bg-gray-800"
                            >
                                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-primary shadow-sm dark:bg-gray-700">
                                    <Icon />
                                </span>
                                <h6 className="mb-2">{title}</h6>
                                <p className="text-sm text-gray-500">{description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How it works */}
                <section className="bg-gray-50 dark:bg-gray-800">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                        <h2 className="mb-10 text-center text-3xl">How it works</h2>
                        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {STEPS.map((step, index) => (
                                <li key={step.title} className="flex gap-4">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <span>
                                        <span className="mb-1 block font-semibold text-gray-900 dark:text-gray-100">
                                            {step.title}
                                        </span>
                                        <span className="text-gray-500">{step.description}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                        <div className="mt-12 text-center">
                            <a href={signInHref}>
                                <Button variant="solid" icon={<MicrosoftIcon />}>
                                    Sign in with Microsoft
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-gray-200 dark:border-gray-700">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{portalName}</span> &copy;{' '}
                        {new Date().getFullYear()} {companyName}
                    </span>
                    <span className="flex gap-4">
                        <a href={termsOfUseUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                            Terms &amp; Conditions
                        </a>
                        <a href={privacyPolicyUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                            Privacy Policy
                        </a>
                    </span>
                </div>
            </footer>
        </div>
    )
}
