import { Request, Response } from 'express';
import { FixtureEngine } from '../services/FixtureEngineEnhanced';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok, fail } from '../utils/responseFormatter';
import { validateParams, validateBody, fixtureGenerationSchema } from '../utils/validation';
import { z } from 'zod';
import { invalidateCache } from '../utils/cache';
import { logInfo, logError } from '../utils/logger';

const fixtureEngine = new FixtureEngine();

const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
});

const fixturePreviewSchema = z.object({
  format: z.enum(['knockout', 'roundrobin', 'swiss', 'double_elimination', 'groups_then_playoff']),
  options: z.object({
    swissRounds: z.number().optional(),
    groups: z.number().optional(),
    seedingStrategy: z.enum(['registration_order', 'elo_rating', 'historical_performance', 'random', 'manual']).optional(),
    randomizeUnseeded: z.boolean().optional(),
  }).optional(),
});

const rollbackSchema = z.object({
  snapshotId: z.string().optional(),
});

// Generate fixtures (existing endpoint, now with enhanced engine)
export const generateFixtures = [
  validateParams(eventIdParamSchema),
  validateBody(fixtureGenerationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { type, format } = req.body;

    const fixtureFormat = (type || format || 'knockout').toLowerCase() as any;

    try {
      const result = await fixtureEngine.generateFixtures(eventId, fixtureFormat);

      invalidateCache(`event:${eventId}:*`);
      invalidateCache(`fixtures:*`);
      logInfo('Fixtures generated', { eventId, format: fixtureFormat, matchCount: result.matches.length });

      return res.json(ok(result));
    } catch (error: any) {
      logError(error, { eventId, format: fixtureFormat });
      if (error.message.includes('not found')) {
        return res.status(404).json(fail(error.message));
      }
      if (error.message.includes('already scheduled') || error.message.includes('required')) {
        return res.status(400).json(fail(error.message));
      }
      throw error;
    }
  })
];

// NEW: Preview fixtures without committing
export const previewFixtures = [
  validateParams(eventIdParamSchema),
  validateBody(fixturePreviewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { format, options } = req.body;

    try {
      const preview = await fixtureEngine.previewFixtures(eventId, format, {
        ...options,
        dryRun: true,
      });

      logInfo('Fixtures previewed', {
        eventId,
        format,
        matchCount: preview.matches.length,
        fairnessScore: preview.fairnessScore
      });

      return res.json(ok({
        ...preview,
        message: 'Preview generated successfully. Use POST /fixtures/generate to commit.'
      }));
    } catch (error: any) {
      logError(error, { eventId, format });
      if (error.message.includes('not found')) {
        return res.status(404).json(fail(error.message));
      }
      if (error.message.includes('validation failed')) {
        return res.status(400).json(fail(error.message));
      }
      throw error;
    }
  })
];

// NEW: Get fairness score for existing fixtures
export const getFairnessScore = [
  validateParams(eventIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;

    try {
      const { calculateExistingFixtureFairness } = await import('../services/FixtureEngineEnhanced');
      const fairnessScore = await calculateExistingFixtureFairness(eventId);

      logInfo('Fairness score calculated', { eventId, fairnessScore });

      return res.json(ok({
        eventId,
        fairnessScore,
        rating: fairnessScore >= 80 ? 'Excellent' :
          fairnessScore >= 70 ? 'Good' :
            fairnessScore >= 60 ? 'Fair' : 'Needs Improvement',
        recommendations: fairnessScore < 70 ? [
          'Consider regenerating fixtures with higher optimization iterations',
          'Review same-club matchups in early rounds',
          'Check if seeding strategy can be improved'
        ] : []
      }));
    } catch (error: any) {
      logError(error, { eventId });
      if (error.message.includes('not found')) {
        return res.status(404).json(fail(error.message));
      }
      throw error;
    }
  })
];

// NEW: Rollback fixtures to previous state
export const rollbackFixtures = [
  validateParams(eventIdParamSchema),
  validateBody(rollbackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { snapshotId } = req.body;

    try {
      const success = await fixtureEngine.rollback(eventId, snapshotId);

      if (success) {
        invalidateCache(`event:${eventId}:*`);
        invalidateCache(`fixtures:*`);
        logInfo('Fixtures rolled back', { eventId, snapshotId });

        return res.json(ok({
          success: true,
          message: 'Fixtures successfully rolled back to previous state',
          eventId,
          snapshotId
        }));
      } else {
        return res.status(400).json(fail('Rollback failed'));
      }
    } catch (error: any) {
      logError(error, { eventId, snapshotId });
      if (error.message.includes('not found') || error.message.includes('No rollback snapshot')) {
        return res.status(404).json(fail(error.message));
      }
      if (error.message.includes('disabled')) {
        return res.status(400).json(fail('Rollback functionality is disabled'));
      }
      throw error;
    }
  })
];

// Existing endpoints (kept for backward compatibility)
export const generateFixture = generateFixtures;
export const getFixture = async (req: Request, res: Response) => {
  // Implementation for getting fixtures
  res.status(501).json(fail('Not implemented yet'));
};
export const scheduleFixture = async (req: Request, res: Response) => {
  // Implementation for scheduling
  res.status(501).json(fail('Not implemented yet'));
};
