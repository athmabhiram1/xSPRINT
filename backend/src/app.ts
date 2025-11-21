import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';

// Import Routes (Placeholders for now)
// import authRoutes from './routes/auth.routes';
import fixtureRoutes from './routes/fixture.routes';
import matchRoutes from './routes/match.routes';
import playerRoutes from './routes/player.routes';

export const app = express();

app.use(cors());
app.use(json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Routes Registration
// app.use('/api/auth', authRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});