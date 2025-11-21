import { Request, Response } from 'express';
import prisma from '../lib/db';

export const createTournament = async (req: Request, res: Response) => {
  const { name, startDate, endDate, location, courts } = req.body;
  
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: 'Name, start date, and end date are required' });
  }

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        courts: courts ? {
          create: courts.map((courtName: string) => ({ name: courtName }))
        } : undefined
      },
      include: { courts: true, events: true }
    });
    
    res.status(201).json({ success: true, tournament });
  } catch (error: any) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Failed to create tournament', details: error.message });
  }
};

export const getAllTournaments = async (req: Request, res: Response) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        events: true,
        courts: true,
        _count: { select: { events: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, tournaments });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tournaments', details: error.message });
  }
};

export const getTournamentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        events: { include: { _count: { select: { registrations: true, matches: true } } } },
        courts: true
      }
    });
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    res.json({ success: true, tournament });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tournament', details: error.message });
  }
};
