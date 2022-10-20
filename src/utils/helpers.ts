export const localeCompare = (a: string, b: string, locale: string): number =>
  a.localeCompare(b, locale, { numeric: true });
