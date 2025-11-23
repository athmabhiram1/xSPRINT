'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export function SessionBadge() {
    const { user } = useAuth();

    if (!user) return null;

    const roleColors = {
        ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        ORGANIZER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        UMPIRE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        VIEWER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    const envName = process.env.NEXT_PUBLIC_ENV_NAME;
    const truncatedEmail = user.email.length > 20 ? user.email.substring(0, 17) + '...' : user.email;

    return (
        <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
            <div className={`${roleColors[user.role]} px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2`}>
                <span className="w-2 h-2 bg-current rounded-full animate-pulse" />
                <span>
                    {user.role} · {truncatedEmail}
                </span>
            </div>

            {envName && (
                <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded text-xs font-bold">
                    {envName}
                </div>
            )}
        </div>
    );
}
