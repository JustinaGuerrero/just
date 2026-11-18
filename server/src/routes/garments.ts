import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { deleteImage, uploadImage } from '../lib/cloudinary.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const garmentsRouter = Router();

// Todas las rutas de prendas requieren sesión.
garmentsRouter.use(requireAuth);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('La imagen debe ser JPG, PNG o WebP.'));
    }
  },
});

const categories = ['TEE', 'SHIRT', 'PANTS', 'SKIRT', 'DRESS', 'OUTERWEAR', 'SHOES', 'ACCESSORY'] as const;
const seasons = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] as const;
const styles = ['CASUAL', 'FORMAL', 'SPORT', 'ELEGANT', 'STREET'] as const;

// En formularios multipart las listas llegan como texto "a,b,c" o como campos repetidos.
function toList(value: unknown): unknown {
  if (value === undefined || value === '') return [];
  if (Array.isArray(value)) return value.flatMap((v) => String(v).split(','));
  return String(value).split(',');
}

const list = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : v), z.array(item).max(12));

const colorList = z.preprocess(
  (v) => (Array.isArray(v) ? v.map((s) => String(s).trim().toLowerCase()).filter(Boolean) : v),
  z.array(z.string().max(30)).max(6),
);

const garmentFields = z.object({
  name: z.string().trim().min(1, 'Ingresá un nombre para la prenda').max(80, 'El nombre es muy largo'),
  category: z.enum(categories, { message: 'Elegí una categoría válida' }),
  colors: colorList,
  styles: list(z.enum(styles)),
  seasons: list(z.enum(seasons)),
  brand: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => v || null),
});

const createSchema = garmentFields;
const updateSchema = garmentFields.partial();

const filtersSchema = z.object({
  category: z.enum(categories).optional(),
  season: z.enum(seasons).optional(),
  style: z.enum(styles).optional(),
  color: z.string().trim().toLowerCase().max(30).optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(['recent', 'name']).default('recent'),
});

// GET /api/garments?category=TEE&season=SPRING&color=beige&q=lino&sort=recent
garmentsRouter.get('/', async (req, res) => {
  const parsed = filtersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Filtros inválidos' });
  }
  const { category, season, style, color, q, sort } = parsed.data;

  const garments = await prisma.garment.findMany({
    where: {
      userId: res.locals.userId,
      ...(category && { category }),
      ...(season && { seasons: { has: season } }),
      ...(style && { styles: { has: style } }),
      ...(color && { colors: { has: color } }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { colors: { has: q.toLowerCase() } },
        ],
      }),
    },
    orderBy: sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' },
  });

  res.json({ garments });
});

// Cantidad de prendas por categoría (para los chips con contador).
garmentsRouter.get('/counts', async (_req, res) => {
  const rows = await prisma.garment.groupBy({
    by: ['category'],
    where: { userId: res.locals.userId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.category] = row._count._all;
  res.json({ counts, total: rows.reduce((sum, r) => sum + r._count._all, 0) });
});

// POST /api/garments (multipart/form-data: image + campos)
garmentsRouter.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Subí una foto de la prenda' });
  }

  const parsed = createSchema.safeParse({
    ...req.body,
    colors: toList(req.body.colors),
    styles: toList(req.body.styles),
    seasons: toList(req.body.seasons),
  });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const image = await uploadImage(req.file.buffer, res.locals.userId);

  try {
    const garment = await prisma.garment.create({
      data: {
        ...parsed.data,
        userId: res.locals.userId,
        imageUrl: image.url,
        imagePublicId: image.publicId,
      },
    });
    res.status(201).json({ garment });
  } catch (error) {
    // Si falla la base, no dejamos una imagen huérfana en Cloudinary.
    await deleteImage(image.publicId).catch(() => undefined);
    throw error;
  }
});

// PATCH /api/garments/:id (JSON, solo los campos a cambiar)
garmentsRouter.patch('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await prisma.garment.findFirst({
    where: { id: req.params.id, userId: res.locals.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: 'No encontramos esa prenda' });
  }

  const garment = await prisma.garment.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  res.json({ garment });
});

// DELETE /api/garments/:id
garmentsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.garment.findFirst({
    where: { id: req.params.id, userId: res.locals.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: 'No encontramos esa prenda' });
  }

  await prisma.garment.delete({ where: { id: existing.id } });
  if (existing.imagePublicId) {
    await deleteImage(existing.imagePublicId).catch((error) =>
      console.error('No se pudo borrar la imagen de Cloudinary:', error),
    );
  }
  res.status(204).end();
});
