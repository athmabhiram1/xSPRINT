'use client';

import React, { useEffect, useState } from 'react';
import { apiGet } from '@/lib/apiClient';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { Shield, Clock, User, AlertCircle } from 'lucide-react';
import { LoadingSkeleton } from './LoadingSkeleton';

interface SecurityActivity {
    id: string;
    timestamp: string;
    action: string;
    user: string;
    matchId?: string;
    details?: string;
}

export function SecurityActivityPanel() {
    const [activities, setActivities] = useState<SecurityActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const handleApiError = useApiErrorHandler();

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            // This endpoint should return last 5 audit entries
            const data = await apiGet<SecurityActivity[]>('/api/admin/security-activity');
            setActivities(data);
        } catch (error: any) {
            handleApiError(error);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('submitted')) return Shield;
        if (action.includes('failed')) return AlertCircle;
        return User;
    };

    const getActionColor = (action: string) => {
        if (action.includes('failed')) return 'text-red-600 dark:text-red-400';
        if (action.includes('submitted')) return 'text-green-600 dark:text-green-400';
        return 'text-blue-600 dark:text-blue-400';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Recent Security Activity
                </h2>
            </div>

            {loading ? (
                <LoadingSkeleton variant="table" />
            ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent security activity</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity) => {
                        const Icon = getActionIcon(activity.action);
                        const colorClass = getActionColor(activity.action);

                        return (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0"
                            >
                                <div className={`${colorClass} mt-1`}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {activity.action}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {activity.user}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        {activity.matchId && (
                                            <span className="text-primary">Match #{activity.matchId}</span>
                                        )}
                                    </div>
                                    {activity.details && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {activity.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
