import { useEffect, useMemo, useState } from 'react';
import {
  NewDeviceIOConnectionService,
  NewDeviceIOService,
} from '../../generated';
import type { GuiaDeviceIOConnection } from '../../types/guiaConexoes';
import { resolveErrorMessage } from '../../utils/guia-conexoes/errors';
import { buildOrFilter, chunkIds } from '../../utils/guia-conexoes/odata';

type ConnectionInfo = {
  new_deviceioconnectionid: string;
  new_name?: string | null;
  new_displayname?: string | null;
  new_localizacao?: string | null;
  _new_device_value?: string | null;
};

type DeviceInfo = {
  new_deviceioid: string;
  new_name?: string | null;
};

const getPortLabel = (connection: ConnectionInfo) =>
  connection.new_name || connection.new_displayname || 'Conexão';

const getDeviceLabel = (device?: DeviceInfo | null) =>
  device?.new_name || 'Equipamento';

const buildLabel = (connection: ConnectionInfo, device?: DeviceInfo | null) => {
  const location = connection.new_localizacao?.trim() || '';
  const locationSuffix = location ? ` | ${location}` : '';
  return `${getDeviceLabel(device)} - ${getPortLabel(connection)}${locationSuffix}`;
};

export const useConnectionEndpointLabels = (connections: GuiaDeviceIOConnection[]) => {
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectedIds = useMemo(
    () =>
      connections
        .map((connection) => connection._new_connectedto_value)
        .filter((value): value is string => !!value),
    [connections]
  );

  const key = useMemo(() => connectedIds.sort().join('|'), [connectedIds]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (connectedIds.length === 0) {
        if (isMounted) {
          setLabels(new Map());
          setError('');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError('');
      try {
        const chunks = chunkIds(connectedIds, 25);
        const connectionResponses = await Promise.all(
          chunks.map((chunk) =>
            NewDeviceIOConnectionService.getAll({
              select: [
                'new_deviceioconnectionid',
                'new_name',
                'new_displayname',
                'new_localizacao',
                '_new_device_value',
              ],
              filter: `statecode eq 0 and (${buildOrFilter(
                'new_deviceioconnectionid',
                chunk
              )})`,
              top: chunk.length,
            })
          )
        );

        const connectionsMap = new Map<string, ConnectionInfo>();
        const deviceIds = new Set<string>();

        connectionResponses.forEach((response) => {
          if (response.success && response.data) {
            (response.data as ConnectionInfo[]).forEach((item) => {
              connectionsMap.set(item.new_deviceioconnectionid, item);
              if (item._new_device_value) {
                deviceIds.add(item._new_device_value);
              }
            });
          }
        });

        const deviceIdList = Array.from(deviceIds);
        const deviceChunks = chunkIds(deviceIdList, 25);
        const deviceResponses = await Promise.all(
          deviceChunks.map((chunk) =>
            NewDeviceIOService.getAll({
              select: ['new_deviceioid', 'new_name'],
              filter: `statecode eq 0 and (${buildOrFilter('new_deviceioid', chunk)})`,
              top: chunk.length,
            })
          )
        );

        const deviceMap = new Map<string, DeviceInfo>();
        deviceResponses.forEach((response) => {
          if (response.success && response.data) {
            (response.data as DeviceInfo[]).forEach((item) => {
              deviceMap.set(item.new_deviceioid, item);
            });
          }
        });

        const nextLabels = new Map<string, string>();
        connectionsMap.forEach((connection, id) => {
          const device = connection._new_device_value
            ? deviceMap.get(connection._new_device_value)
            : null;
          nextLabels.set(id, buildLabel(connection, device));
        });

        if (isMounted) {
          setLabels(nextLabels);
        }
      } catch (err) {
        if (isMounted) {
          setError(resolveErrorMessage(err, 'Falha ao resolver destinos.'));
          setLabels(new Map());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [connectedIds, key]);

  return { labels, loading, error };
};
