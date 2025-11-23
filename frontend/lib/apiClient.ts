const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    'http://localhost:5000';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'ORGANIZER' | 'UMPIRE' | 'VIEWER';
}

export interface ApiError {
    type: 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'RATE_LIMIT' | 'HTTP_ERROR' | 'VALIDATION_ERROR';
    status?: number;
    message: string;
    details?: any;
    retryAfter?: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    [key: string]: any;
}

export async function apiFetchResponse<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${path}`;

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        });

        let body: ApiResponse<T>;
        try {
            body = await response.json();
        } catch {
            body = { success: false, error: 'Invalid response format' };
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw {
                    type: 'UNAUTHORIZED',
                    status: 401,
                    message: body.error || 'Authentication required',
                    details: body,
                } as ApiError;
            }

            if (response.status === 403) {
                throw {
                    type: 'FORBIDDEN',
                    status: 403,
                    message: body.error || 'Access forbidden',
                    details: body,
                } as ApiError;
            }

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                throw {
                    type: 'RATE_LIMIT',
                    status: 429,
                    message: body.error || 'Too many requests',
                    retryAfter,
                    details: body,
                } as ApiError;
            }

            if (response.status === 400) {
                throw {
                    type: 'VALIDATION_ERROR',
                    status: 400,
                    message: body.error || 'Validation failed',
                    details: body,
                } as ApiError;
            }

            throw {
                type: 'HTTP_ERROR',
                status: response.status,
                message: body.error || `HTTP ${response.status} error`,
                details: body,
            } as ApiError;
        }

        return body;
    } catch (error: any) {
        if (error.type) {
            throw error;
        }

        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw {
                type: 'NETWORK_ERROR',
                message: 'Cannot reach backend server. Please check if the server is running on ' + API_BASE_URL,
            } as ApiError;
        }

        throw {
            type: 'HTTP_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error,
        } as ApiError;
    }
}

export async function apiFetch<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const body = await apiFetchResponse<T>(path, options);
    if (!body.success) {
        throw {
            type: 'HTTP_ERROR',
            message: body.error || 'Request failed',
            details: body,
        } as ApiError;
    }
    return body.data as T;
}

export async function register(data: { name: string; email: string; password: string }) {
    const user = await apiFetch<User>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return { user };
}

export async function login(email: string, password: string) {
    const user = await apiFetch<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    return { user };
}

export async function logout() {
    return apiFetch('/api/auth/logout', {
        method: 'POST',
    });
}

export async function getCurrentUser() {
    return apiFetch<User>('/api/auth/me');
}

export async function apiGet<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
    return apiFetch<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
    return apiFetch<T>(path, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });
}

export async function apiDelete<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE' });
}
