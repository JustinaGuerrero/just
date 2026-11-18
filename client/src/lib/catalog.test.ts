import { describe, expect, it } from 'vitest';
import { isCustomColor, makeCustomColor, parseColor } from './catalog';

describe('colores propios', () => {
  it('guarda el nombre y el color en minúscula', () => {
    expect(makeCustomColor('Verde Agua', '#7FC8B8')).toBe('verde agua|#7fc8b8');
  });

  it('limpia comas, barras y símbolos del nombre', () => {
    expect(makeCustomColor('rojo, intenso | 100%', '#ff0000')).toBe('rojo intenso 100|#ff0000');
  });

  it('usa un nombre por defecto si queda vacío', () => {
    expect(makeCustomColor('  ', '#112233')).toBe('personalizado|#112233');
  });

  it('limita el largo del nombre', () => {
    const value = makeCustomColor('a'.repeat(50), '#000000');
    expect(value.length).toBeLessThanOrEqual(30);
  });

  it('distingue los colores propios de los de la paleta', () => {
    expect(isCustomColor('verde agua|#7fc8b8')).toBe(true);
    expect(isCustomColor('beige')).toBe(false);
  });

  it('devuelve nombre y color para mostrar', () => {
    expect(parseColor('verde agua|#7fc8b8')).toEqual({ name: 'verde agua', hex: '#7fc8b8' });
    expect(parseColor('negro')).toEqual({ name: 'negro', hex: '#1F1C19' });
  });

  it('no se rompe con valores raros', () => {
    expect(parseColor('algo|nohex').hex).toBe('#cccccc');
    expect(parseColor('inexistente').hex).toBe('#cccccc');
  });
});
