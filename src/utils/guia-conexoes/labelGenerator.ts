import type { GuiaDeviceIO, GuiaDeviceIOConnection } from '../../types/guiaConexoes';

const DIRECTION = {
  Input: 100000000,
  Output: 100000001,
  Bidirectional: 100000002,
  Bus: 100000003,
};

const CONNECTION_TYPE = {
  Speaker: 100000004,
};

export interface ConnectionLabel {
  id: string;
  origin: string;
  destination: string;
  isValid: boolean;
}

interface IndexedConnection {
  connectionId: string;
  rootConnectionId: string;
}

/**
 * Substitui vírgulas por pontos em um texto
 */
const replaceCommas = (text: string): string => text.replace(/,/g, '.');

/**
 * Constrói o índice de conexões para lógica de Speaker
 * Mapeia cada conexão para sua root connection
 */
export function buildConnectionIndex(
  connections: GuiaDeviceIOConnection[]
): Map<string, IndexedConnection> {
  const index = new Map<string, IndexedConnection>();
  const speakerConnections = connections.filter(
    (conn) =>
      conn.new_tipodeconexao === CONNECTION_TYPE.Speaker &&
      conn.new_direcao === DIRECTION.Output &&
      conn._new_connectedto_value
  );

  // Para cada speaker output, mapear todas as conexões conectadas a ele
  speakerConnections.forEach((rootConn) => {
    const rootId = rootConn.new_deviceioconnectionid;
    
    // Encontrar todas as conexões que apontam para esta root
    connections.forEach((conn) => {
      if (
        conn._new_connectedto_value === rootId &&
        conn.new_tipodeconexao === CONNECTION_TYPE.Speaker
      ) {
        index.set(conn.new_deviceioconnectionid, {
          connectionId: conn.new_deviceioconnectionid,
          rootConnectionId: rootId,
        });
      }
    });
    
    // A própria root também é mapeada
    index.set(rootId, {
      connectionId: rootId,
      rootConnectionId: rootId,
    });
  });

  return index;
}

/**
 * Verifica se uma conexão é um root speaker (tem outros speakers conectados a ela)
 */
function isRootSpeaker(
  connection: GuiaDeviceIOConnection,
  index: Map<string, IndexedConnection>,
  connections: GuiaDeviceIOConnection[]
): boolean {
  if (
    connection.new_tipodeconexao !== CONNECTION_TYPE.Speaker ||
    connection.new_direcao !== DIRECTION.Output
  ) {
    return false;
  }

  const connectionId = connection.new_deviceioconnectionid;
  
  // Verifica se existem outras conexões que têm esta como root
  const hasChildren = connections.some(
    (conn) =>
      conn.new_deviceioconnectionid !== connectionId &&
      index.get(conn.new_deviceioconnectionid)?.rootConnectionId === connectionId
  );

  return hasChildren;
}

/**
 * Obtém os nomes dos dispositivos conectados a um root speaker
 */
function getRootSpeakerNeighborDevices(
  rootConnectionId: string,
  index: Map<string, IndexedConnection>,
  connections: GuiaDeviceIOConnection[],
  deviceMap: Map<string, GuiaDeviceIO>
): string {
  const neighborDeviceNames = new Set<string>();

  // Encontrar todas as conexões que têm este root
  connections.forEach((conn) => {
    const indexed = index.get(conn.new_deviceioconnectionid);
    if (
      indexed?.rootConnectionId === rootConnectionId &&
      conn.new_deviceioconnectionid !== rootConnectionId
    ) {
      const deviceId = conn._new_device_value;
      if (deviceId) {
        const device = deviceMap.get(deviceId);
        if (device?.new_name) {
          neighborDeviceNames.add(device.new_name);
        }
      }
    }
  });

  return Array.from(neighborDeviceNames).join('+');
}

/**
 * Gera a etiqueta de uma conexão
 */
