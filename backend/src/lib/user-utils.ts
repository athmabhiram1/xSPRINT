/**
 * User Management Utilities
 * 
 * Helper functions for creating and managing users programmatically.
 * Useful for seeding, testing, and admin operations.
 */

import bcrypt from 'bcryptjs';
import prisma from '../lib/db';
import { authConfig } from '../config/auth';
import { Role } from '@prisma/client';

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    role?: Role;
}

/**
 * Create a new user with hashed password
 */
export async function createUser(input: CreateUserInput) {
    const { name, email, password, role = Role.VIEWER } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error(`User with email ${email} already exists`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);

    // Create user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    return user;
}

/**
 * Create multiple users at once
 */
export async function createUsers(users: CreateUserInput[]) {
    const results = [];

    for (const userData of users) {
        try {
            const user = await createUser(userData);
            results.push({ success: true, user });
        } catch (error) {
            results.push({
                success: false,
                email: userData.email,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return results;
}

/**
 * Verify a user's password
 */
export async function verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return false;
    }

    return bcrypt.compare(password, user.passwordHash);
}

/**
 * Update user's password
 */
export async function updatePassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, authConfig.bcryptSaltRounds);

    return prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
        select: {
            id: true,
            email: true,
            name: true,
        },
    });
}

/**
 * Update user's role
 */
export async function updateUserRole(userId: string, role: Role) {
    return prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    });
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
    return prisma.user.delete({
        where: { id: userId },
    });
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: Role) {
    return prisma.user.findMany({
        where: { role },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
}
