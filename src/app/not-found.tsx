import Link from 'next/link'
import Button from '@/components/ui/Button'
import { homePath } from '@/configs/app.config'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
            <h2>Page not found</h2>
            <p className="text-gray-500">The page you were looking for doesn&apos;t exist or has moved.</p>
            <Link href={homePath}>
                <Button variant="solid">Go to the home page</Button>
            </Link>
        </div>
    )
}
