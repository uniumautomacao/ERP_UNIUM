export const escapeOData = (value: string) => value.replace(/'/g, "''");

export const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatNumber = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR');
};

export const toNumberOrUndefined = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};
