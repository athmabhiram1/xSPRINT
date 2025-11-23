import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok } from '../utils/responseFormatter';
import { analyticsService } from '../services/AnalyticsService';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/events/:eventId/fixture-analysis
 * Get fixture fairness analysis
 * Access: ADMIN, ORGANIZER
 */
router.get(
    '/:eventId/fixture-analysis',
    requireAuth,
    requireRole('ADMIN', 'ORGANIZER'),
    asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const analysis = await analyticsService.getFixtureAnalysis(eventId);
        res.json(ok(analysis));
    })
);

/**
 * GET /api/events/:eventId/schedule-quality
 * Get schedule quality metrics
 * Access: ADMIN, ORGANIZER
 */
router.get(
    '/:eventId/schedule-quality',
    requireAuth,
    requireRole('ADMIN', 'ORGANIZER'),
    asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const quality = await analyticsService.getScheduleQuality(eventId);
        res.json(ok(quality));
    })
);

export default router;
