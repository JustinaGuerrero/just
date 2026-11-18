import jwt from 'jsonwebtoken';

// Cookie de sesión válida para probar rutas protegidas.
export function sessionCookie(userId = 'user-1'): string[] {
  const token = jwt.sign({}, process.env.JWT_SECRET as string, { subject: userId, expiresIn: 60 });
  return [`just_token=${token}`];
}
