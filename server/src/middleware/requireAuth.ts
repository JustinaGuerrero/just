import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const COOKIE_NAME = 'just_token';

// Protege una ruta: si hay una sesión válida, deja el id del usuario en res.locals.userId.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'No iniciaste sesión' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === 'string' || !payload.sub) {
      throw new Error('Token inválido');
    }
    res.locals.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o vencida' });
  }
}
