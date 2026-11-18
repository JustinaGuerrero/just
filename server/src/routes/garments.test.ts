import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionCookie } from '../test/session.js';

const db = vi.hoisted(() => ({
  garment: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), groupBy: vi.fn() },
}));
const images = vi.hoisted(() => ({ uploadImage: vi.fn(), deleteImage: vi.fn() }));
vi.mock('../lib/prisma.js', () => ({ prisma: db }));
vi.mock('../lib/cloudinary.js', () => images);

const { app } = await import('../app.js');

const png = Buffer.from('imagen-de-prueba');
const fields = { name: 'Blazer', category: 'OUTERWEAR', colors: 'negro,beige', styles: 'ELEGANT', seasons: 'AUTUMN,WINTER', brand: 'Zara' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  images.uploadImage.mockResolvedValue({ url: 'https://img/nueva.jpg', publicId: 'just/user-1/nueva' });
  images.deleteImage.mockResolvedValue(undefined);
});

function postGarment(overrides: Record<string, string> = {}) {
  const req = request(app).post('/api/garments').set('Cookie', sessionCookie());
  for (const [key, value] of Object.entries({ ...fields, ...overrides })) req.field(key, value);
  return req;
}

describe('GET /api/garments', () => {
  it('requiere sesión', async () => {
    const res = await request(app).get('/api/garments');
    expect(res.status).toBe(401);
  });

  it('trae solo las prendas del usuario y aplica los filtros', async () => {
    db.garment.findMany.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/garments?category=TEE&season=SUMMER&color=beige&sort=name')
      .set('Cookie', sessionCookie('user-7'));

    expect(res.status).toBe(200);
    const args = db.garment.findMany.mock.calls[0]?.[0];
    expect(args.where).toMatchObject({
      userId: 'user-7',
      category: 'TEE',
      seasons: { has: 'SUMMER' },
      colors: { has: 'beige' },
    });
    expect(args.orderBy).toEqual({ name: 'asc' });
  });

  it('busca por nombre, marca o color con el texto escrito', async () => {
    db.garment.findMany.mockResolvedValue([]);
    await request(app).get('/api/garments?q=Lino').set('Cookie', sessionCookie());
    const where = db.garment.findMany.mock.calls[0]?.[0].where;
    expect(where.OR).toHaveLength(3);
    expect(where.OR).toContainEqual({ colors: { has: 'lino' } });
  });

  it('rechaza filtros inválidos', async () => {
    const res = await request(app).get('/api/garments?category=INVENTADA').set('Cookie', sessionCookie());
    expect(res.status).toBe(400);
  });
});

