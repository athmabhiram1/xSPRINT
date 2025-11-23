import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

/**
 * Security Middleware Configuration
 * Helmet, CORS, Compression, Rate Limiting
 */

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001'];

export const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};

// Rate Limiting Configuration
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        success: false,
        error: 'Too many login attempts, please try again in 15 minutes.',
        retryAfter: 15,
    },
    skipSuccessfulRequests: true,
});

// Rate limiter for match code validation
export const matchCodeRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 attempts per 5 minutes
    message: {
        success: false,
        error: 'Too many code validation attempts, please try again in 5 minutes.',
        retryAfter: 5,
    },
});

// Rate limiter for result submission
export const resultSubmissionRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // 5 submissions per minute
    message: {
        success: false,
        error: 'Too many result submissions, please slow down.',
        retryAfter: 1,
    },
});

/**
 * Apply all security middleware to Express app
 */
export function applySecurityMiddleware(app: Express) {
    // Helmet - Security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
            crossOriginEmbedderPolicy: false,
        })
    );

    // CORS
    app.use(cors(corsOptions));

    // Compression
    app.use(compression());

    // Global rate limiting
    app.use(globalRateLimiter);

    // Trust proxy (for rate limiting behind reverse proxy)
    app.set('trust proxy', 1);
}
