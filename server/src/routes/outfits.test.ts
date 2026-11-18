import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionCookie } from '../test/session.js';

const db = vi.hoisted(() => ({
  garment: { count: vi.fn() },
  outfit: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('../lib/prisma.js', () => ({ prisma: db }));

const { app } = await import('../app.js');

const item = (garmentId: string) => ({ garmentId, x: 50, y: 40, scale: 1, zIndex: 0 });
const validOutfit = { name: 'Salida de viernes', occasion: 'OUTING', items: [item('g1'), item('g2')] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('looks (outfits)', () => {
  it('requieren sesión', async () => {
    const res = await request(app).get('/api/outfits');
    expect(res.status).toBe(401);
  });

  it('GET filtra por favoritos y ocasión, solo del usuario', async () => {
    db.outfit.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/outfits?favorite=true&occasion=WORK').set('Cookie', sessionCookie('user-3'));
    expect(res.status).toBe(200);
    expect(db.outfit.findMany.mock.calls[0]?.[0].where).toEqual({ userId: 'user-3', isFavorite: true, occasion: 'WORK' });
  });

  it('GET rechaza una ocasión inválida', async () => {
    const res = await request(app).get('/api/outfits?occasion=INVENTADA').set('Cookie', sessionCookie());
    expect(res.status).toBe(400);
  });

  it('POST exige al menos una prenda', async () => {
    const res = await request(app)
      .post('/api/outfits')
      .set('Cookie', sessionCookie())
      .send({ ...validOutfit, items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Agregá al menos una prenda');
  });

  it('POST rechaza posiciones fuera del lienzo', async () => {
    const res = await request(app)
      .post('/api/outfits')
      .set('Cookie', sessionCookie())
      .send({ ...validOutfit, items: [{ ...item('g1'), x: 140 }] });
    expect(res.status).toBe(400);
  });

  it('POST no permite repetir una prenda', async () => {
    const res = await request(app)
      .post('/api/outfits')
      .set('Cookie', sessionCookie())
      .send({ ...validOutfit, items: [item('g1'), item('g1')] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No se puede repetir una prenda en el mismo look');
  });

  it('POST no permite usar prendas de otra persona', async () => {
    db.garment.count.mockResolvedValue(1); // solo una de las dos es del usuario
    const res = await request(app).post('/api/outfits').set('Cookie', sessionCookie()).send(validOutfit);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Alguna de las prendas ya no existe');
    expect(db.outfit.create).not.toHaveBeenCalled();
  });

  it('POST crea el look con sus prendas', async () => {
    db.garment.count.mockResolvedValue(2);
    db.outfit.create.mockImplementation(async ({ data }) => ({ id: 'o1', ...data }));

    const res = await request(app).post('/api/outfits').set('Cookie', sessionCookie()).send(validOutfit);

    expect(res.status).toBe(201);
    const data = db.outfit.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({ userId: 'user-1', name: 'Salida de viernes', occasion: 'OUTING', isFavorite: false });
    expect(data.items.create).toHaveLength(2);
  });

  it('PATCH marca un look como favorito', async () => {
    db.outfit.findFirst.mockResolvedValue({ id: 'o1', userId: 'user-1' });
    db.outfit.update.mockResolvedValue({ id: 'o1', isFavorite: true });

    const res = await request(app).patch('/api/outfits/o1').set('Cookie', sessionCookie()).send({ isFavorite: true });

    expect(res.status).toBe(200);
    expect(db.outfit.update.mock.calls[0]?.[0].data).toEqual({ isFavorite: true });
  });

  it('PATCH y DELETE dan 404 con looks de otra persona', async () => {
    db.outfit.findFirst.mockResolvedValue(null);
    const patch = await request(app).patch('/api/outfits/ajeno').set('Cookie', sessionCookie()).send({ isFavorite: true });
    const del = await request(app).delete('/api/outfits/ajeno').set('Cookie', sessionCookie());
    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);
    expect(db.outfit.update).not.toHaveBeenCalled();
    expect(db.outfit.delete).not.toHaveBeenCalled();
  });

  it('PUT reemplaza las prendas del look', async () => {
    db.outfit.findFirst.mockResolvedValue({ id: 'o1', userId: 'user-1' });
    db.garment.count.mockResolvedValue(2);
    db.outfit.update.mockResolvedValue({ id: 'o1' });

    const res = await request(app).put('/api/outfits/o1').set('Cookie', sessionCookie()).send(validOutfit);

    expect(res.status).toBe(200);
    expect(db.outfit.update.mock.calls[0]?.[0].data.items).toMatchObject({ deleteMany: {} });
    expect(db.outfit.update.mock.calls[0]?.[0].data.items.create).toHaveLength(2);
  });

  it('DELETE borra el look del usuario', async () => {
    db.outfit.findFirst.mockResolvedValue({ id: 'o1', userId: 'user-1' });
    db.outfit.delete.mockResolvedValue({});
    const res = await request(app).delete('/api/outfits/o1').set('Cookie', sessionCookie());
    expect(res.status).toBe(204);
    expect(db.outfit.delete).toHaveBeenCalledWith({ where: { id: 'o1' } });
  });
});
