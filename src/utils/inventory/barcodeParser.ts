import type { ParsedBarcode } from '../../types';

const normalizeBarcode = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const [first] = trimmed.split('|');
  return (first ?? '').trim();
};

export const parseBarcodes = (rawCodes: string[]): ParsedBarcode[] => {
  const seen = new Set<string>();

  return rawCodes
    .map(normalizeBarcode)
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .map((value) => ({
      original: value,
      value,
      isNumeric: Number.isFinite(Number(value)),
    }));
};

export const splitBarcodeGroups = (barcodes: ParsedBarcode[]) => {
  const numericValues = barcodes.filter((barcode) => barcode.isNumeric).map((barcode) => Number(barcode.value));
  const textValues = barcodes.filter((barcode) => !barcode.isNumeric).map((barcode) => barcode.value);

  return { numericValues, textValues };
};
