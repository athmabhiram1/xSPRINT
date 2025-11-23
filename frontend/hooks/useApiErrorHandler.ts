'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ApiError } from '@/lib/apiClient';

/**
 * Enhanced API error handler hook with production-ready patterns
 * Handles 401, 403, 429, and generic errors with proper UX
 */
export function useApiErrorHandler() {
    const router = useRouter();
    const { logout } = useAuth();
    const { toast } = useToast();

    return function handleApiError(error: ApiError, requestUrl?: string) {
        const messageFromServer = error.message || 'Something went wrong. Please try again.';
        const status = error.status || 500;

        switch (status) {
            case 401: {
                // Session expired or not authenticated
                const isLoginRequest = requestUrl?.includes('/auth/login');

                if (!isLoginRequest) {
                    logout(); // Clear client-side auth state
                    toast({
                        variant: 'destructive',
                        title: 'Session expired',
                        description: 'Please log in again to continue.',
                    });
                    router.push('/login?reason=session_expired');
                } else {
                    // Login failed - show error but don't redirect
                    toast({
                        variant: 'destructive',
                        title: 'Login failed',
                        description: messageFromServer || 'Invalid email or password.',
                    });
                }
                break;
            }

            case 403: {
                // Access denied
                toast({
                    variant: 'destructive',
                    title: 'Access denied',
                    description: messageFromServer || 'You do not have permission to perform this action.',
                });
                break;
            }

            case 429: {
                // Rate limited
                const retryAfter = error.retryAfter || 10;
                toast({
                    variant: 'destructive',
                    title: 'Too many attempts',
                    description: `You've hit the security limit. Please try again in ${retryAfter} minutes.`,
                });
                break;
            }

            case 404: {
                toast({
                    variant: 'destructive',
                    title: 'Not found',
                    description: messageFromServer || 'The requested resource was not found.',
                });
                break;
            }

            default: {
                if (status >= 400 && status < 500) {
                    // Client errors
                    toast({
                        variant: 'destructive',
                        title: 'Request failed',
                        description: messageFromServer,
                    });
                } else if (status >= 500) {
                    // Server errors
                    toast({
                        variant: 'destructive',
                        title: 'Server error',
                        description: 'The server ran into a problem. Please try again later.',
                    });
                } else {
                    // Generic fallback
                    toast({
                        variant: 'destructive',
                        title: 'Something went wrong',
                        description: messageFromServer,
                    });
                }
            }
        }
    };
}
