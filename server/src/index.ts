import cors from 'cors';
import express from 'express';
import alternatives from '../data/alternatives.json' with { type: 'json' };
import type { Alternative, DisruptionType } from './types.js';

const app = express();
const port = process.env.PORT || 3001;
const disruptions: DisruptionType[] = ['Zug fällt aus', 'Tram verspätet sich', 'Streckensperrung'];

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/alternatives', (req, res) => {
  const requested = req.query.disruption;
  const disruption = disruptions.includes(requested as DisruptionType)
    ? requested as DisruptionType
    : disruptions[0];
  res.json({ disruption, alternatives: alternatives as Alternative[] });
});

app.listen(port, () => console.log(`Plan B API is running on http://localhost:${port}`));
