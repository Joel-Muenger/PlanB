import cors from 'cors';
import express from 'express';
import {
  DISRUPTION_TYPES,
  isDisruptionType,
  type Alternative,
  type AlternativesResponse,
  type NearbyStopsResponse,
} from '@plan-b/shared';
import alternatives from '../data/alternatives.json' with { type: 'json' };
import { findNearbyStops } from './stops.js';

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

app.get('/api/stops/nearby', async (req, res) => {
  const parse = (value: unknown) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  const lat = parse(req.query.lat);
  const lon = parse(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    res.status(400).json({ error: 'Parameter lat und lon müssen gültige Koordinaten sein.' });
    return;
  }
  try {
    const body: NearbyStopsResponse = { stops: await findNearbyStops(lat, lon) };
    res.json(body);
  } catch (error) {
    console.error('Haltestellensuche fehlgeschlagen:', error);
    res.status(502).json({ error: 'Haltestellensuche ist momentan nicht verfügbar.' });
  }
});

app.listen(port, () => console.log(`Plan B API is running on http://localhost:${port}`));
