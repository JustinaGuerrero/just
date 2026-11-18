import { describe, expect, it } from 'vitest';
import { addDays, parseISODate, startOfWeek, toISODate } from './dates';

describe('toISODate / parseISODate', () => {
  it('convierte una fecha local a YYYY-MM-DD con ceros a la izquierda', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 10, 18))).toBe('2026-11-18');
  });

  it('ida y vuelta: parsear y volver a formatear da la misma fecha', () => {
    expect(toISODate(parseISODate('2026-02-28'))).toBe('2026-02-28');
  });

  it('parsea en hora local, sin corrimientos por zona horaria', () => {
    const date = parseISODate('2026-11-18');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 18]);
  });
});

describe('addDays', () => {
  it('suma y resta días', () => {
    expect(toISODate(addDays(new Date(2026, 10, 18), 1))).toBe('2026-11-19');
    expect(toISODate(addDays(new Date(2026, 10, 18), -2))).toBe('2026-11-16');
  });

  it('cruza el fin de mes y de año', () => {
    expect(toISODate(addDays(new Date(2026, 10, 30), 1))).toBe('2026-12-01');
    expect(toISODate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
  });

  it('no modifica la fecha original', () => {
    const original = new Date(2026, 10, 18);
    addDays(original, 5);
    expect(toISODate(original)).toBe('2026-11-18');
  });
});

describe('startOfWeek', () => {
  it('devuelve el lunes de la semana', () => {
    expect(toISODate(startOfWeek(new Date(2026, 10, 18)))).toBe('2026-11-16'); // miércoles
    expect(toISODate(startOfWeek(new Date(2026, 10, 16)))).toBe('2026-11-16'); // lunes
  });

  it('trata el domingo como el último día de la semana', () => {
    expect(toISODate(startOfWeek(new Date(2026, 10, 22)))).toBe('2026-11-16');
  });
});
