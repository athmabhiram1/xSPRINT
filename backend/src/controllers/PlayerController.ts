import { Request, Response } from 'express';
import prisma from '../lib/db';

// Create a new player with unique ID and details
export const createPlayer = async (req: Request, res: Response) => {
  const { name, email, gender, weight, category, description, clubId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    const player = await prisma.player.create({
      data: {
        name,
        email,
        gender,
        weight,
        category,
        description,
        clubId,
      },
    });
    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      player,
    });
  } catch (error: any) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player', details: error.message });
  }
};

// Get all players
export const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        club: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json({ success: true, players });
  } catch (error: any) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players', details: error.message });
  }
};

// Get a single player by ID
export const getPlayerById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        club: true,
        registrations: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ success: true, player });
  } catch (error: any) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player', details: error.message });
  }
};

// Update player details
export const updatePlayer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, gender, weight, category, description, clubId } = req.body;

  try {
    const player = await prisma.player.update({
      where: { id },
      data: {
        name,
        email,
        gender,
        weight,
        category,
        description,
        clubId,
      },
    });

    res.json({
      success: true,
      message: 'Player updated successfully',
      player,
    });
  } catch (error: any) {
    console.error('Error updating player:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(500).json({ error: 'Failed to update player', details: error.message });
  }
};

// Delete a player
export const deletePlayer = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.player.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Player deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting player:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(500).json({ error: 'Failed to delete player', details: error.message });
  }
};
