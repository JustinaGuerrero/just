import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('Falta JWT_SECRET en server/.env (mínimo 32 caracteres).');
}

export const config = {
  jwtSecret,
  port: Number(process.env.PORT) || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
};
