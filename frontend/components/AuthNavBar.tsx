'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SessionBadge } from './SessionBadge';
import {
    LayoutDashboard,
    Users,
    Building2,
    Trophy,
    Calendar,
    ClipboardList,
    Target,
    TrendingUp,
    LogOut,
    LogIn
} from 'lucide-react';

export function AuthNavBar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Don't show navbar on login page
    if (pathname === '/login') return null;

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const navLinks = React.useMemo(() => {
        if (!user) {
            return [];
        }

        if (user.role === 'ADMIN' || user.role === 'ORGANIZER') {
            return [
                { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/admin/players', label: 'Players', icon: Users },
                { href: '/admin/clubs', label: 'Clubs', icon: Building2 },
                { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
                { href: '/admin/events', label: 'Events', icon: Calendar },
            ];
        }

        if (user.role === 'UMPIRE') {
            return [
                { href: '/umpire/matches', label: 'My Matches', icon: ClipboardList },
                { href: '/umpire/live', label: 'Live Scoring', icon: Target },
            ];
        }

        // VIEWER
        return [
            { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
            { href: '/tournaments', label: 'Tournaments', icon: Trophy },
        ];
    }, [user]);

    return (
        <>
            <SessionBadge />

            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-primary" />
                            <span className="font-bold text-xl">xSPRINT</span>
                        </Link>

                        {/* Navigation Links */}
                        {user ? (
                            <div className="flex items-center gap-1">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="hidden sm:inline">{link.label}</span>
                                        </Link>
                                    );
                                })}

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
