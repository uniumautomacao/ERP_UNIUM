import type { DeviceIOConnection, DeviceIOTemplate } from '../../types';

type RawTemplate = {
  Connections?: Array<{
    Name?: string;
    Type?: number;
    Direction?: number;
  }>;
};

export const parseDeviceTemplate = (raw?: string | null): DeviceIOTemplate | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as RawTemplate;
    if (!parsed || !Array.isArray(parsed.Connections)) {
      return null;
    }

    const connections: DeviceIOConnection[] = parsed.Connections.map((item) => ({
      Name: item?.Name ? String(item.Name) : 'Conexão',
      Type: item?.Type !== undefined && item?.Type !== null ? String(item.Type) : '',
      Direction:
        item?.Direction !== undefined && item?.Direction !== null
          ? String(item.Direction)
          : '',
    }));

    return {
      Dimensions: { Width: 0, H: 0, Depth: 0 },
      RackCategory: '',
      Connections: connections,
    };
  } catch (err) {
    console.error('[GuiaConexoes] Falha ao parsear template', err);
    return null;
  }
};
