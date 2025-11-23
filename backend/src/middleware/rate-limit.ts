/**
 * Rate Limiting Middleware
 * 
 * Express middleware for rate limiting match code verification attempts.
 */

import { Request, Response, NextFunction } from 'express';
import { matchCodeRateLimiter } from '../lib/rate-limiter';

/**
 * Rate limit middleware for match code validation
 * 
 * Limits failed attempts to prevent brute-force attacks on match codes.
 * Uses IP + matchId as the rate limit key.
 */
export const rateLimitMatchCode = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { matchId } = req.body;

    if (!matchId) {
        // If no matchId, let the request through (will fail validation anyway)
        return next();
    }

    // Create rate limit key from IP and matchId
    const key = `${req.ip}_${matchId}`;

    // Check if rate limit exceeded
    if (matchCodeRateLimiter.checkLimit(key)) {
        const timeUntilReset = matchCodeRateLimiter.getTimeUntilReset(key);
        const minutesUntilReset = Math.ceil(timeUntilReset / 1000 / 60);

        console.warn(
            `[SECURITY] Rate limit exceeded for IP ${req.ip} on match ${matchId}`
        );

        res.status(429).json({
            error: 'Too many attempts',
            message: `Too many failed validation attempts. Please try again in ${minutesUntilReset} minutes.`,
            retryAfter: minutesUntilReset,
            blockedUntil: new Date(Date.now() + timeUntilReset).toISOString(),
        });
        return;
    }

    // Allow request to proceed
    next();
};

/**
 * Record a failed match code validation attempt
 * Call this from the controller after a failed validation
 */
export const recordFailedAttempt = (req: Request, matchId: string): void => {
    const key = `${req.ip}_${matchId}`;
    matchCodeRateLimiter.recordFailure(key);

    const attemptCount = matchCodeRateLimiter.getAttemptCount(key);
    console.warn(
        `[SECURITY] Failed match code attempt #${attemptCount} from IP ${req.ip} for match ${matchId}`
    );
};

/**
 * Reset rate limit for a key after successful validation
 * Call this from the controller after a successful validation
 */
export const resetRateLimit = (req: Request, matchId: string): void => {
    const key = `${req.ip}_${matchId}`;
    matchCodeRateLimiter.reset(key);
};
