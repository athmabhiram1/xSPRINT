'use client';

import React, { useEffect, useState } from 'react';
import { apiGet } from '@/lib/apiClient';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { AuthNavBar } from '@/components/AuthNavBar';
import { SecurityActivityPanel } from '@/components/SecurityActivityPanel';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import {
    Trophy,
    CheckCircle,
    Clock,
    Target,
    Users,
    Building2,
    Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    totalMatches: number;
    completedMatches: number;
    pendingMatches: number;
    activeCourts: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const handleApiError = useApiErrorHandler();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await apiGet<DashboardStats>('/api/admin/stats');
            setStats(data);
        } catch (error: any) {
            handleApiError(error);
            setStats({
                totalMatches: 0,
                completedMatches: 0,
                pendingMatches: 0,
                activeCourts: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Matches',
            value: stats?.totalMatches || 0,
            icon: Trophy,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            title: 'Completed',
            value: stats?.completedMatches || 0,
            icon: CheckCircle,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
        {
            title: 'Pending',
            value: stats?.pendingMatches || 0,
            icon: Clock,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        },
        {
            title: 'Active Courts',
            value: stats?.activeCourts || 0,
            icon: Target,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
    ];

    const quickActions = [
        { href: '/admin/players', label: 'Manage Players', icon: Users, color: 'text-blue-600' },
        { href: '/admin/clubs', label: 'Manage Clubs', icon: Building2, color: 'text-green-600' },
        { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy, color: 'text-purple-600' },
        { href: '/admin/events', label: 'Events', icon: Calendar, color: 'text-orange-600' },
    ];

    return (
        <>
            <AuthNavBar />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage your tournament operations
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <LoadingSkeleton key={i} variant="card" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {statCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={card.title}
                                        className={`${card.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`${card.color} p-3 rounded-lg`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                                            {card.title}
                                        </h3>
                                        <p className={`${card.textColor} text-3xl font-bold`}>
                                            {card.value}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <RoleSwitcher />

                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                                    >
                                        <Icon className={`${action.color} w-8 h-8 mb-3`} />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {action.label}
                                        </h3>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <SecurityActivityPanel />
                </div>
            </div>
        </>
    );
}
