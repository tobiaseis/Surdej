/**
 * Tal skrives med dansk decimalkomma. `decimals` låser antallet af
 * decimaler – uden den vises højst én decimal, og hele tal står uden komma
 * (18,5 g kaffe, men 18 g kaffe).
 */
export const formatDecimal = (value: number, decimals?: number): string => {
  const safe = Number.isFinite(value) ? value : 0;
  const text = decimals === undefined ? String(Math.round(safe * 10) / 10) : safe.toFixed(decimals);
  return text.replace('.', ',');
};