export function generateConnectionLabel(
  connection: GuiaDeviceIOConnection,
  connectionsById: Map<string, GuiaDeviceIOConnection>,
  deviceMap: Map<string, GuiaDeviceIO>,
  connectionIndex?: Map<string, IndexedConnection>
): ConnectionLabel {
  const connectionId = connection.new_deviceioconnectionid;
  const deviceId = connection._new_device_value;
  const device = deviceId ? deviceMap.get(deviceId) : null;

  // Linha 1: Origem
  const deviceName = device?.new_name || 'Equipamento';
  const connectionName = connection.new_name || connection.new_displayname || 'Porta';
  const origin = replaceCommas(`${deviceName} - ${connectionName}`);

  // Verificar se a conexão tem destino
  const hasConnectedTo = !!connection._new_connectedto_value;
  const hasManualConnection = !!(
    connection.new_connectedtomanual &&
    connection.new_connectedtomanual.trim().length > 0
  );

  if (!hasConnectedTo && !hasManualConnection) {
    return {
      id: connectionId,
      origin,
      destination: '',
      isValid: false,
    };
  }

  // Verificar se é Speaker Output não-root (deve ser filtrado)
  if (
    connection.new_tipodeconexao === CONNECTION_TYPE.Speaker &&
    connection.new_direcao === DIRECTION.Output &&
    connectionIndex
  ) {
    const isRoot = isRootSpeaker(connection, connectionIndex, Array.from(connectionsById.values()));
    const isInIndex = connectionIndex.has(connectionId);
    
    if (isInIndex && !isRoot) {
      // Speaker Output que não é root: não deve imprimir
      return {
        id: connectionId,
        origin,
        destination: '',
        isValid: false,
      };
    }
  }

  let destination = '';

  // Linha 2: Destino
  if (!hasConnectedTo) {
    // Usa conexão manual
    destination = replaceCommas(connection.new_connectedtomanual || '');
  } else if (
    connection.new_tipodeconexao === CONNECTION_TYPE.Speaker &&
    connection.new_direcao === DIRECTION.Input &&
    connectionIndex
  ) {
    // Speaker Input: buscar info do root
    const indexed = connectionIndex.get(connectionId);
    if (indexed && indexed.rootConnectionId !== connectionId) {
      const rootConnection = connectionsById.get(indexed.rootConnectionId);
      if (rootConnection) {
        const rootDeviceId = rootConnection._new_device_value;
        const rootDevice = rootDeviceId ? deviceMap.get(rootDeviceId) : null;
        const rootDeviceName = rootDevice?.new_name || 'Equipamento';
        const rootConnectionName = rootConnection.new_name || rootConnection.new_displayname || 'Porta';
        const rootLocation = rootConnection.new_localizacao || '';
        
        destination = replaceCommas(
          `${rootDeviceName} - ${rootConnectionName}${rootLocation ? ' | ' + rootLocation : ''}`
        );
      }
    }
  } else if (
    connection.new_tipodeconexao === CONNECTION_TYPE.Speaker &&
    connection.new_direcao === DIRECTION.Output &&
    connectionIndex
  ) {
    // Speaker Output root: concatenar vizinhos
    const isRoot = isRootSpeaker(connection, connectionIndex, Array.from(connectionsById.values()));
    if (isRoot) {
      const neighborDevices = getRootSpeakerNeighborDevices(
        connectionId,
        connectionIndex,
        Array.from(connectionsById.values()),
        deviceMap
      );
      destination = neighborDevices || 'Sem vizinhos';
    }
  }

  // Caso padrão: conexão normal
  if (!destination && hasConnectedTo) {
    const targetConnection = connectionsById.get(connection._new_connectedto_value!);
    if (targetConnection) {
      const targetDeviceId = targetConnection._new_device_value;
      const targetDevice = targetDeviceId ? deviceMap.get(targetDeviceId) : null;
      const targetDeviceName = targetDevice?.new_name || 'Equipamento';
      const targetConnectionName =
        targetConnection.new_name || targetConnection.new_displayname || 'Porta';
      const targetLocation = targetConnection.new_localizacao || '';

      destination = replaceCommas(
        `${targetDeviceName} - ${targetConnectionName}${targetLocation ? ' | ' + targetLocation : ''}`
      );
    }
  }

  return {
    id: connectionId,
    origin,
    destination,
    isValid: destination.length > 0,
  };
}

/**
 * Gera etiquetas para múltiplas conexões
 */
export function generateConnectionLabels(
  connections: GuiaDeviceIOConnection[],
  connectionsById: Map<string, GuiaDeviceIOConnection>,
  deviceMap: Map<string, GuiaDeviceIO>
): ConnectionLabel[] {
  const connectionIndex = buildConnectionIndex(Array.from(connectionsById.values()));
  
  return connections.map((connection) =>
    generateConnectionLabel(connection, connectionsById, deviceMap, connectionIndex)
  );
}

/**
 * Faz o download de um arquivo TXT com as etiquetas
 */
export function downloadLabelsFile(
  labels: ConnectionLabel[],
  filename?: string,
  projectName?: string
): void {
  const validLabels = labels.filter((l) => l.isValid);
  
  if (validLabels.length === 0) {
    throw new Error('Nenhuma etiqueta válida para imprimir');
  }

  const content = validLabels
    .map(
      (label, i) =>
        `=== ETIQUETA ${i + 1} ===\nORIGEM: ${label.origin}\nDESTINO: ${label.destination}\n`
    )
    .join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Nome do arquivo
  const date = new Date().toISOString().split('T')[0];
  const projectPrefix = projectName ? `${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-` : '';
  a.download = filename || `etiquetas-${projectPrefix}${date}.txt`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
