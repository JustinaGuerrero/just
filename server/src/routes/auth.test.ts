import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionCookie } from '../test/session.js';

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
}));
vi.mock('../lib/prisma.js', () => ({ prisma: db }));

const { app } = await import('../app.js');

beforeEach(() => {
  vi.resetAllMocks();
});

describe('POST /api/auth/register', () => {
  const valid = { name: 'Justina', email: 'Justina@Example.com', password: 'contraseña-segura' };

  it('rechaza un email inválido', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, email: 'no-es-un-email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El email no es válido');
  });

  it('rechaza una contraseña corta', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, password: '1234567' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  it('rechaza un email ya registrado', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1' });
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('crea la cuenta, guarda la contraseña cifrada e inicia sesión con una cookie httpOnly', async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockImplementation(async ({ data }) => ({ id: 'u1', ...data }));

    const res = await request(app).post('/api/auth/register').send(valid);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: 'u1', name: 'Justina', email: 'justina@example.com' });
    expect(res.body.user.passwordHash).toBeUndefined();

    const saved = db.user.create.mock.calls[0]?.[0].data;
    expect(saved.passwordHash).not.toBe(valid.password);
    expect(await bcrypt.compare(valid.password, saved.passwordHash)).toBe(true);

    const cookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookie).toContain('just_token=');
    expect(cookie).toContain('HttpOnly');
  });
});

describe('POST /api/auth/login', () => {
  const passwordHash = bcrypt.hashSync('contraseña-segura', 4);

  it('inicia sesión con las credenciales correctas', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Justina', email: 'j@example.com', passwordHash });
    const res = await request(app).post('/api/auth/login').send({ email: 'j@example.com', password: 'contraseña-segura' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('j@example.com');
    expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toContain('just_token=');
  });

  it('da el mismo error si la contraseña es incorrecta o si el email no existe', async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: 'u1', name: 'J', email: 'j@example.com', passwordHash });
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'j@example.com', password: 'otra-cosa' });

    db.user.findUnique.mockResolvedValueOnce(null);
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'nadie@example.com', password: 'otra-cosa' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
    expect(wrongPassword.headers['set-cookie']).toBeUndefined();
  });
});

describe('GET /api/auth/me', () => {
  it('pide iniciar sesión si no hay cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rechaza una cookie con un token falso', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', ['just_token=token-falso']);
    expect(res.status).toBe(401);
  });

  it('devuelve el usuario de la sesión', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Justina', email: 'j@example.com', passwordHash: 'x' });
    const res = await request(app).get('/api/auth/me').set('Cookie', sessionCookie());
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'user-1', name: 'Justina', email: 'j@example.com' });
  });
});

describe('POST /api/auth/logout', () => {
  it('borra la cookie de sesión', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/just_token=;/);
  });
});
