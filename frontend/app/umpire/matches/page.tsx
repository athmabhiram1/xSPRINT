'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/apiClient';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { AuthNavBar } from '@/components/AuthNavBar';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ClipboardList, Target, Clock, MapPin } from 'lucide-react';

interface Match {
    id: string;
    matchNumber: number;
    playerA: { name: string };
    playerB: { name: string };
    court?: { name: string };
    scheduledTime?: string;
    status: string;
}

export default function UmpireMatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const handleApiError = useApiErrorHandler();

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const data = await apiGet<Match[]>('/api/umpire/my-matches');
            setMatches(data);
        } catch (error: any) {
            handleApiError(error);
            setMatches([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            LIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            COMPLETED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        };

        return (
            <span className={`${styles[status as keyof typeof styles] || styles.PENDING} px-2 py-1 rounded-full text-xs font-medium`}>
                {status}
            </span>
        );
    };

    return (
        <>
            <AuthNavBar />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            My Assigned Matches
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Matches assigned to you for scoring
                        </p>
                    </div>

                    {/* Matches Table */}
                    {loading ? (
                        <LoadingSkeleton variant="table" />
                    ) : matches.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No matches assigned
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                You don't have any matches assigned to you yet.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Match #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Players
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Court
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {matches.map((match) => (
                                            <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    #{match.matchNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    <div className="font-medium">{match.playerA.name}</div>
                                                    <div className="text-gray-500 dark:text-gray-400">vs</div>
                                                    <div className="font-medium">{match.playerB.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {match.court?.name || 'TBD'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {match.scheduledTime
                                                            ? new Date(match.scheduledTime).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })
                                                            : 'TBD'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(match.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <Link
                                                        href={`/umpire/match/${match.id}`}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                                    >
                                                        <Target className="w-4 h-4" />
                                                        Open Scoring
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
