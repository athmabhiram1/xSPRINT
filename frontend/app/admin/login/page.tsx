'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

export default function AdminLoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'ADMIN' || user.role === 'ORGANIZER') {
                router.push('/admin/dashboard');
            } else if (user.role === 'UMPIRE') {
                router.push('/umpire/dashboard');
            } else {
                router.push('/');
            }
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <LoginForm
            title="Admin / Organizer Login"
            subtitle="Restricted access for tournament desk & organizers"
            onSuccessRedirect={(role) => {
                if (role === 'ADMIN' || role === 'ORGANIZER') return '/admin/dashboard';
                if (role === 'UMPIRE') return '/umpire/dashboard';
                return '/';
            }}
            showBackLink
            backLinkText="Player login"
            backLinkHref="/login"
        />
    );
}
