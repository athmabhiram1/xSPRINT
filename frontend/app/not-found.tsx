'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center">
                {/* 404 Illustration */}
                <div className="mb-8">
                    <div className="text-9xl font-bold text-gray-200 select-none">404</div>
                    <div className="relative -mt-16">
                        <svg
                            className="w-32 h-32 mx-auto text-blue-500 animate-bounce"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Page Not Found
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-200"
                    >
                        ← Go Back
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        🏠 Home
                    </Link>
                    <Link
                        href="/login"
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                        🔐 Login
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <Link href="/tournaments" className="text-blue-600 hover:underline">
                            Tournaments
                        </Link>
                        <Link href="/events" className="text-blue-600 hover:underline">
                            Events
                        </Link>
                        <Link href="/admin/dashboard" className="text-blue-600 hover:underline">
                            Admin Dashboard
                        </Link>
                        <Link href="/umpire/matches" className="text-blue-600 hover:underline">
                            Umpire Console
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-xs text-gray-400">
                    xSPRINT Tournament Management System
                </div>
            </div>
        </div>
    );
}
