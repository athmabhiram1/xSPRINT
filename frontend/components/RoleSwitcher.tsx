'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, AlertCircle } from 'lucide-react';

export function RoleSwitcher() {
    const { user } = useAuth();
    const router = useRouter();
    const [showBanner, setShowBanner] = useState(false);

    // Only show for admins
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
        return null;
    }

    const handleViewAs = (role: 'UMPIRE' | 'VIEWER') => {
        setShowBanner(true);

        if (role === 'UMPIRE') {
            router.push('/umpire/matches?demo=true');
        } else {
            router.push('/leaderboard?demo=true');
        }
    };

    return (
        <div className="mb-6">
            {showBanner && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
                            Demo View Active
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                            You are still logged in as {user.role}. This is just a navigation demo.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Demo: View as Different Role
                    </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Quickly navigate to different role views for demonstration purposes
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleViewAs('UMPIRE')}
                        className="flex-1 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium"
                    >
                        View as Umpire
                    </button>
                    <button
                        onClick={() => handleViewAs('VIEWER')}
                        className="flex-1 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium"
                    >
                        View as Viewer
                    </button>
                </div>
            </div>
        </div>
    );
}
