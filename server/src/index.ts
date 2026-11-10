import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { authRouter } from './routes/auth.js';

const app = express();
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'JUST' }));

// Verifica que la API llega a la base de datos.
app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

app.use('/api/auth', authRouter);

app.listen(config.port, () => console.log(`API en http://localhost:${config.port}`));
