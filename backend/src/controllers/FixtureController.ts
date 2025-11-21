import { Request, Response } from 'express';
import prisma from '../lib/db';
import { FixtureEngine } from '../services/FixtureEngine';

const fixtureEngine = new FixtureEngine();

export const generateFixture = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { type } = req.body;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const fixtureType = type || event.type || 'KNOCKOUT';
    const result = await fixtureEngine.generateFixtures(eventId, fixtureType as 'KNOCKOUT' | 'ROUND_ROBIN');

    await prisma.event.update({
      where: { id: eventId },
      data: { rounds: result.totalRounds, type: fixtureType }
    });

    res.status(201).json({
      success: true,
      message: 'Fixture generated successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error generating fixture:', error);
    res.status(500).json({ error: 'Failed to generate fixture', details: error.message });
  }
};

export const getFixture = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const matches = await prisma.match.findMany({
      where: { eventId },
      include: {
        playerA: { include: { club: true } },
        playerB: { include: { club: true } },
        winner: true,
        schedule: { include: { court: true } }
      },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
    });

    if (matches.length === 0) {
      return res.status(404).json({ error: 'No fixture found for this event' });
    }

    const groupedByRound: Record<number, any[]> = {};
    matches.forEach((match) => {
      if (!groupedByRound[match.round]) {
        groupedByRound[match.round] = [];
      }
      groupedByRound[match.round].push(match);
    });

    res.json({
      success: true,
      data: {
        eventId,
        totalMatches: matches.length,
        rounds: groupedByRound,
        flatMatches: matches
      }
    });
  } catch (error: any) {
    console.error('Error fetching fixture:', error);
    res.status(500).json({ error: 'Failed to fetch fixture', details: error.message });
  }
};
