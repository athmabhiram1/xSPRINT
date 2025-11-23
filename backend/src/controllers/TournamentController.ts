import { Request, Response } from 'express';
import prisma from '../lib/db';

// Type definitions for request bodies
interface CreateTournamentBody {
  name: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  location?: string;
  courts?: Array<{ name: string } | string>; // Can be an array of strings or objects with a name property
}

interface GetTournamentsQuery {
  includeEvents?: string; // 'true' or 'false' as string
  includeCourts?: string; // 'true' or 'false' as string
}

/**
 * Creates a new tournament with optional courts.
 */
export const createTournament = async (req: Request<{}, {}, CreateTournamentBody>, res: Response) => {
  const { name, startDate, endDate, location, courts } = req.body;

  // Validation
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ 
      success: false,
      error: 'Name, start date, and end date are required' 
    });
  }

  let startDateObj: Date, endDateObj: Date;
  try {
    startDateObj = new Date(startDate);
    endDateObj = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date format. Use ISO string (e.g., 2023-10-27T10:00:00.000Z).' 
      });
    }

    // Check if end date is after start date
    if (endDateObj <= startDateObj) {
      return res.status(400).json({ 
        success: false,
        error: 'End date must be after start date.' 
      });
    }
  } catch (e) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid date format. Use ISO string (e.g., 2023-10-27T10:00:00.000Z).' 
    });
  }

  // Validate courts array if provided
  if (courts && !Array.isArray(courts)) {
    return res.status(400).json({ 
      success: false,
      error: 'Courts must be an array.' 
    });
  }

  try {
    const createData: any = {
      name: name.trim(),
      startDate: startDateObj,
      endDate: endDateObj
    };

    // Add location if provided
    if (location) {
      createData.location = location.trim();
    }

    // Map courts correctly: { name: "Court 1" } → { create: [{ name: "Court 1" }] }
    if (courts && courts.length > 0) {
      createData.courts = {
        create: courts.map((c: any) => ({
          name: typeof c === 'string' ? c : c.name
        }))
      };
    }

    const tournament = await prisma.tournament.create({
      data: createData,
      include: {
        courts: true,
        events: {
          include: {
            _count: { select: { registrations: true, matches: true } }
          }
        }
      }
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Tournament created successfully',
      tournament 
    });
  } catch (error: any) {
    console.error('Error creating tournament:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') { 
      return res.status(409).json({ 
        success: false,
        error: `A tournament with the name "${name}" already exists.` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create tournament due to an internal server error.', 
      details: error.message 
    });
  }
};

/**
 * Retrieves all tournaments with optional includes.
 */
export const getAllTournaments = async (req: Request<{}, {}, {}, GetTournamentsQuery>, res: Response) => {
  const { includeEvents, includeCourts } = req.query;

  try {
    // Determine what to include based on query parameters
    const includeEventsBool = includeEvents === 'true';
    const includeCourtsBool = includeCourts === 'true';

    const tournaments = await prisma.tournament.findMany({
      include: {
        // Conditionally include events and their counts
        events: includeEventsBool ? { 
          include: { 
            _count: { select: { registrations: true, matches: true } } 
          } 
        } : false,
        // Conditionally include courts
        courts: includeCourtsBool,
        // Always include a count of events
        _count: { select: { events: true } }
      },
      orderBy: { startDate: 'desc' } // Order by start date, newest first
    });

    res.json({ 
      success: true, 
      count: tournaments.length,
      includeEvents: includeEventsBool,
      includeCourts: includeCourtsBool,
      tournaments 
    });
  } catch (error: any) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tournaments due to an internal server error.', 
      details: error.message 
    });
  }
};

/**
 * Retrieves a specific tournament by its ID.
 */
export const getTournamentById = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ 
      success: false,
      error: 'Tournament ID is required' 
    });
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        events: { 
          include: { 
            _count: { select: { registrations: true, matches: true } },
            // Include basic info about matches for status checks (e.g., for fixture generation checks)
            // matches: { select: { status: true } } // Uncomment if needed for frontend details
          } 
        },
        courts: true // Include courts for this specific tournament
      }
    });
    
    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        error: 'Tournament not found' 
      });
    }
    
    res.json({ 
      success: true, 
      tournament 
    });
  } catch (error: any) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tournament due to an internal server error.', 
      details: error.message 
    });
  }
};

// Optional: Add a function to update tournament details (excluding dates if matches are scheduled)
// export const updateTournament = async (req: Request, res: Response) => { ... }

// Optional: Add a function to delete a tournament (with checks for associated data)
// export const deleteTournament = async (req: Request, res: Response) => { ... }