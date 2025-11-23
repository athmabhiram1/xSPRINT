'use client';

import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
    const { offline, refreshUser } = useAuth();

    if (!offline) return null;

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                Backend Server Offline
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                                Cannot reach server at http://localhost:5000. Some features may be unavailable.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => refreshUser()}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                    </button>
                </div>
            </div>
        </div>
    );
}
