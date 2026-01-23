import { NewDeviceIOConnectionService, NewDeviceIOService } from '../../generated';
import type { GuiaDeviceIOConnection } from '../../types/guiaConexoes';
import { resolveErrorMessage } from './errors';
import { escapeODataValue } from './odata';

const CLEAR_LINK_PAYLOAD = {
  'new_ConnectedTo@odata.bind': null,
  new_connectedtomanual: null,
} as unknown as Record<string, unknown>;

export async function clearDeviceIOConnectionLink(
  connectionId: string,
  connectedToId?: string | null
) {
  const updates = [NewDeviceIOConnectionService.update(connectionId, CLEAR_LINK_PAYLOAD)];
  if (connectedToId) {
    updates.push(NewDeviceIOConnectionService.update(connectedToId, CLEAR_LINK_PAYLOAD));
  }

  const results = await Promise.all(updates);
  const failed = results.filter((result) => !result.success);
  if (failed.length > 0) {
    throw new Error(
      `Falha ao limpar vínculo: ${failed
        .map((result) => resolveErrorMessage(result.error, 'Erro desconhecido'))
        .join('; ')}`
    );
  }
}

export async function deleteDeviceWithConnections(deviceId: string) {
  const connectionsResult = await NewDeviceIOConnectionService.getAll({
    select: ['new_deviceioconnectionid', '_new_connectedto_value'],
    filter: `statecode eq 0 and _new_device_value eq ${escapeODataValue(deviceId)}`,
    maxPageSize: 5000,
  });

  if (!connectionsResult.success) {
    throw new Error(resolveErrorMessage(connectionsResult.error, 'Falha ao carregar conexões.'));
  }

  const deviceConnections = (connectionsResult.data ?? []) as GuiaDeviceIOConnection[];
  for (const connection of deviceConnections) {
    if (connection._new_connectedto_value) {
      await clearDeviceIOConnectionLink(
        connection.new_deviceioconnectionid,
        connection._new_connectedto_value
      );
    }
    await NewDeviceIOConnectionService.delete(connection.new_deviceioconnectionid);
  }

  await NewDeviceIOService.delete(deviceId);
}

