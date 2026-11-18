import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import { authRouter } from './routes/auth.js';
import { garmentsRouter } from './routes/garments.js';
import { outfitsRouter } from './routes/outfits.js';
import { plannedRouter } from './routes/planned.js';

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
app.use('/api/garments', garmentsRouter);
app.use('/api/outfits', outfitsRouter);
app.use('/api/planned', plannedRouter);

// Manejo de errores: respuestas claras en vez de pantallas de error o textos técnicos.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'La imagen pesa más de 5 MB.' : 'No pudimos procesar la imagen.';
    return res.status(400).json({ error: message });
  }
  if (error instanceof Error && error.message.startsWith('La imagen debe ser')) {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(config.port, () => console.log(`API en http://localhost:${config.port}`));
