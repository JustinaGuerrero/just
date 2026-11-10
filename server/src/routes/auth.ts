import bcrypt from 'bcryptjs';
import { Router, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { COOKIE_NAME, requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 días

const cookieOptions = {
  httpOnly: true, // el JavaScript del navegador no puede leer la cookie
  sameSite: 'lax' as const,
  secure: config.isProd,
};

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá tu nombre').max(60, 'El nombre es muy largo'),
  email: z.string().trim().toLowerCase().email('El email no es válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es muy larga'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('El email no es válido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

function startSession(res: Response, userId: string) {
  const token = jwt.sign({}, config.jwtSecret, {
    subject: userId,
    expiresIn: SESSION_SECONDS,
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_SECONDS * 1000 });
}

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Ese email ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  startSession(res, user.id);
  res.status(201).json({ user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

  // Mismo mensaje si falla el email o la contraseña, para no revelar qué cuentas existen.
  if (!user || !valid) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  startSession(res, user.id);
  res.json({ user: publicUser(user) });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (_req, res) => {
  const user = await prisma.user.findUnique({ where: { id: res.locals.userId } });
  if (!user) {
    return res.status(401).json({ error: 'La cuenta ya no existe' });
  }
  res.json({ user: publicUser(user) });
});
