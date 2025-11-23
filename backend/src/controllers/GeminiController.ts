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

export const chatWithAI = async (req: Request, res: Response) => {
    const { message, context } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }

    try {
        const response = await geminiService.chat(message, context);
        res.json({
            success: true,
            data: response
        });
    } catch (error: any) {
        console.error('Error in AI chat:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat request',
            details: error.message
        });
    }
};

export const analyzeMatch = async (req: Request, res: Response) => {
    const { matchId } = req.body;

    if (!matchId) {
        return res.status(400).json({ success: false, error: 'Match ID is required' });
    }

    try {
        const analysis = await geminiService.analyzeMatch(matchId);
        res.json({
            success: true,
            data: analysis
        });
    } catch (error: any) {
        console.error('Error analyzing match:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze match',
            details: error.message
        });
    }
};
