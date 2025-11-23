import type { User } from './apiClient';

/**
 * Role guard utilities for authorization checks
 */

export function isAdmin(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'ORGANIZER';
}

export function isOrganizer(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ORGANIZER';
}

export function isUmpire(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'UMPIRE';
}

export function allowRoles(user: User | null, roles: User['role'][]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
}
