/** Junta classes do Tailwind ignorando valores falsos: cn('a', cond && 'b'). */
export function cn(...classes) {
  return classes.flat().filter(Boolean).join(' ');
}
