import { useEffect, useState } from 'react';

// Devuelve el valor recién después de que dejó de cambiar durante `delay` ms.
// Sirve para no pedir datos al servidor en cada letra que se escribe.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
