import { defineConfig } from 'vitest/config';

// Los tests no usan la base de datos ni Cloudinary reales: se simulan en cada archivo.
// Estas variables solo existen para que config.ts no se queje al cargar.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      JWT_SECRET: 'secreto-solo-para-tests-0123456789abcdef',
      CLOUDINARY_CLOUD_NAME: 'test',
      CLOUDINARY_API_KEY: 'test',
      CLOUDINARY_API_SECRET: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
});
