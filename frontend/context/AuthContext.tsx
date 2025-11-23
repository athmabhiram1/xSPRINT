'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout, register as apiRegister, getCurrentUser, ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'ORGANIZER' | 'UMPIRE' | 'VIEWER';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    offline: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { name: string; email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const refreshUser = useCallback(async () => {
        try {
            setError(null);
            const userData = await getCurrentUser();
            setUser(userData as User);
            setOffline(false);
        } catch (err: any) {
            const apiError = err as ApiError;

            if (apiError.type === 'NETWORK_ERROR') {
                // Server is offline - don't clear user, just set offline flag
                setOffline(true);
                console.warn('Backend server is offline');
            } else if (apiError.type === 'UNAUTHORIZED') {
                // No session - this is normal for logged-out users
                setUser(null);
                setOffline(false);
            } else {
                // Other errors
                setError(apiError.message);
                console.error('Auth error:', apiError);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Check session on mount
    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            const response = await apiLogin(email, password);
            setUser(response.user as User);
            setOffline(false);

            // Store last role for convenience
            if (typeof window !== 'undefined') {
                localStorage.setItem('xsprint_last_role', response.user.role);
            }

            toast({
                title: 'Welcome back!',
                description: `Signed in as ${response.user.name}`,
            });

            // Redirect based on role
            if (response.user.role === 'ADMIN' || response.user.role === 'ORGANIZER') {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard'); // or /tournaments
            }
        } catch (err: any) {
            const apiError = err as ApiError;

            if (apiError.type === 'NETWORK_ERROR') {
                setOffline(true);
                toast({
                    variant: 'destructive',
                    title: 'Server Offline',
                    description: 'Cannot connect to server. Please check if backend is running on http://localhost:5000',
                });
                throw new Error('Server offline');
            } else if (apiError.type === 'UNAUTHORIZED') {
                toast({
                    variant: 'destructive',
                    title: 'Login Failed',
                    description: 'Invalid email or password',
                });
                throw new Error('Invalid credentials');
            } else if (apiError.type === 'RATE_LIMIT') {
                toast({
                    variant: 'destructive',
                    title: 'Too Many Attempts',
                    description: `Please try again in ${apiError.retryAfter || 15} minutes.`,
                });
                throw new Error('Rate limited');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Login Failed',
                    description: apiError.message || 'An error occurred during login',
                });
                throw new Error(apiError.message);
            }
        }
    };

    const register = async (data: { name: string; email: string; password: string }) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiRegister(data);
            setUser(response.user as User);
            setOffline(false);

            toast({
                title: "Registration Successful",
                description: "Welcome to xSPRINT!",
            });

            // Redirect to dashboard after successful registration
            router.push('/dashboard');
        } catch (err: any) {
            const apiError = err as ApiError;

            setError(apiError.message || 'Registration failed');
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: apiError.message || "Please try again later.",
            });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiLogout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            router.push('/login');
            toast({
                title: 'Logged Out',
                description: 'You have been logged out successfully',
            });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                offline,
                error,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
