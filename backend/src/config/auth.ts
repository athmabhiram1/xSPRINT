/**
 * Authentication Configuration
 * 
 * Centralizes all auth-related environment variables and constants.
 * Fails fast if critical environment variables are missing.
 */

if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Please add it to your .env file.');
}

export const authConfig = {
    /**
     * Secret key for signing and verifying JWT tokens
     */
    jwtSecret: process.env.JWT_SECRET,

    /**
     * JWT token expiration time (e.g., '1d', '7d', '24h')
     */
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

    /**
     * Bootstrap code required for creating the first admin user
     */
    adminBootstrapCode: process.env.ADMIN_BOOTSTRAP_CODE,

    /**
     * Whether to allow multiple admin users (default: false)
     */
    allowMultipleAdmins: process.env.ALLOW_MULTIPLE_ADMINS === 'true',

    /**
     * Bcrypt salt rounds for password hashing (default: 10)
     */
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),

    /**
     * Cookie name for storing JWT token
     */
    cookieName: 'auth_token',

    /**
     * Cookie options
     */
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    },
};
