import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const outfitsRouter = Router();

// Todas las rutas de looks requieren sesión.
outfitsRouter.use(requireAuth);

const occasions = ['UNIVERSITY', 'WORK', 'OUTING', 'EVENT', 'SPORT', 'OTHER'] as const;

// Posición de cada prenda en el lienzo: x e y son el centro, en % del lienzo (0 a 100).
// scale 1 = la prenda ocupa el 40 % del ancho del lienzo.
const itemSchema = z.object({
  garmentId: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  scale: z.number().min(0.3).max(3),
  zIndex: z.number().int().min(0).max(100),
});

const outfitSchema = z.object({
  name: z.string().trim().min(1, 'Ponele un nombre al look').max(80, 'El nombre es muy largo'),
  occasion: z.enum(occasions).default('OTHER'),
  isFavorite: z.boolean().default(false),
  items: z.array(itemSchema).min(1, 'Agregá al menos una prenda').max(20, 'Un look puede tener hasta 20 prendas'),
});

const patchSchema = z.object({
  name: z.string().trim().min(1, 'Ponele un nombre al look').max(80).optional(),
  occasion: z.enum(occasions).optional(),
  isFavorite: z.boolean().optional(),
});

const filtersSchema = z.object({
  favorite: z.enum(['true']).optional(),
  occasion: z.enum(occasions).optional(),
});

const include = {
  items: { include: { garment: true }, orderBy: { zIndex: 'asc' as const } },
};

// Verifica que las prendas existan, no se repitan y sean del usuario.
async function checkGarments(userId: string, garmentIds: string[]): Promise<string | null> {
  if (new Set(garmentIds).size !== garmentIds.length) {
    return 'No se puede repetir una prenda en el mismo look';
  }
  const owned = await prisma.garment.count({ where: { id: { in: garmentIds }, userId } });
  return owned === garmentIds.length ? null : 'Alguna de las prendas ya no existe';
}

// GET /api/outfits?favorite=true&occasion=WORK
outfitsRouter.get('/', async (req, res) => {
  const parsed = filtersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Filtros inválidos' });
  }
  const { favorite, occasion } = parsed.data;

  const outfits = await prisma.outfit.findMany({
    where: {
      userId: res.locals.userId,
      ...(favorite && { isFavorite: true }),
      ...(occasion && { occasion }),
    },
    include,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ outfits });
});

// GET /api/outfits/:id
outfitsRouter.get('/:id', async (req, res) => {
  const outfit = await prisma.outfit.findFirst({
    where: { id: req.params.id, userId: res.locals.userId },
    include,
  });
  if (!outfit) {
    return res.status(404).json({ error: 'No encontramos ese look' });
  }
  res.json({ outfit });
});

// POST /api/outfits
outfitsRouter.post('/', async (req, res) => {
  const parsed = outfitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { items, ...fields } = parsed.data;

  const problem = await checkGarments(res.locals.userId, items.map((i) => i.garmentId));
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  const outfit = await prisma.outfit.create({
    data: { ...fields, userId: res.locals.userId, items: { create: items } },
    include,
  });
  res.status(201).json({ outfit });
});

// PUT /api/outfits/:id (reemplaza los datos y todas las prendas del look)
outfitsRouter.put('/:id', async (req, res) => {
  const parsed = outfitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { items, ...fields } = parsed.data;

  const existing = await prisma.outfit.findFirst({ where: { id: req.params.id, userId: res.locals.userId } });
  if (!existing) {
    return res.status(404).json({ error: 'No encontramos ese look' });
  }

  const problem = await checkGarments(res.locals.userId, items.map((i) => i.garmentId));
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  const outfit = await prisma.outfit.update({
    where: { id: existing.id },
    data: { ...fields, items: { deleteMany: {}, create: items } },
    include,
  });
  res.json({ outfit });
});

// PATCH /api/outfits/:id (cambios parciales, por ejemplo marcar como favorito)
outfitsRouter.patch('/:id', async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.outfit.findFirst({ where: { id: req.params.id, userId: res.locals.userId } });
  if (!existing) {
    return res.status(404).json({ error: 'No encontramos ese look' });
  }

  const outfit = await prisma.outfit.update({
    where: { id: existing.id },
    data: parsed.data,
    include,
  });
  res.json({ outfit });
});

// DELETE /api/outfits/:id
outfitsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.outfit.findFirst({ where: { id: req.params.id, userId: res.locals.userId } });
  if (!existing) {
    return res.status(404).json({ error: 'No encontramos ese look' });
  }
  await prisma.outfit.delete({ where: { id: existing.id } });
  res.status(204).end();
});
