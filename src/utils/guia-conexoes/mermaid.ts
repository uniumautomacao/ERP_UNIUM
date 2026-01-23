import type {
  GuiaDeviceIO,
  GuiaDeviceIOConnection,
  GuiaModeloProduto,
} from '../../types/guiaConexoes';

const sanitizeMermaidId = (value: string) =>
  value.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');

const getDeviceName = (device: GuiaDeviceIO) => device.new_name || 'Sem nome';

const getModelName = (device: GuiaDeviceIO, modelosMap: Map<string, GuiaModeloProduto>) => {
  if (!device._new_modelodeproduto_value) return '';
  const model = modelosMap.get(device._new_modelodeproduto_value);
  return model?.cr22f_title ? `(${model.cr22f_title})` : '';
};

const getConnectionPort = (conn: GuiaDeviceIOConnection) =>
  conn.new_displayname || conn.new_name || 'Porta';

const getConnectionType = (conn: GuiaDeviceIOConnection) =>
  conn.new_tipodeconexaorawtext ||
  (conn.new_tipodeconexao ? `Tipo ${conn.new_tipodeconexao}` : 'Conexão');

export const generateMermaidGraph = (
  devices: GuiaDeviceIO[],
  connections: GuiaDeviceIOConnection[],
  modelosMap: Map<string, GuiaModeloProduto>,
  rootDeviceId?: string
) => {
  const lines: string[] = [
    "%%{init: {'flowchart': {'rankSpacing': 190, 'nodeSpacing':40, 'curve': 'linear','defaultRenderer': 'elk'}} }%%",
    'graph LR',
  ];

  const deviceMap = new Map<string, GuiaDeviceIO>();
  devices.forEach((device) => deviceMap.set(device.new_deviceioid, device));

  const connectionMap = new Map<string, GuiaDeviceIOConnection>();
  connections.forEach((conn) =>
    connectionMap.set(conn.new_deviceioconnectionid, conn)
  );

  // Group devices by location
  const locations = new Map<string, GuiaDeviceIO[]>();
  devices.forEach((device) => {
    const location = device.new_localizacao?.trim() || 'Sem Localização';
    const list = locations.get(location) ?? [];
    list.push(device);
    locations.set(location, list);
  });

  // Generate Subgraphs
  locations.forEach((list, location) => {
    const groupId = sanitizeMermaidId(location);
    lines.push(`    subgraph ${groupId}["${location}"]`);
    list.forEach((device) => {
      const id = sanitizeMermaidId(device.new_deviceioid);
      const name = getDeviceName(device);
      const model = getModelName(device, modelosMap);
      // Format: ID["Name (Model)"]
      const label = model ? `${name} ${model}` : name;
      lines.push(`        ${id}["${label}"]`);
    });
    lines.push('    end');
  });

  // Generate Edges
  const processedEdges = new Set<string>();

  connections.forEach((conn) => {
    // Only process connections that have a target
    if (!conn._new_connectedto_value) return;

    const fromDevice = conn._new_device_value
      ? deviceMap.get(conn._new_device_value)
      : null;
    
    // Find the target connection
    const targetConn = connectionMap.get(conn._new_connectedto_value);
    const toDevice = targetConn?._new_device_value
      ? deviceMap.get(targetConn._new_device_value)
      : null;

    if (!fromDevice || !toDevice) return;

    // Ensure we only draw the edge once (A -> B or B -> A)
    // We sort IDs to create a unique key for the pair
    const id1 = fromDevice.new_deviceioid;
    const id2 = toDevice.new_deviceioid;
    
    // Create a unique key for this specific connection pair to avoid duplicates
    // But we need to capture the specific ports used.
    // If there are multiple cables between same devices, we want multiple lines?
    // The template shows: 
    // 119dd... -- "TL-ER605 (01) <-> Eth4-Eth5 (Uplink)"---f3a77...
    
    // We'll use the connection ID as part of the uniqueness check if we want to be strict,
    // but typically we want to avoid processing the "reverse" connection if it's the same physical link.
    // However, in this data model, the link is represented by two connection records pointing to each other.
    
    const edgeKey = [conn.new_deviceioconnectionid, conn._new_connectedto_value].sort().join('-');
    if (processedEdges.has(edgeKey)) return;
    processedEdges.add(edgeKey);

    const fromId = sanitizeMermaidId(fromDevice.new_deviceioid);
    const toId = sanitizeMermaidId(toDevice.new_deviceioid);

    const fromName = getDeviceName(fromDevice);
    const fromModel = getModelName(fromDevice, modelosMap);
    const fromLabel = fromModel ? `${fromName} ${fromModel}` : fromName;

    const fromPort = getConnectionPort(conn);
    const toPort = targetConn ? getConnectionPort(targetConn) : 'Unknown';
    const type = getConnectionType(conn);

    // Label format: "SourceDeviceName (SourceModel) <-> SourcePort-TargetPort (Type)"
    const edgeLabel = `${fromLabel} <-> ${fromPort}-${toPort} (${type})`;

    lines.push(`    ${fromId} -- "${edgeLabel}" --- ${toId};`);
  });

  return lines.join('\n');
};
