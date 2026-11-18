// Opciones de categorías, temporadas, estilos y colores.
// Los valores (value) coinciden con los enums del backend (prisma/schema.prisma).

export const CATEGORIES = [
  { value: 'TEE', label: 'Remeras' },
  { value: 'SHIRT', label: 'Camisas' },
  { value: 'PANTS', label: 'Pantalones' },
  { value: 'SKIRT', label: 'Faldas' },
  { value: 'DRESS', label: 'Vestidos' },
  { value: 'OUTERWEAR', label: 'Abrigos' },
  { value: 'SHOES', label: 'Calzado' },
  { value: 'ACCESSORY', label: 'Accesorios' },
] as const;

export const SEASONS = [
  { value: 'SPRING', label: 'Primavera' },
  { value: 'SUMMER', label: 'Verano' },
  { value: 'AUTUMN', label: 'Otoño' },
  { value: 'WINTER', label: 'Invierno' },
] as const;

export const STYLES = [
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'SPORT', label: 'Deportivo' },
  { value: 'ELEGANT', label: 'Elegante' },
  { value: 'STREET', label: 'Urbano' },
] as const;

// Los colores se guardan por nombre (en minúscula); el hex es solo para mostrarlos.
export const COLORS = [
  { name: 'blanco', hex: '#FFFFFF' },
  { name: 'negro', hex: '#1F1C19' },
  { name: 'gris', hex: '#9A948C' },
  { name: 'beige', hex: '#D8C8B2' },
  { name: 'camel', hex: '#B08A62' },
  { name: 'marrón', hex: '#6B4A3A' },
  { name: 'rosa', hex: '#D9B8AC' },
  { name: 'rojo', hex: '#A8433B' },
  { name: 'amarillo', hex: '#E2C46B' },
  { name: 'verde', hex: '#6B7F63' },
  { name: 'celeste', hex: '#AFC3D6' },
  { name: 'azul', hex: '#3B4F7A' },
  { name: 'crema', hex: '#EFE6D2' },
  { name: 'mostaza', hex: '#C79A2E' },
  { name: 'naranja', hex: '#D2793F' },
  { name: 'bordó', hex: '#6E2530' },
  { name: 'fucsia', hex: '#C2457F' },
  { name: 'lila', hex: '#B9A6CF' },
  { name: 'violeta', hex: '#6B4C8A' },
  { name: 'turquesa', hex: '#4FA3A5' },
  { name: 'verde oliva', hex: '#6F6B3A' },
  { name: 'dorado', hex: '#BFA054' },
  { name: 'plateado', hex: '#C4C6C9' },
] as const;

export const OCCASIONS = [
  { value: 'UNIVERSITY', label: 'Facultad' },
  { value: 'WORK', label: 'Trabajo' },
  { value: 'OUTING', label: 'Salidas' },
  { value: 'EVENT', label: 'Eventos' },
  { value: 'SPORT', label: 'Deporte' },
  { value: 'OTHER', label: 'Otra' },
] as const;

export type Category = (typeof CATEGORIES)[number]['value'];
export type Occasion = (typeof OCCASIONS)[number]['value'];
export type Season = (typeof SEASONS)[number]['value'];
export type Style = (typeof STYLES)[number]['value'];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])) as Record<Category, string>;
export const SEASON_LABEL = Object.fromEntries(SEASONS.map((s) => [s.value, s.label])) as Record<Season, string>;
export const STYLE_LABEL = Object.fromEntries(STYLES.map((s) => [s.value, s.label])) as Record<Style, string>;
export const OCCASION_LABEL = Object.fromEntries(OCCASIONS.map((o) => [o.value, o.label])) as Record<Occasion, string>;

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
