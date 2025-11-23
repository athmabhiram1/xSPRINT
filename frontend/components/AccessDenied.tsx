'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function AccessDenied() {
    const router = useRouter();
    const { logout } = useAuth();

    const handleGoHome = () => {
        router.push('/');
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                    <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Access Denied
                </h1>

                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleGoHome}
                        className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Go Home
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
