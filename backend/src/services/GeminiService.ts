import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TournamentInsights {
    summary: string;
    keyStats: string[];
    predictions: string[];
}

export class GeminiService {
    private apiKey = process.env.GEMINI_API_KEY || "";
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

    private async callGemini(prompt: string): Promise<string> {
        if (!this.apiKey) {
            return "AI capabilities are currently unavailable (Missing API Key).";
        }

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                throw new Error(`Gemini API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
        } catch (error) {
            console.error("Gemini API Call Failed:", error);
            return "Failed to connect to AI service.";
        }
    }

    async chat(message: string, context?: string): Promise<string> {
        const prompt = `
            Context: ${context || "You are an assistant for a sports tournament management system."}
            User: ${message}
            Assistant:
        `;
        return this.callGemini(prompt);
    }

    async analyzeMatch(matchId: string): Promise<string> {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                playerA: true,
                playerB: true,
                event: true
            }
        });

        if (!match) throw new Error("Match not found");

        const prompt = `
            Act as an excited sports commentator. 
            Analyze the upcoming match between ${match.playerA?.name || 'Player A'} and ${match.playerB?.name || 'Player B'} 
            in the ${match.event?.name || 'Tournament'} event.
            Write a short, 2-sentence hype prediction.
        `;
        
        return this.callGemini(prompt);
    }

    /**
     * Generates AI insights for a specific tournament.
     * In a real implementation, this would call the Google Gemini API.
     * For now, it generates structured mock data based on real DB stats.
     */
    async generateTournamentInsights(tournamentId: string): Promise<TournamentInsights> {
        // 1. Fetch Tournament Data
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                events: {
                    include: {
                        _count: { select: { registrations: true } }
                    }
                }
            }
        });

        if (!tournament) {
            throw new Error("Tournament not found");
        }

        // 2. Calculate Basic Stats
        const totalEvents = tournament.events.length;
        const totalPlayers = tournament.events.reduce((sum, event) => sum + event._count.registrations, 0);

        // 3. Generate "AI" Insights (Mocked for now)
        // TODO: Replace with actual Gemini API call
        // const prompt = `Analyze this tournament: ${JSON.stringify(tournament)}...`;
        // const response = await geminiClient.generateContent(prompt);

        const insights: TournamentInsights = {
            summary: `This tournament is shaping up to be highly competitive with ${totalPlayers} athletes competing across ${totalEvents} events. The participation level is ${totalPlayers > 50 ? 'exceptional' : 'growing'}, indicating strong community interest.`,
            keyStats: [
                `${totalPlayers} Total Participants`,
                `${totalEvents} Events Scheduled`,
                `High intensity expected in ${tournament.events[0]?.name || 'all categories'}`
            ],
            predictions: [
                "Expect close matches in the semi-finals based on player seeding.",
                "Weather conditions might favor defensive play styles (if outdoor).",
                "Projected to finish on schedule based on current fixture density."
            ]
        };

        return insights;
    }
}
