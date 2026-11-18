// Fechas locales en formato "YYYY-MM-DD", que es como las maneja el backend.

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Lunes de la semana de la fecha dada.
export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

const weekdayShort = new Intl.DateTimeFormat('es-AR', { weekday: 'short' });
const longDate = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
const monthYear = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const formatWeekdayShort = (date: Date) => weekdayShort.format(date).replace('.', '');
export const formatLongDate = (date: Date) => capitalize(longDate.format(date));
export const formatMonthYear = (date: Date) => capitalize(monthYear.format(date));