describe('POST /api/garments', () => {
  it('exige una foto', async () => {
    const res = await request(app).post('/api/garments').set('Cookie', sessionCookie()).send(fields);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Subí una foto de la prenda');
  });

  it('rechaza archivos que no son imágenes', async () => {
    const res = await postGarment().attach('image', Buffer.from('hola'), { filename: 'nota.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('La imagen debe ser JPG, PNG o WebP.');
    expect(images.uploadImage).not.toHaveBeenCalled();
  });

  it('rechaza una categoría inválida', async () => {
    const res = await postGarment({ category: 'INVENTADA' })
      .attach('image', png, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(images.uploadImage).not.toHaveBeenCalled();
  });

  it('sube la foto y guarda la prenda con sus colores y temporadas', async () => {
    db.garment.create.mockImplementation(async ({ data }) => ({ id: 'g1', ...data }));
    const res = await postGarment().attach('image', png, { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(images.uploadImage).toHaveBeenCalledWith(expect.any(Buffer), 'user-1');
    expect(db.garment.create.mock.calls[0]?.[0].data).toMatchObject({
      userId: 'user-1',
      name: 'Blazer',
      colors: ['negro', 'beige'],
      seasons: ['AUTUMN', 'WINTER'],
      imageUrl: 'https://img/nueva.jpg',
      imagePublicId: 'just/user-1/nueva',
    });
  });

  it('guarda colores propios con su nombre, en minúscula', async () => {
    db.garment.create.mockImplementation(async ({ data }) => ({ id: 'g1', ...data }));
    const res = await postGarment({ colors: 'Verde Agua|#7FC8B8,negro' })
      .attach('image', png, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(db.garment.create.mock.calls[0]?.[0].data.colors).toEqual(['verde agua|#7fc8b8', 'negro']);
  });

  it('no deja una imagen huérfana si falla la base de datos', async () => {
    db.garment.create.mockRejectedValue(new Error('base caída'));
    const res = await postGarment().attach('image', png, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
    expect(images.deleteImage).toHaveBeenCalledWith('just/user-1/nueva');
  });
});

describe('PATCH /api/garments/:id', () => {
  const existing = { id: 'g1', userId: 'user-1', imagePublicId: 'just/user-1/vieja' };

  it('cambia los datos sin tocar la foto', async () => {
    db.garment.findFirst.mockResolvedValue(existing);
    db.garment.update.mockResolvedValue({ id: 'g1', name: 'Nuevo nombre' });

    const res = await request(app).patch('/api/garments/g1').set('Cookie', sessionCookie()).send({ name: 'Nuevo nombre' });

    expect(res.status).toBe(200);
    expect(images.uploadImage).not.toHaveBeenCalled();
    expect(images.deleteImage).not.toHaveBeenCalled();
    expect(db.garment.update.mock.calls[0]?.[0].data).toMatchObject({ name: 'Nuevo nombre' });
  });

  it('solo busca prendas del usuario: una ajena da 404', async () => {
    db.garment.findFirst.mockResolvedValue(null);
    const res = await request(app).patch('/api/garments/ajena').set('Cookie', sessionCookie('user-1')).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(db.garment.findFirst.mock.calls[0]?.[0].where).toEqual({ id: 'ajena', userId: 'user-1' });
    expect(db.garment.update).not.toHaveBeenCalled();
  });

  it('reemplaza la foto: sube la nueva y borra la anterior', async () => {
    db.garment.findFirst.mockResolvedValue(existing);
    db.garment.update.mockImplementation(async ({ data }) => ({ id: 'g1', ...data }));

    const req = request(app).patch('/api/garments/g1').set('Cookie', sessionCookie());
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    const res = await req.attach('image', png, { filename: 'b.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(images.uploadImage).toHaveBeenCalledOnce();
    expect(db.garment.update.mock.calls[0]?.[0].data).toMatchObject({
      name: 'Blazer',
      colors: ['negro', 'beige'],
      imageUrl: 'https://img/nueva.jpg',
      imagePublicId: 'just/user-1/nueva',
    });
    expect(images.deleteImage).toHaveBeenCalledWith('just/user-1/vieja');
  });

  it('si falla al guardar, borra la foto nueva y conserva la anterior', async () => {
    db.garment.findFirst.mockResolvedValue(existing);
    db.garment.update.mockRejectedValue(new Error('base caída'));

    const req = request(app).patch('/api/garments/g1').set('Cookie', sessionCookie());
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    const res = await req.attach('image', png, { filename: 'b.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(images.deleteImage).toHaveBeenCalledTimes(1);
    expect(images.deleteImage).toHaveBeenCalledWith('just/user-1/nueva');
  });
});

describe('DELETE /api/garments/:id', () => {
  it('borra la prenda y su foto', async () => {
    db.garment.findFirst.mockResolvedValue({ id: 'g1', userId: 'user-1', imagePublicId: 'just/user-1/vieja' });
    db.garment.delete.mockResolvedValue({});

    const res = await request(app).delete('/api/garments/g1').set('Cookie', sessionCookie());

    expect(res.status).toBe(204);
    expect(db.garment.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
    expect(images.deleteImage).toHaveBeenCalledWith('just/user-1/vieja');
  });

  it('da 404 si la prenda no es del usuario', async () => {
    db.garment.findFirst.mockResolvedValue(null);
    const res = await request(app).delete('/api/garments/ajena').set('Cookie', sessionCookie());
    expect(res.status).toBe(404);
    expect(db.garment.delete).not.toHaveBeenCalled();
  });
});
