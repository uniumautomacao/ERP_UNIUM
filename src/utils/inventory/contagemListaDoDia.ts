import { escapeODataValue } from '../guia-conexoes/odata';

export type ContagemThresholds = {
  A: number;
  B: number;
  C: number;
};

export const DEFAULT_CONTAGEM_THRESHOLDS: ContagemThresholds = {
  A: 20,
  B: 40,
  C: 60,
};

const getDueLimitDate = (now: Date, threshold: number) => {
  const limit = new Date(now);
  limit.setDate(limit.getDate() - threshold);
  return limit.toISOString();
};

export const buildSearchClause = (search?: string) => {
  if (!search) return '';
  const escaped = escapeODataValue(search);
  let searchPart = `contains(new_referenciadoproduto, '${escaped}')`;
  const asNum = Number(search);
  if (!Number.isNaN(asNum) && Number.isInteger(asNum)) {
    searchPart = `(${searchPart} or cr22f_querytag eq ${asNum})`;
  }
  return ` and (${searchPart})`;
};

export const buildListaDoDiaFilter = (now: Date, thresholds: ContagemThresholds, search?: string) => {
  const limitA = getDueLimitDate(now, thresholds.A);
  const limitB = getDueLimitDate(now, thresholds.B);
  const limitC = getDueLimitDate(now, thresholds.C);
  const filter = [
    'statecode eq 0',
    "and new_tagconfirmadabool eq true and cr22f_status ne 'Entregue' and new_separado ne true and (new_contemrma ne true or new_rmaaprovadoparavenda eq true) and (",
    'new_ultimacontagem eq null',
    `or (new_classecriticidade eq 100000000 and new_ultimacontagem le ${limitA})`,
    `or (new_classecriticidade eq 100000001 and new_ultimacontagem le ${limitB})`,
    `or (new_classecriticidade eq 100000002 and new_ultimacontagem le ${limitC})`,
    ')',
  ].join(' ');

  return `${filter}${buildSearchClause(search)}`;
};

export const buildDayRange = (now: Date) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

export const toDateOnlyString = (date: Date) => date.toISOString().slice(0, 10);

export const toDateOnlyKey = (value?: string | null) => (value ? value.slice(0, 10) : '');

export const buildUtcDayRangeFromDateKey = (dateKey: string) => ({
  start: `${dateKey}T00:00:00.000Z`,
  end: `${dateKey}T23:59:59.999Z`,
});
