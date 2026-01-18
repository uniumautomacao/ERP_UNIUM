import type { Connection, DeviceIOTemplate, Dimensions } from '../types';

const defaultDimensions: Dimensions = {
  Width: 0,
  H: 0,
  Depth: 0,
};

export const getDefaultTemplate = (): DeviceIOTemplate => ({
  Dimensions: { ...defaultDimensions },
  RackCategory: '',
  Connections: [],
});

const normalizeDimensions = (input: Partial<Dimensions> | { Height?: number } | undefined): Dimensions => {
  const partialDims = input as Partial<Dimensions> | undefined;
  const heightValue = (input as { Height?: number } | undefined)?.Height;
  return {
    Width: Number.isFinite(partialDims?.Width) ? Number(partialDims?.Width) : 0,
    H: Number.isFinite(partialDims?.H)
      ? Number(partialDims?.H)
      : Number.isFinite(heightValue)
        ? Number(heightValue)
        : 0,
    Depth: Number.isFinite(partialDims?.Depth) ? Number(partialDims?.Depth) : 0,
  };
};

const normalizeConnections = (input: unknown): Connection[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const connection = item as Partial<Connection>;
      return {
        Name: connection.Name?.toString() ?? '',
        Type: connection.Type?.toString() ?? '',
        Direction: connection.Direction?.toString() ?? '',
      };
    });
};

export const parseTemplate = (raw: string | null | undefined): DeviceIOTemplate => {
  if (!raw || raw.trim().length === 0) {
    return getDefaultTemplate();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DeviceIOTemplate>;
    const dimensions = normalizeDimensions(parsed.Dimensions);
    return {
      Dimensions: dimensions,
      RackCategory: parsed.RackCategory?.toString() ?? '',
      Connections: normalizeConnections(parsed.Connections),
    };
  } catch {
    return getDefaultTemplate();
  }
};

export const serializeTemplate = (template: DeviceIOTemplate): string => {
  const normalized: DeviceIOTemplate = {
    Dimensions: normalizeDimensions(template.Dimensions),
    RackCategory: template.RackCategory ?? '',
    Connections: normalizeConnections(template.Connections),
  };

  return JSON.stringify(normalized);
};
