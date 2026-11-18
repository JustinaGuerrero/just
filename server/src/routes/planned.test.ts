import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionCookie } from '../test/session.js';

const db = vi.hoisted(() => ({
  outfit: { findFirst: vi.fn() },
  plannedOutfit: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock('../lib/prisma.js', () => ({ prisma: db }));

const { app } = await import('../app.js');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('calendario', () => {
  it('requiere sesión', async () => {
    const res = await request(app).get('/api/planned?from=2026-11-16&to=2026-11-22');
    expect(res.status).toBe(401);
  });

  it('GET exige el rango de fechas', async () => {
    const res = await request(app).get('/api/planned').set('Cookie', sessionCookie());
    expect(res.status).toBe(400);
  });

  it('GET devuelve las fechas como YYYY-MM-DD y solo las del usuario', async () => {
    db.plannedOutfit.findMany.mockResolvedValue([{ id: 'p1', date: new Date('2026-11-18T00:00:00.000Z'), outfit: { id: 'o1' } }]);

    const res = await request(app)
      .get('/api/planned?from=2026-11-16&to=2026-11-22')
      .set('Cookie', sessionCookie('user-9'));

    expect(res.status).toBe(200);
    expect(res.body.planned[0].date).toBe('2026-11-18');
    expect(db.plannedOutfit.findMany.mock.calls[0]?.[0].where).toEqual({
      userId: 'user-9',
      date: { gte: new Date('2026-11-16T00:00:00.000Z'), lte: new Date('2026-11-22T00:00:00.000Z') },
    });
  });

  it('PUT rechaza fechas inválidas', async () => {
    const malFormato = await request(app).put('/api/planned/18-11-2026').set('Cookie', sessionCookie()).send({ outfitId: 'o1' });
    const noExiste = await request(app).put('/api/planned/2026-13-45').set('Cookie', sessionCookie()).send({ outfitId: 'o1' });
    expect(malFormato.status).toBe(400);
    expect(noExiste.status).toBe(400);
    expect(db.plannedOutfit.upsert).not.toHaveBeenCalled();
  });

  it('PUT exige elegir un look', async () => {
    const res = await request(app).put('/api/planned/2026-11-18').set('Cookie', sessionCookie()).send({});
    expect(res.status).toBe(400);
  });

  it('PUT da 404 si el look no es del usuario', async () => {
    db.outfit.findFirst.mockResolvedValue(null);
    const res = await request(app).put('/api/planned/2026-11-18').set('Cookie', sessionCookie()).send({ outfitId: 'ajeno' });
    expect(res.status).toBe(404);
    expect(db.outfit.findFirst.mock.calls[0]?.[0].where).toEqual({ id: 'ajeno', userId: 'user-1' });
    expect(db.plannedOutfit.upsert).not.toHaveBeenCalled();
  });

  it('PUT planifica un look: un solo look por día (crea o reemplaza)', async () => {
    db.outfit.findFirst.mockResolvedValue({ id: 'o1', userId: 'user-1', occasion: 'WORK' });
    db.plannedOutfit.upsert.mockImplementation(async ({ create }) => ({ id: 'p1', ...create }));

    const res = await request(app).put('/api/planned/2026-11-18').set('Cookie', sessionCookie()).send({ outfitId: 'o1' });

    expect(res.status).toBe(200);
    expect(res.body.planned.date).toBe('2026-11-18');
    const args = db.plannedOutfit.upsert.mock.calls[0]?.[0];
    expect(args.where).toEqual({ userId_date: { userId: 'user-1', date: new Date('2026-11-18T00:00:00.000Z') } });
    expect(args.create).toMatchObject({ outfitId: 'o1', occasion: 'WORK' });
    expect(args.update).toMatchObject({ outfitId: 'o1', occasion: 'WORK' });
  });

  it('DELETE saca el look de ese día solo para el usuario', async () => {
    db.plannedOutfit.deleteMany.mockResolvedValue({ count: 1 });
    const res = await request(app).delete('/api/planned/2026-11-18').set('Cookie', sessionCookie('user-4'));
    expect(res.status).toBe(204);
    expect(db.plannedOutfit.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-4', date: new Date('2026-11-18T00:00:00.000Z') },
    });
  });
});
