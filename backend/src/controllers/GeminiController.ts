import { Request, Response } from 'express';
import { GeminiService } from '../services/GeminiService';

const geminiService = new GeminiService();

export const getTournamentInsights = async (req: Request, res: Response) => {
    const { tournamentId } = req.params;

    if (!tournamentId) {
        return res.status(400).json({ success: false, error: 'Tournament ID is required' });
    }

    try {
        const insights = await geminiService.generateTournamentInsights(tournamentId);
        res.json({
            success: true,
            data: insights
        });
    } catch (error: any) {
        console.error('Error generating AI insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate insights',
            details: error.message
        });
    }
};
