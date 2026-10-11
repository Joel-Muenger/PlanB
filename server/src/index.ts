import cors from 'cors';
import express from 'express';
import {
  DISRUPTION_TYPES,
  isDisruptionType,
  type Alternative,
  type AlternativesResponse,
} from '@plan-b/shared';
import alternatives from '../data/alternatives.json' with { type: 'json' };

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/alternatives', (req, res) => {
  const requested = req.query.disruption;
  const disruption = isDisruptionType(requested) ? requested : DISRUPTION_TYPES[0];
  const body: AlternativesResponse = { disruption, alternatives: alternatives as Alternative[] };
  res.json(body);
});

app.listen(port, () => console.log(`Plan B API is running on http://localhost:${port}`));
