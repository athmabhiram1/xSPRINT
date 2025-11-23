'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ToastProvider';

/**
 * Client-side providers wrapper
 * Avoids server/client component boundary issues
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
    );
}
