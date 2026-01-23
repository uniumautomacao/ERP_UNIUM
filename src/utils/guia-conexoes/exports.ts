import type {
  GuiaDeviceIO,
  GuiaDeviceIOConnection,
  GuiaModeloProduto,
} from '../../types/guiaConexoes';

const SPEAKER_TYPE = 100000004;
const DIRECTION_INPUT = 100000000;
const DIRECTION_OUTPUT = 100000001;

const escapeCsv = (value: string) => value.replace(/"/g, '""');

const csvLine = (values: string[]) =>
  values.map((value) => `"${escapeCsv(value)}"`).join(',');

const getConnectionDisplayName = (connection: GuiaDeviceIOConnection) =>
  connection.new_name || connection.new_displayname || 'Conexão';

const getDeviceName = (device: GuiaDeviceIO) => device.new_name || 'Sem nome';

const buildSpeakerRoots = (connections: GuiaDeviceIOConnection[]) => {
  const speakers = connections.filter(
    (conn) => conn.new_tipodeconexao === SPEAKER_TYPE && !!conn._new_connectedto_value
  );

  const adjacency = new Map<string, Set<string>>();
  speakers.forEach((conn) => {
    const id = conn.new_deviceioconnectionid;
    const other = conn._new_connectedto_value;
    if (!other) return;
    if (!adjacency.has(id)) adjacency.set(id, new Set());
    if (!adjacency.has(other)) adjacency.set(other, new Set());
    adjacency.get(id)?.add(other);
    adjacency.get(other)?.add(id);
  });

  const visited = new Set<string>();
  const rootById = new Map<string, string>();

  const pickRoot = (component: string[]) => {
    const outputs = component.filter((id) => {
      const conn = speakers.find((item) => item.new_deviceioconnectionid === id);
      return conn?.new_direcao === DIRECTION_OUTPUT;
    });
    return outputs[0] ?? component[0];
  };

  for (const node of adjacency.keys()) {
    if (visited.has(node)) continue;
    const stack = [node];
    const component: string[] = [];
    visited.add(node);
    while (stack.length) {
      const current = stack.pop()!;
      component.push(current);
      adjacency.get(current)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      });
    }
    const root = pickRoot(component);
    component.forEach((id) => rootById.set(id, root));
  }

  return rootById;
};

export const buildCsvConexoes = (
  devices: GuiaDeviceIO[],
  connections: GuiaDeviceIOConnection[],
  projectLabel: string
) => {
  const deviceMap = new Map<string, GuiaDeviceIO>();
  devices.forEach((device) => deviceMap.set(device.new_deviceioid, device));

  const roots = buildSpeakerRoots(connections);
  const connectionMap = new Map<string, GuiaDeviceIOConnection>();
  connections.forEach((conn) => connectionMap.set(conn.new_deviceioconnectionid, conn));

  const rows: string[] = [];
  rows.push(csvLine(['Texto', 'Texto B', 'Nome do Projeto', 'Created On']));

  connections.forEach((conn) => {
    const hasTarget = !!conn._new_connectedto_value || !!conn.new_connectedtomanual;
    if (!hasTarget) return;

    if (conn.new_tipodeconexao === SPEAKER_TYPE && conn.new_direcao === DIRECTION_OUTPUT) {
      const root = roots.get(conn.new_deviceioconnectionid);
      if (root && root !== conn.new_deviceioconnectionid) {
        return;
      }
    }

    const device = conn._new_device_value ? deviceMap.get(conn._new_device_value) : null;
    if (!device) return;

    const fromLabel = `${getDeviceName(device)} - ${getConnectionDisplayName(conn)}`;
    let toLabel = conn.new_connectedtomanual || '';

    if (!toLabel && conn._new_connectedto_value) {
      const target = connectionMap.get(conn._new_connectedto_value);
      if (target) {
        const targetDevice = target._new_device_value
          ? deviceMap.get(target._new_device_value)
          : null;
        if (conn.new_tipodeconexao === SPEAKER_TYPE && conn.new_direcao === DIRECTION_INPUT) {
          const root = roots.get(conn.new_deviceioconnectionid);
          const rootConn = root ? connectionMap.get(root) : null;
          const rootDevice =
            rootConn && rootConn._new_device_value
              ? deviceMap.get(rootConn._new_device_value)
              : null;
          if (rootConn && rootDevice) {
            toLabel = `${getDeviceName(rootDevice)} - ${getConnectionDisplayName(
              rootConn
            )} | ${rootConn.new_localizacao ?? ''}`;
          }
        }

        if (!toLabel && targetDevice) {
          toLabel = `${getDeviceName(targetDevice)} - ${getConnectionDisplayName(
            target
          )} | ${target.new_localizacao ?? ''}`;
        }
      }
    }

    if (conn.new_tipodeconexao === SPEAKER_TYPE && conn.new_direcao === DIRECTION_OUTPUT) {
      const root = roots.get(conn.new_deviceioconnectionid);
      if (root === conn.new_deviceioconnectionid) {
        const group = Array.from(connectionMap.values()).filter(
          (item) => roots.get(item.new_deviceioconnectionid) === root
        );
        const devicesLabel = group
          .map((item) =>
            item._new_device_value
              ? deviceMap.get(item._new_device_value)?.new_name
              : null
          )
          .filter(Boolean)
          .join('+');
        if (devicesLabel) {
          toLabel = devicesLabel;
        }
      }
    }

    rows.push(csvLine([fromLabel, toLabel || '', projectLabel || '', '']));
  });

  return rows.join('\n');
};

