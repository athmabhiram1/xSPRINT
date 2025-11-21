import { Request, Response } from 'express';
import prisma from '../lib/db';

export const createClub = async (req: Request, res: Response) => {
  const { name, location } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Club name is required' });
  }

  try {
    const club = await prisma.club.create({
      data: { name, location }
    });
    res.status(201).json({ success: true, club });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Club name already exists' });
    }
    res.status(500).json({ error: 'Failed to create club', details: error.message });
  }
};

export const getAllClubs = async (req: Request, res: Response) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        _count: { select: { players: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, clubs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch clubs', details: error.message });
  }
};
