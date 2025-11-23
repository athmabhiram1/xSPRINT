import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db';
import { authConfig } from '../config/auth';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

/**
 * POST /api/auth/register-admin
 * 
 * Bootstrap endpoint for creating the first admin user.
 * Requires ADMIN_BOOTSTRAP_CODE from environment variables.
 * Blocks creation of multiple admins unless ALLOW_MULTIPLE_ADMINS is true.
 */
router.post('/register-admin', async (req, res: Response) => {
    try {
        const { name, email, password, adminCode } = req.body;

        // Validate required fields
        if (!name || !email || !password || !adminCode) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'password', 'adminCode'],
            });
        }

        // Verify bootstrap code
        if (!authConfig.adminBootstrapCode) {
            return res.status(500).json({
                error: 'Admin registration not configured',
                message: 'ADMIN_BOOTSTRAP_CODE environment variable is not set',
            });
        }

        if (adminCode !== authConfig.adminBootstrapCode) {
            return res.status(403).json({
                error: 'Invalid admin code',
                message: 'The provided admin bootstrap code is incorrect',
            });
        }

        // Check if admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: Role.ADMIN },
        });

        if (existingAdmin && !authConfig.allowMultipleAdmins) {
            return res.status(403).json({
                error: 'Admin already exists',
                message: 'An admin user already exists. Multiple admins are not allowed.',
            });
        }

        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                error: 'Email already in use',
                message: 'A user with this email already exists',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: Role.ADMIN,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate JWT
        const token = jwt.sign(
            {
                userId: admin.id,
                role: admin.role,
                email: admin.email,
            },
            authConfig.jwtSecret,
            { expiresIn: authConfig.jwtExpiresIn } as any
        );

        // Set cookie
        res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);

        res.status(201).json({
            message: 'Admin user created successfully',
            user: admin,
        });
    } catch (error) {
        console.error('Error in register-admin:', error);
        res.status(500).json({
            error: 'Failed to create admin user',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/auth/register
 * 
 * Register a new user (VIEWER role by default).
 */
router.post('/register', async (req, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'password'],
            });
        }

        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                error: 'Email already in use',
                message: 'A user with this email already exists',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, authConfig.bcryptSaltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: Role.VIEWER, // Default role
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                email: user.email,
            },
            authConfig.jwtSecret,
            { expiresIn: authConfig.jwtExpiresIn } as any
        );

        // Set cookie
        res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);

        res.status(201).json({
            message: 'User registered successfully',
            user,
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            error: 'Failed to register user',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/auth/login
 * 
 * Authenticate user with email and password.
 * Returns user info and sets httpOnly JWT cookie.
 */
router.post('/login', async (req, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['email', 'password'],
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect',
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect',
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                email: user.email,
            },
            authConfig.jwtSecret,
            { expiresIn: authConfig.jwtExpiresIn } as any
        );

        // Set cookie
        res.cookie(authConfig.cookieName, token, authConfig.cookieOptions);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            error: 'Login failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /api/auth/logout
 * 
 * Clear authentication cookie.
 */
router.post('/logout', (req, res: Response) => {
    res.clearCookie(authConfig.cookieName, {
        httpOnly: true,
        secure: authConfig.cookieOptions.secure,
        sameSite: authConfig.cookieOptions.sameSite,
    });

    res.json({
        message: 'Logout successful',
    });
});

/**
 * GET /api/auth/me
 * 
 * Get current authenticated user's information.
 * Requires authentication.
 */
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        // req.user is guaranteed to exist because of requireAuth middleware
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'The authenticated user no longer exists',
            });
        }

        res.json({
            user,
        });
    } catch (error) {
        console.error('Error in /me:', error);
        res.status(500).json({
            error: 'Failed to fetch user data',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