export const buildCsvEquipamentos = (devices: GuiaDeviceIO[], projectLabel: string) => {
  const rows: string[] = [];
  rows.push(csvLine(['Texto', 'Texto B', 'Nome do Projeto', 'Created On']));
  devices.forEach((device) => {
    rows.push(csvLine([getDeviceName(device), '', projectLabel || '', '']));
  });
  return rows.join('\n');
};

const sanitizeMermaidId = (value: string) =>
  value.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');

export const buildMermaidDiagram = (
  devices: GuiaDeviceIO[],
  connections: GuiaDeviceIOConnection[]
) => {
  const lines: string[] = ['flowchart LR'];
  const deviceMap = new Map<string, GuiaDeviceIO>();
  devices.forEach((device) => deviceMap.set(device.new_deviceioid, device));

  const locations = new Map<string, GuiaDeviceIO[]>();
  devices.forEach((device) => {
    const location = device.new_localizacao?.trim() || 'Sem Localização';
    const list = locations.get(location) ?? [];
    list.push(device);
    locations.set(location, list);
  });

  locations.forEach((list, location) => {
    const groupId = sanitizeMermaidId(location);
    lines.push(`subgraph ${groupId}["${location}"]`);
    list.forEach((device) => {
      const id = sanitizeMermaidId(device.new_deviceioid);
      lines.push(`  ${id}["${getDeviceName(device)}"]`);
    });
    lines.push('end');
  });

  connections.forEach((conn) => {
    if (!conn._new_connectedto_value) return;
    const fromDevice = conn._new_device_value ? deviceMap.get(conn._new_device_value) : null;
    const toConn = connections.find((item) => item.new_deviceioconnectionid === conn._new_connectedto_value);
    const toDevice = toConn?._new_device_value ? deviceMap.get(toConn._new_device_value) : null;
    if (!fromDevice || !toDevice) return;
    const fromId = sanitizeMermaidId(fromDevice.new_deviceioid);
    const toId = sanitizeMermaidId(toDevice.new_deviceioid);
    lines.push(`${fromId} --> ${toId}`);
  });

  return lines.join('\n');
};

export const buildReportHtml = (
  devices: GuiaDeviceIO[],
  connections: GuiaDeviceIOConnection[],
  projectLabel: string,
  modelosMap: Map<string, GuiaModeloProduto>
) => {
  const deviceMap = new Map<string, GuiaDeviceIO>();
  devices.forEach((device) => deviceMap.set(device.new_deviceioid, device));

  const grouped: Record<string, GuiaDeviceIOConnection[]> = {};
  connections.forEach((conn) => {
    if (!conn._new_device_value) return;
    const key = conn._new_device_value;
    grouped[key] = grouped[key] ?? [];
    grouped[key].push(conn);
  });

  const sections = devices.map((device) => {
    const model = device._new_modelodeproduto_value
      ? modelosMap.get(device._new_modelodeproduto_value)
      : null;
    const deviceConnections = grouped[device.new_deviceioid] ?? [];
    const rows = deviceConnections
      .map((conn) => {
        const connectedLabel = conn.new_connectedtomanual || conn._new_connectedto_value || '';
        return `<tr><td>${getConnectionDisplayName(conn)}</td><td>${connectedLabel}</td></tr>`;
      })
      .join('');
    return `
      <section>
        <h3>${getDeviceName(device)}</h3>
        <p>${model?.cr22f_title ?? ''} · ${device.new_localizacao ?? ''}</p>
        <table>
          <thead><tr><th>Conexão</th><th>Destino</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    `;
  });

  return `
    <html>
      <head>
        <title>Relatório Guia de Conexões</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          h1 { margin-bottom: 8px; }
          section { margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Guia de Conexões</h1>
        <p>${projectLabel}</p>
        ${sections.join('')}
      </body>
    </html>
  `;
};
