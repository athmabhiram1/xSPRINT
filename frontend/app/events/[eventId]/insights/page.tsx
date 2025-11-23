'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/apiClient';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useToast } from '@/components/ToastProvider';
import { AuthNavBar } from '@/components/AuthNavBar';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { getSocket } from '@/lib/socketClient';
import { TrendingUp, Users, Clock, AlertTriangle, Radio } from 'lucide-react';

interface EventAnalytics {
    courtUtilization: Array<{ court: string; matches: number; utilization: number }>;
    sameClubClashes: number;
    restTimeViolations: number;
    totalMatches: number;
    completedMatches: number;
}

export default function EventInsightsPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { toast } = useToast();
    const handleApiError = useApiErrorHandler();

    const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        fetchAnalytics();

        // Connect to Socket.IO for real-time updates
        const socket = getSocket();

        socket.emit('join-event', eventId);
        setIsLive(true);

        socket.on('MATCH_COMPLETED', () => {
            toast({
                type: 'info',
                title: 'Match completed',
                message: 'Insights updated with latest match data.',
                duration: 3000,
            });
            fetchAnalytics();
        });

        socket.on('LEADERBOARD_UPDATED', () => {
            toast({
                type: 'info',
                title: 'Leaderboard updated',
                message: 'Event standings have been refreshed.',
                duration: 3000,
            });
            fetchAnalytics();
        });

        // Cleanup on unmount
        return () => {
            socket.emit('leave-event', eventId);
            socket.off('MATCH_COMPLETED');
            socket.off('LEADERBOARD_UPDATED');
            setIsLive(false);
        };
    }, [eventId]);

    const fetchAnalytics = async () => {
        try {
            const data = await apiGet<EventAnalytics>(`/api/events/${eventId}/analytics`);
            setAnalytics(data);
        } catch (error: any) {
            handleApiError(error);
            // Set default values on error
            setAnalytics({
                courtUtilization: [],
                sameClubClashes: 0,
                restTimeViolations: 0,
                totalMatches: 0,
                completedMatches: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AuthNavBar />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header with Live Indicator */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Event Insights
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Real-time analytics and statistics
                            </p>
                        </div>

                        {isLive && (
                            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full">
                                <Radio className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">Live Updates</span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-6">
                            <LoadingSkeleton variant="card" />
                            <LoadingSkeleton variant="card" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                                        Total Matches
                                    </h3>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {analytics?.totalMatches || 0}
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                                            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                                        Completed
                                    </h3>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {analytics?.completedMatches || 0}
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                                            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                                        Same-Club Clashes
                                    </h3>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {analytics?.sameClubClashes || 0}
                                    </p>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                                            <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                                        Rest-Time Violations
                                    </h3>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {analytics?.restTimeViolations || 0}
                                    </p>
                                </div>
                            </div>

                            {/* Court Utilization */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                    Court Utilization
                                </h2>

                                {analytics?.courtUtilization && analytics.courtUtilization.length > 0 ? (
                                    <div className="space-y-4">
                                        {analytics.courtUtilization.map((court) => (
                                            <div key={court.court}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {court.court}
                                                    </span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {court.matches} matches · {court.utilization}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                    <div
                                                        className="bg-primary h-3 rounded-full transition-all duration-500"
                                                        style={{ width: `${court.utilization}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No court utilization data available</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
