import { z } from 'zod';

/**
 * Validation Schemas using Zod
 * Centralized validation for all API endpoints
 */

// Player Schemas
export const createPlayerSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    clubId: z.string().cuid('Invalid club ID').optional(),
});

export const registerPlayerSchema = z.object({
    fullName: z.string().min(2).max(100),
    clubId: z.string().cuid().optional(),
    eventId: z.string().cuid('Invalid event ID'),
});

// Club Schemas
export const createClubSchema = z.object({
    name: z.string().min(2, 'Club name must be at least 2 characters').max(100),
    location: z.string().optional(),
    contactEmail: z.string().email().optional(),
});

// Tournament Schemas
export const createTournamentSchema = z.object({
    name: z.string().min(3, 'Tournament name must be at least 3 characters').max(200),
    location: z.string().min(2).max(200),
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
    courts: z.array(z.string()).min(1, 'At least one court is required'),
});

// Event Schemas
export const createEventSchema = z.object({
    tournamentId: z.string().cuid('Invalid tournament ID'),
    name: z.string().min(3).max(200),
    sport: z.string().min(2).max(50),
    type: z.enum(['KNOCKOUT', 'ROUND_ROBIN']),
    category: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
    format: z.enum(['KNOCKOUT', 'ROUND_ROBIN']),
    maxPlayers: z.number().int().positive().optional(),
});

// Event Config Schema
export const eventConfigSchema = z.object({
    eventId: z.string().cuid(),
    restTimeMinutes: z.number().int().min(0).max(120).default(30),
    matchDurationMinutes: z.number().int().min(15).max(180).default(45),
    finalsDuration: z.number().int().min(30).max(240).default(60),
    changeoverMinutes: z.number().int().min(0).max(30).default(5),
    maxParallelMatches: z.number().int().min(1).max(20).default(4),
});

// Match Code Schemas
export const validateMatchCodeSchema = z.object({
    matchId: z.string().cuid('Invalid match ID'),
    matchCode: z.string().length(8, 'Match code must be 8 characters'),
});

export const generateMatchCodeSchema = z.object({
    matchId: z.string().cuid('Invalid match ID'),
    assignedUmpire: z.string().email('Invalid umpire email'),
});

// Match Result Schemas
export const submitResultSchema = z.object({
    matchId: z.string().cuid('Invalid match ID'),
    matchCode: z.string().length(8, 'Match code must be 8 characters'),
    winnerId: z.string().cuid('Invalid winner ID').optional(),
    score: z.union([
        z.string(),
        z.array(
            z.object({
                playerA: z.union([z.string(), z.number()]),
                playerB: z.union([z.string(), z.number()]),
            })
        ),
    ]).optional(),
});

// Schedule Schemas
export const generateScheduleSchema = z.object({
    tournamentId: z.string().cuid('Invalid tournament ID'),
    eventId: z.string().cuid('Invalid event ID'),
    startTime: z.string().datetime().optional(),
    matchDuration: z.number().int().min(15).max(180).optional(),
});

// Fixture Schemas
export const generateFixturesSchema = z.object({
    eventId: z.string().cuid('Invalid event ID'),
    seedingStrategy: z.enum(['RANDOM', 'RANKED', 'MANUAL']).optional(),
});

// Auth Schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerAdminSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'ORGANIZER', 'UMPIRE', 'VIEWER']).default('ADMIN'),
});

// Withdrawal Schema
export const withdrawMatchSchema = z.object({
    matchId: z.string().cuid('Invalid match ID'),
    reason: z.string().min(5).max(500).optional(),
    withdrawingPlayerId: z.string().cuid('Invalid player ID'),
});

// Type exports for use in controllers
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type EventConfigInput = z.infer<typeof eventConfigSchema>;
export type ValidateMatchCodeInput = z.infer<typeof validateMatchCodeSchema>;
export type SubmitResultInput = z.infer<typeof submitResultSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
