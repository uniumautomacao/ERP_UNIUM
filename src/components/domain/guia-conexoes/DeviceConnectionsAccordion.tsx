import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Switch,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { ChevronDown24Regular, ChevronUp24Regular, Link24Regular } from '@fluentui/react-icons';
import type { GuiaDeviceIOConnection } from '../../../types/guiaConexoes';
import { connectionDirectionOptions, connectionTypeOptions } from '../../../utils/device-io/optionSetMaps';

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
  accordionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    width: '100%',
  },
  headerMeta: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  portSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    width: '100%',
    alignItems: 'center',
  },
  portMeta: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dimText: {
    color: tokens.colorNeutralForeground3,
  },
  actionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  panelCard: {
    ...shorthands.padding(tokens.spacingHorizontalM),
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

type ConnectionStatus = 'connected' | 'manual' | 'pending';

const getTypeKey = (connection: GuiaDeviceIOConnection) => {
  if (connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined) {
    return String(connection.new_tipodeconexao);
  }
  return connection.new_tipodeconexaorawtext || 'desconhecido';
};

const typeLabelMap = new Map(
  connectionTypeOptions.map((option) => [option.value, option.label])
);

const getTypeLabel = (connection: GuiaDeviceIOConnection) => {
  if (connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined) {
    return typeLabelMap.get(connection.new_tipodeconexao) ?? `Tipo ${connection.new_tipodeconexao}`;
  }
  return connection.new_tipodeconexaorawtext || 'Tipo desconhecido';
};

const getDirectionLabel = (connection: GuiaDeviceIOConnection) => {
  if (connection.new_direcao !== null && connection.new_direcao !== undefined) {
    const directionMap = new Map(
      connectionDirectionOptions.map((option) => [option.value, option.label])
    );
    return directionMap.get(connection.new_direcao) ?? `Direção ${connection.new_direcao}`;
  }
  
  return 'Direção desconhecida';
};

const getConnectionName = (connection: GuiaDeviceIOConnection) =>
  connection.new_name || connection.new_displayname || 'Conexão';

const getStatus = (connection: GuiaDeviceIOConnection): ConnectionStatus => {
  if (connection._new_connectedto_value) return 'connected';
  if (connection.new_connectedtomanual) return 'manual';
  return 'pending';
};

interface DeviceConnectionsAccordionProps {
  connections: GuiaDeviceIOConnection[];
  endpointLabels: Map<string, string>;
  endpointLoading: boolean;
  saving: boolean;
  manualDrafts: Record<string, string>;
  onManualDraftChange: (connectionId: string, value: string) => void;
  onSaveManual: (connectionId: string) => void;
  onOpenLink: (connection: GuiaDeviceIOConnection) => void;
  onClearLink: (connection: GuiaDeviceIOConnection) => void;
  onDeleteConnection: (connection: GuiaDeviceIOConnection) => void;
}

export function DeviceConnectionsAccordion({
  connections,
  endpointLabels,
  endpointLoading,
  saving,
  manualDrafts,
  onManualDraftChange,
  onSaveManual,
  onOpenLink,
  onClearLink,
  onDeleteConnection,
}: DeviceConnectionsAccordionProps) {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [openTypes, setOpenTypes] = useState<string[]>([]);
  const [openPorts, setOpenPorts] = useState<Record<string, string[]>>({});

  const filteredConnections = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return connections.filter((connection) => {
      if (pendingOnly && getStatus(connection) !== 'pending') {
        return false;
      }
      if (!normalized) return true;
      const targetLabel =
        endpointLabels.get(connection._new_connectedto_value || '') ||
        connection.new_connectedtomanual ||
        '';
      const haystack = `${getConnectionName(connection)} ${targetLabel}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [connections, endpointLabels, pendingOnly, searchTerm]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: GuiaDeviceIOConnection[] }>();
    filteredConnections.forEach((connection) => {
      const key = getTypeKey(connection);
      if (!map.has(key)) {
        map.set(key, { label: getTypeLabel(connection), items: [] });
      }
      map.get(key)?.items.push(connection);
    });
    return Array.from(map.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      items: value.items,
    }));
  }, [filteredConnections]);

  const expandAll = () => {
    const nextTypes = grouped.map((group) => group.key);
    const nextPorts: Record<string, string[]> = {};
    grouped.forEach((group) => {
      nextPorts[group.key] = group.items.map((item) => item.new_deviceioconnectionid);
    });
    setOpenTypes(nextTypes);
    setOpenPorts(nextPorts);
  };

  const collapseAll = () => {
    setOpenTypes([]);
    setOpenPorts({});
  };

  if (connections.length === 0) {
    return <Text className={styles.dimText}>Nenhuma conexão cadastrada.</Text>;
  }

  return (
    <div className={styles.section}>
      <div className={styles.filterRow}>
        <div className="flex flex-col gap-1">
          <Label>Buscar porta ou destino</Label>
          <Input
            value={searchTerm}
            onChange={(_, data) => setSearchTerm(data.value)}
            placeholder="Ex: HDMI, Speaker, Sala"
          />
        </div>
        <Switch
          checked={pendingOnly}
          onChange={(_, data) => setPendingOnly(data.checked)}
          label="Mostrar apenas pendentes"
        />
        <Button
          appearance="subtle"
          size="small"
          icon={openTypes.length > 0 ? <ChevronUp24Regular /> : <ChevronDown24Regular />}
          onClick={openTypes.length > 0 ? collapseAll : expandAll}
        >
          {openTypes.length > 0 ? 'Recolher tudo' : 'Expandir tudo'}
        </Button>
      </div>

      {endpointLoading && (
        <Text size={200} className={styles.dimText}>
          Resolvendo destinos...
        </Text>
      )}

      <Accordion
        multiple
        openItems={openTypes}
        onToggle={(_, data) => setOpenTypes(data.openItems as string[])}
        collapsible
      >
        {grouped.map((group) => {
          const completed = group.items.filter((item) => getStatus(item) !== 'pending').length;
          const pending = group.items.length - completed;
          return (
            <AccordionItem key={group.key} value={group.key}>
              <AccordionHeader>
                <div className={styles.accordionHeader}>
                  <Text weight="semibold">{group.label}</Text>
                  <div className={styles.headerMeta}>
                    <Badge appearance="outline">{completed}/{group.items.length}</Badge>
                    {pending > 0 && (
                      <Badge appearance="tint" color="danger">
                        {pending} pendente(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionHeader>
              <AccordionPanel>
                <Accordion
                  multiple
                  openItems={openPorts[group.key] ?? []}
                  onToggle={(_, data) =>
                    setOpenPorts((prev) => ({ ...prev, [group.key]: data.openItems as string[] }))
                  }
                  collapsible
                >
                  {group.items.map((connection) => {
                    const status = getStatus(connection);
                    const destination =
                      (connection._new_connectedto_value &&
                        endpointLabels.get(connection._new_connectedto_value)) ||
                      connection.new_connectedtomanual ||
                      '---';
                    const manualValue =
                      manualDrafts[connection.new_deviceioconnectionid] ??
                      connection.new_connectedtomanual ??
                      '';

                    return (
                      <AccordionItem
                        key={connection.new_deviceioconnectionid}
                        value={connection.new_deviceioconnectionid}
                      >
                        <AccordionHeader>
                          <div className={styles.portSummary}>
                            <div>
                              <Text weight="semibold">{getConnectionName(connection)}</Text>
                              <Text size={200} className={styles.dimText}>
                                {destination}
                              </Text>
                            </div>
                            <div className={styles.portMeta}>
                              <Badge appearance="outline">{getDirectionLabel(connection)}</Badge>
                              <Badge
                                appearance="tint"
                                color={
                                  status === 'pending'
                                    ? 'danger'
                                    : status === 'manual'
                                      ? 'warning'
                                      : 'success'
                                }
                              >
                                {status === 'pending'
                                  ? 'Pendente'
                                  : status === 'manual'
                                    ? 'Manual'
                                    : 'Conectado'}
                              </Badge>
                            </div>
                          </div>
                        </AccordionHeader>
                        <AccordionPanel>
                          <Card className={styles.panelCard}>
                            <div>
                              <Text size={200} className={styles.dimText}>
                                Conectado a
                              </Text>
                              <Text>{destination}</Text>
                            </div>
                            <div className={styles.actionsRow}>
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<Link24Regular />}
                                onClick={() => onOpenLink(connection)}
                                disabled={saving || !!connection._new_connectedto_value || !!connection.new_connectedtomanual}
                                title={
                                  connection._new_connectedto_value
                                    ? 'Conexão já está vinculada'
                                    : connection.new_connectedtomanual
                                      ? 'Remova o destino manual antes'
                                      : ''
                                }
                              >
                                Vincular
                              </Button>
                              <Button
                                size="small"
                                appearance="subtle"
                                onClick={() => onClearLink(connection)}
                                disabled={saving}
                              >
                                Remover vínculo
                              </Button>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label>Destino manual</Label>
                              <Input
                                value={manualValue}
                                onChange={(_, data) =>
                                  onManualDraftChange(connection.new_deviceioconnectionid, data.value)
                                }
                                disabled={!!connection._new_connectedto_value}
                                title={connection._new_connectedto_value ? 'Remova o vínculo antes de editar' : ''}
                              />
                              <div className={styles.actionsRow}>
                                <Button
                                  size="small"
                                  appearance="primary"
                                  onClick={() => onSaveManual(connection.new_deviceioconnectionid)}
                                  disabled={saving || !!connection._new_connectedto_value}
                                >
                                  Salvar destino manual
                                </Button>
                                <Button
                                  size="small"
                                  appearance="subtle"
                                  onClick={() => onDeleteConnection(connection)}
                                  disabled={saving || !!connection._new_connectedto_value}
                                  title={connection._new_connectedto_value ? 'Remova o vínculo antes de excluir' : ''}
                                >
                                  Excluir conexão
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </AccordionPanel>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
