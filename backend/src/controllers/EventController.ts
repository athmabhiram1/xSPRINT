import { Request, Response } from 'express';
import prisma from '../lib/db';

export const createEvent = async (req: Request, res: Response) => {
  const { tournamentId, name, sport, type, gender, category } = req.body;
  
  if (!tournamentId || !name) {
    return res.status(400).json({ error: 'Tournament ID and name are required' });
  }

  try {
    const event = await prisma.event.create({
      data: {
        tournamentId,
        name,
        sport: sport || 'Badminton',
        type: type || 'KNOCKOUT',
        gender,
        category
      }
    });
    
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
};

export const getEventsByTournament = async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  
  try {
    const events = await prisma.event.findMany({
      where: { tournamentId },
      include: {
        _count: { select: { registrations: true, matches: true } }
      }
    });
    res.json({ success: true, events });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
};

export const registerPlayerToEvent = async (req: Request, res: Response) => {
  const { eventId, playerId, seed } = req.body;
  
  if (!eventId || !playerId) {
    return res.status(400).json({ error: 'Event ID and Player ID are required' });
  }

  try {
    const registration = await prisma.registration.create({
      data: { eventId, playerId, seed },
      include: { player: true, event: true }
    });
    
    res.status(201).json({ success: true, registration });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Player already registered for this event' });
    }
    res.status(500).json({ error: 'Failed to register player', details: error.message });
  }
};

export const getEventRegistrations = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  
  try {
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: { player: { include: { club: true } } },
      orderBy: { seed: 'asc' }
    });
    res.json({ success: true, registrations });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch registrations', details: error.message });
  }
};
