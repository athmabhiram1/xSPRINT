'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/AccessDenied';
import { OfflineBanner } from '@/components/OfflineBanner';
import { allowRoles } from '@/lib/roleGuard';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, offline } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user && !offline) {
            router.replace('/admin/login?reason=unauthorized');
        }
    }, [loading, user, offline, router]);

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // If offline but user exists (cached), allow access with warning banner
    // If offline and no user, redirect will happen when connection is restored
    if (!user && !offline) {
        return null; // Redirect happening
    }

    // Check if user has admin/organizer role
    if (user && !allowRoles(user, ['ADMIN', 'ORGANIZER'])) {
        return <AccessDenied />;
    }

    // Authorized - render children with offline banner if applicable
    return (
        <>
            <OfflineBanner />
            {children}
        </>
    );
}
