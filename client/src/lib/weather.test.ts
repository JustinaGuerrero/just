import { describe, expect, it } from 'vitest';
import { clothingTip, describeWeather, seasonFor, type DayForecast } from './weather';

const day = (overrides: Partial<DayForecast> = {}): DayForecast => ({
  date: '2026-11-18',
  code: 0,
  tMax: 22,
  tMin: 14,
  rainChance: 0,
  ...overrides,
});

describe('describeWeather', () => {
  it('traduce los códigos del clima', () => {
    expect(describeWeather(0)).toEqual({ label: 'Despejado', kind: 'sun' });
    expect(describeWeather(3).kind).toBe('cloud');
    expect(describeWeather(45).kind).toBe('fog');
    expect(describeWeather(63).kind).toBe('rain');
    expect(describeWeather(73).kind).toBe('snow');
    expect(describeWeather(95)).toEqual({ label: 'Tormenta', kind: 'rain' });
  });

  it('usa un valor genérico para códigos desconocidos', () => {
    expect(describeWeather(10)).toEqual({ label: 'Variable', kind: 'cloud' });
  });
});

describe('clothingTip', () => {
  it('recomienda abrigo impermeable si llueve', () => {
    expect(clothingTip(day({ code: 63 }))).toContain('lluvia');
  });

  it('avisa de lluvia si la probabilidad es alta aunque el cielo esté despejado', () => {
    expect(clothingTip(day({ code: 0, rainChance: 70 }))).toContain('lluvia');
  });

  it('da consejos según la temperatura máxima', () => {
    expect(clothingTip(day({ tMax: 30 }))).toContain('calor');
    expect(clothingTip(day({ tMax: 22 }))).toContain('Templado');
    expect(clothingTip(day({ tMax: 16 }))).toContain('Fresco');
    expect(clothingTip(day({ tMax: 5 }))).toContain('frío');
  });

  it('prioriza la nieve sobre la temperatura', () => {
    expect(clothingTip(day({ code: 73, tMax: 2 }))).toContain('nevadas');
  });
});

describe('seasonFor', () => {
  it('elige la temporada de las prendas según la temperatura máxima', () => {
    expect(seasonFor(day({ tMax: 30 }))).toBe('SUMMER');
    expect(seasonFor(day({ tMax: 20 }))).toBe('SPRING');
    expect(seasonFor(day({ tMax: 15 }))).toBe('AUTUMN');
    expect(seasonFor(day({ tMax: 5 }))).toBe('WINTER');
  });
});
