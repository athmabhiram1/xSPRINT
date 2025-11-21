import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';

// Import Routes
import matchRoutes from './routes/match.routes';
import playerRoutes from './routes/player.routes';
import fixtureRoutes from './routes/fixture.routes';
import tournamentRoutes from './routes/tournament.routes';
import eventRoutes from './routes/event.routes';
import clubRoutes from './routes/club.routes';

export const app = express();

app.use(cors());
app.use(json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Routes Registration
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/fixtures', fixtureRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});