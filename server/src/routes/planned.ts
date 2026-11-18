import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const plannedRouter = Router();

// Todas las rutas del calendario requieren sesión.
plannedRouter.use(requireAuth);

// Las fechas viajan como "YYYY-MM-DD" y se guardan como fecha sin hora (UTC), para evitar corrimientos por zona horaria.
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), 'Fecha inválida');

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

const rangeSchema = z.object({ from: dateString, to: dateString });
const bodySchema = z.object({ outfitId: z.string().min(1, 'Elegí un look') });

const include = {
  outfit: {
    include: {
      items: { include: { garment: true }, orderBy: { zIndex: 'asc' as const } },
    },
  },
};

function serialize<T extends { date: Date }>(planned: T) {
  return { ...planned, date: planned.date.toISOString().slice(0, 10) };
}

// GET /api/planned?from=2026-11-16&to=2026-11-22
plannedRouter.get('/', async (req, res) => {
  const parsed = rangeSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Indicá el rango de fechas (from y to)' });
  }
  const { from, to } = parsed.data;

  const planned = await prisma.plannedOutfit.findMany({
    where: { userId: res.locals.userId, date: { gte: toDate(from), lte: toDate(to) } },
    include,
    orderBy: { date: 'asc' },
  });
  res.json({ planned: planned.map(serialize) });
});

// PUT /api/planned/2026-11-18  { outfitId }  (un look por día: crea o reemplaza)
plannedRouter.put('/:date', async (req, res) => {
  const date = dateString.safeParse(req.params.date);
  const body = bodySchema.safeParse(req.body);
  if (!date.success || !body.success) {
    return res.status(400).json({ error: body.success ? 'Fecha inválida' : body.error.issues[0].message });
  }

  const outfit = await prisma.outfit.findFirst({
    where: { id: body.data.outfitId, userId: res.locals.userId },
  });
  if (!outfit) {
    return res.status(404).json({ error: 'No encontramos ese look' });
  }

  const planned = await prisma.plannedOutfit.upsert({
    where: { userId_date: { userId: res.locals.userId, date: toDate(date.data) } },
    create: {
      userId: res.locals.userId,
      date: toDate(date.data),
      outfitId: outfit.id,
      occasion: outfit.occasion,
    },
    update: { outfitId: outfit.id, occasion: outfit.occasion },
    include,
  });
  res.json({ planned: serialize(planned) });
});

// DELETE /api/planned/2026-11-18
plannedRouter.delete('/:date', async (req, res) => {
  const date = dateString.safeParse(req.params.date);
  if (!date.success) {
    return res.status(400).json({ error: 'Fecha inválida' });
  }

  await prisma.plannedOutfit.deleteMany({
    where: { userId: res.locals.userId, date: toDate(date.data) },
  });
  res.status(204).end();
});
