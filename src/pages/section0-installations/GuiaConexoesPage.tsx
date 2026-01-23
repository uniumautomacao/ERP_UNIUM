import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Field,
  Input,
  Label,
  Option,
  Switch,
  Tab,
  TabList,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowSync24Regular,
  ClipboardTask24Regular,
  Delete24Regular,
  Flowchart24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataGrid, createTableColumn } from '../../components/shared/DataGrid';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingState } from '../../components/shared/LoadingState';
import { SearchableCombobox } from '../../components/shared/SearchableCombobox';
import { DeviceDetailDialog } from '../../components/domain/guia-conexoes/DeviceDetailDialog';
import { GerarPendenciasDialog } from '../../components/domain/guia-conexoes/GerarPendenciasDialog';
import { NovoEquipamentoDialog } from '../../components/domain/guia-conexoes/NovoEquipamentoDialog';
import { NewDeviceIOService } from '../../generated';
import { useGuiaConexoesData } from '../../hooks/guia-conexoes/useGuiaConexoesData';
import type {
  GuiaDeviceIO,
  GuiaDeviceIOConnection,
  GuiaModeloProduto,
  GuiaProdutoServico,
} from '../../types/guiaConexoes';
import { resolveErrorMessage } from '../../utils/guia-conexoes/errors';
import { SISTEMA_TIPO_LABELS } from '../../utils/guia-conexoes/systemTypes';
import { escapeODataValue } from '../../utils/guia-conexoes/odata';
import { deleteDeviceWithConnections } from '../../utils/guia-conexoes/deleteDevice';
import {
  generateMermaidGraph,
} from '../../utils/guia-conexoes/mermaid';
import { RootDeviceSelectionDialog } from '../../components/domain/guia-conexoes/RootDeviceSelectionDialog';
import { DiagramModal } from '../../components/domain/guia-conexoes/DiagramModal';
import { Cr22fProjetoService } from '../../generated/services/Cr22fProjetoService';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  filtersRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
  },
  tabList: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tableWrapper: {
    display: 'none',
    '@media (min-width: 900px)': {
      display: 'block',
    },
    '& .fui-DataGridHeaderCell': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    },
    '& .fui-DataGridCell': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    },
    '& .fui-DataGridRow': {
      minHeight: '52px',
    },
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    '@media (min-width: 900px)': {
      display: 'none',
    },
  },
  deviceCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  dimText: {
    color: tokens.colorNeutralForeground3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
});

type GroupByMode = 'system' | 'location' | 'connection' | 'all';

type TabOption = {
  value: string;
  label: string;
};

type DeviceRow = {
  device: GuiaDeviceIO;
  model?: GuiaModeloProduto;
  produto?: GuiaProdutoServico;
  connections: GuiaDeviceIOConnection[];
  completedConnections: number;
};

type ProjectSearchRecord = {
  cr22f_projetoid: string;
  cr22f_apelido?: string | null;
  cr22f_ano?: string | null;
};

const GROUP_BY_OPTIONS: { value: GroupByMode; label: string }[] = [
  { value: 'system', label: 'Agrupar por Sistema' },
  { value: 'location', label: 'Agrupar por Localização' },
  { value: 'connection', label: 'Agrupar por Conexão' },
  { value: 'all', label: 'Mostrar Todos os Dispositivos' },
];

const EMPTY_LOCATION = 'Sem Localização';

const formatProjectLabel = (project: ProjectSearchRecord) => {
  const parts = [project.cr22f_apelido, project.cr22f_ano].filter(Boolean);
  return parts.join(' · ') || 'Projeto';
};

export function GuiaConexoesPage() {
  const styles = useStyles();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectLabel, setSelectedProjectLabel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByMode>('system');
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailDeviceId, setDetailDeviceId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);
  const [pendenciasOpen, setPendenciasOpen] = useState(false);
  const [rootSelectionOpen, setRootSelectionOpen] = useState(false);
  const [diagramModalOpen, setDiagramModalOpen] = useState(false);
  const [currentDiagramCode, setCurrentDiagramCode] = useState('');
  const [selectedDeviceRows, setSelectedDeviceRows] = useState<DeviceRow[]>([]);

  const { devices, connections, produtos, modelos, loading, error, reload, updateDevice } =
    useGuiaConexoesData(selectedProjectId, searchTerm);

  const modelosMap = useMemo(() => {
    const map = new Map<string, GuiaModeloProduto>();
    modelos.forEach((modelo) => {
      map.set(modelo.cr22f_modelosdeprodutofromsharepointlistid, modelo);
    });
    return map;
  }, [modelos]);

  const produtosMap = useMemo(() => {
    const map = new Map<string, GuiaProdutoServico>();
    produtos.forEach((produto) => {
      map.set(produto.new_produtoservicoid, produto);
    });
    return map;
  }, [produtos]);

  const connectionsByDevice = useMemo(() => {
    const map = new Map<string, GuiaDeviceIOConnection[]>();
    connections.forEach((connection) => {
      const deviceId = connection._new_device_value;
      if (!deviceId) return;
      const list = map.get(deviceId) ?? [];
      list.push(connection);
      map.set(deviceId, list);
    });
    return map;
  }, [connections]);

  const connectionTypeMap = useMemo(() => {
    const deviceMap = new Map<string, Set<string>>();
    const labelMap = new Map<string, string>();

    connections.forEach((connection) => {
      const deviceId = connection._new_device_value;
      if (!deviceId) return;

      const key =
        connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined
          ? String(connection.new_tipodeconexao)
          : connection.new_tipodeconexaorawtext || 'desconhecido';

      if (!deviceMap.has(key)) {
        deviceMap.set(key, new Set<string>());
      }
      deviceMap.get(key)?.add(deviceId);

      if (!labelMap.has(key)) {
        labelMap.set(
          key,
          connection.new_tipodeconexaorawtext ||
            (connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined
              ? `Tipo ${connection.new_tipodeconexao}`
              : 'Tipo desconhecido')
        );
      }
    });

    return { deviceMap, labelMap };
  }, [connections]);

  const tabOptions = useMemo<TabOption[]>(() => {
    if (groupBy === 'all') {
      return [{ value: 'all', label: 'Todos' }];
    }

    if (groupBy === 'system') {
      const map = new Map<number, string>();
      devices.forEach((device) => {
        const modelId = device._new_modelodeproduto_value;
        const systemType = modelId ? modelosMap.get(modelId)?.new_tipodesistemapadrao : null;
        if (systemType === null || systemType === undefined) return;
        map.set(systemType, SISTEMA_TIPO_LABELS.get(systemType) ?? String(systemType));
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value: String(value), label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    if (groupBy === 'location') {
      const map = new Map<string, string>();
      devices.forEach((device) => {
        const raw = device.new_localizacao?.trim();
        const location = raw ? raw : EMPTY_LOCATION;
        map.set(location, location);
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return Array.from(connectionTypeMap.labelMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [connectionTypeMap.labelMap, devices, groupBy, modelosMap]);

  useEffect(() => {
    if (tabOptions.length === 0) {
      setSelectedTab('all');
      return;
    }

    const exists = tabOptions.some((tab) => tab.value === selectedTab);
    if (!exists) {
      setSelectedTab(tabOptions[0].value);
    }
  }, [selectedTab, tabOptions]);

  const visibleDevices = useMemo(() => {
    if (groupBy === 'all') {
      return devices;
    }

    if (groupBy === 'system') {
      return devices.filter((device) => {
        const modelId = device._new_modelodeproduto_value;
        const systemType = modelId ? modelosMap.get(modelId)?.new_tipodesistemapadrao : null;
        return systemType !== null && String(systemType) === selectedTab;
      });
    }

    if (groupBy === 'location') {
      return devices.filter((device) => {
        const raw = device.new_localizacao?.trim();
        const location = raw ? raw : EMPTY_LOCATION;
        return location === selectedTab;
      });
    }

    const deviceSet = connectionTypeMap.deviceMap.get(selectedTab);
    if (!deviceSet) {
      return [];
    }
    return devices.filter((device) => deviceSet.has(device.new_deviceioid));
  }, [connectionTypeMap.deviceMap, devices, groupBy, modelosMap, selectedTab]);

  const deviceRows = useMemo<DeviceRow[]>(() => {
    return visibleDevices.map((device) => {
      const model = device._new_modelodeproduto_value
        ? modelosMap.get(device._new_modelodeproduto_value)
        : undefined;
      const produto = device._new_produto_value
        ? produtosMap.get(device._new_produto_value)
        : undefined;
      const deviceConnections = connectionsByDevice.get(device.new_deviceioid) ?? [];
      const completedConnections = deviceConnections.filter(
        (connection) => !!connection._new_connectedto_value || !!connection.new_connectedtomanual
      ).length;

      return {
        device,
        model,
        produto,
        connections: deviceConnections,
        completedConnections,
      };
    });
  }, [connectionsByDevice, modelosMap, produtosMap, visibleDevices]);

  const visibleDeviceIds = useMemo(
    () => new Set(visibleDevices.map((device) => device.new_deviceioid)),
    [visibleDevices]
  );

  const visibleConnections = useMemo(
    () =>
      connections.filter(
        (connection) =>
          connection._new_device_value && visibleDeviceIds.has(connection._new_device_value)
      ),
    [connections, visibleDeviceIds]
  );

  const handleToggleInstall = useCallback(
    async (deviceId: string, value: boolean) => {
      setToggleBusyId(deviceId);
      setActionError(null);
      try {
        const result = await NewDeviceIOService.update(deviceId, {
          new_serainstaladobase: value,
        });

        if (!result.success) {
          throw new Error(
            resolveErrorMessage(result.error, 'Falha ao atualizar o status.')
          );
        }

        // Atualizar apenas o dispositivo local em vez de recarregar tudo
        updateDevice(deviceId, { new_serainstaladobase: value });
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'Falha ao atualizar o status.'));
      } finally {
        setToggleBusyId(null);
      }
    },
    [updateDevice]
  );

  const handleOpenDetails = useCallback((deviceId: string) => {
    setDetailDeviceId(deviceId);
    setDetailOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailOpen(false);
    setDetailDeviceId(null);
  }, []);

  const searchProjects = useCallback(async (term: string) => {
    const normalized = term.trim();
    const filter =
      normalized.length >= 2
        ? `statecode eq 0 and contains(cr22f_apelido, '${escapeODataValue(normalized)}')`
        : 'statecode eq 0';

    const result = await Cr22fProjetoService.getAll({
      select: ['cr22f_projetoid', 'cr22f_apelido', 'cr22f_ano'],
      filter,
      orderBy: ['cr22f_apelido asc'],
      top: 50,
    });

    if (!result.success || !result.data) {
      return [];
    }

    return (result.data as ProjectSearchRecord[])
      .filter((item) => item.cr22f_projetoid)
      .map((item) => ({
        id: item.cr22f_projetoid,
        label: formatProjectLabel(item),
      }));
  }, []);

  const downloadText = useCallback((content: string, filename: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleMermaid = useCallback(() => {
    setRootSelectionOpen(true);
  }, []);

  const handleRootSelected = useCallback(
    (rootDeviceId: string) => {
      const diagram = generateMermaidGraph(
        devices,
        connections,
        modelosMap,
        rootDeviceId
      );
      setCurrentDiagramCode(diagram);
      setDiagramModalOpen(true);
    },
    [modelosMap, visibleConnections, visibleDevices]
  );

  const handleBulkDelete = useCallback(async () => {
    if (!selectedProjectId) return;
    if (selectedDeviceRows.length === 0) return;

    const confirm = window.confirm(
      `Deseja apagar ${selectedDeviceRows.length} equipamento(s) selecionado(s) e suas conexões?\n\n` +
        `Isso também desfaz vínculos das conexões antes de apagar.`
    );
    if (!confirm) return;

    setBulkDeleting(true);
    setBulkStatus(null);
    setActionError(null);
    try {
      const failures: string[] = [];
      for (let i = 0; i < selectedDeviceRows.length; i += 1) {
        const row = selectedDeviceRows[i];
        const id = row.device.new_deviceioid;
        const label = row.device.new_name || id;
        setBulkStatus(`Apagando ${i + 1}/${selectedDeviceRows.length}: ${label}`);
        try {
          await deleteDeviceWithConnections(id);
        } catch (err) {
          failures.push(`${label}: ${resolveErrorMessage(err, 'Erro desconhecido')}`);
        }
      }

      if (failures.length > 0) {
        setActionError(
          `Falha ao apagar ${failures.length} item(ns): ${failures.join(' | ')}`
        );
      }

      setSelectedDeviceRows([]);
      await reload();
    } finally {
      setBulkDeleting(false);
      setBulkStatus(null);
    }
  }, [reload, selectedDeviceRows, selectedProjectId]);

  const actionsDisabled = !selectedProjectId || loading;
  const bulkDeleteDisabled =
    actionsDisabled || bulkDeleting || selectedDeviceRows.length === 0;

  const primaryActions = [
    {
      id: 'novo-device',
      label: 'Novo equipamento',
      icon: <Add24Regular />,
      onClick: () => setNovoOpen(true),
      appearance: 'primary' as const,
      disabled: actionsDisabled,
    },
    {
      id: 'pendencias',
      label: 'Gerar pendências',
      icon: <ClipboardTask24Regular />,
      onClick: () => setPendenciasOpen(true),
      disabled: actionsDisabled,
    },
  ];

  const secondaryActions = [
    {
      id: 'apagar-selecionados',
      label: `Apagar selecionados (${selectedDeviceRows.length})`,
      icon: <Delete24Regular />,
      onClick: handleBulkDelete,
      disabled: bulkDeleteDisabled,
    },
    {
      id: 'atualizar',
      label: 'Atualizar',
      icon: <ArrowSync24Regular />,
      onClick: reload,
      disabled: !selectedProjectId,
    },
    {
      id: 'mermaid',
      label: 'Diagrama Mermaid',
      icon: <Flowchart24Regular />,
      onClick: handleMermaid,
      disabled: actionsDisabled,
    },
  ];

  const columns = useMemo(
    () => [
      createTableColumn<DeviceRow>({
        columnId: 'name',
        renderHeaderCell: () => 'Equipamento',
        renderCell: (item) => (
          <div>
            <Text weight="semibold">{item.device.new_name || 'Sem nome'}</Text>
            <div className={styles.dimText}>
              {item.model?.cr22f_title || 'Modelo não informado'}
            </div>
          </div>
        ),
      }),
      createTableColumn<DeviceRow>({
        columnId: 'localizacao',
        renderHeaderCell: () => 'Localização',
        renderCell: (item) =>
          item.device.new_localizacao?.trim() ? item.device.new_localizacao : EMPTY_LOCATION,
      }),
      createTableColumn<DeviceRow>({
        columnId: 'conexoes',
        renderHeaderCell: () => 'Conexões',
        renderCell: (item) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Badge
              appearance="outline"
              color="informative"
              className={styles.statusBadge}
            >
              {item.completedConnections}/{item.connections.length}
            </Badge>
          </div>
        ),
      }),
      createTableColumn<DeviceRow>({
        columnId: 'instalar',
        renderHeaderCell: () => 'Será instalado',
        renderCell: (item) => (
          <Switch
            checked={!!item.device.new_serainstaladobase}
            onChange={(_, data) =>
              handleToggleInstall(item.device.new_deviceioid, data.checked)
            }
            disabled={toggleBusyId === item.device.new_deviceioid}
          />
        ),
      }),
      createTableColumn<DeviceRow>({
        columnId: 'actions',
        renderHeaderCell: () => '',
        renderCell: (item) => (
          <Button
            size="small"
            appearance="subtle"
            onClick={() => handleOpenDetails(item.device.new_deviceioid)}
          >
            Detalhes
          </Button>
        ),
      }),
    ],
    [handleOpenDetails, handleToggleInstall, styles.dimText, styles.statusBadge, toggleBusyId]
  );

  const renderCards = () => (
    <div className={styles.cardList}>
      {deviceRows.map((item) => (
        <Card key={item.device.new_deviceioid} className={styles.deviceCard}>
          <div className={styles.cardRow}>
            <div>
              <Text weight="semibold">{item.device.new_name || 'Sem nome'}</Text>
              <Text size={300} className={styles.dimText}>
                {item.model?.cr22f_title || 'Modelo não informado'}
              </Text>
            </div>
            <Badge appearance="outline" color="informative" className={styles.statusBadge}>
              {item.completedConnections}/{item.connections.length}
            </Badge>
          </div>
          <div className={styles.cardRow}>
            <Text size={300} className={styles.dimText}>
              Localização
            </Text>
            <Text size={300}>
              {item.device.new_localizacao?.trim() ? item.device.new_localizacao : EMPTY_LOCATION}
            </Text>
          </div>
          <div className={styles.cardRow}>
            <Text size={300} className={styles.dimText}>
              Produto
            </Text>
            <Text size={300}>{item.produto?.new_name || 'Sem vínculo'}</Text>
          </div>
          <div className={styles.cardRow}>
            <Switch
              checked={!!item.device.new_serainstaladobase}
              onChange={(_, data) =>
                handleToggleInstall(item.device.new_deviceioid, data.checked)
              }
              disabled={toggleBusyId === item.device.new_deviceioid}
            />
            <Button
              size="small"
              appearance="subtle"
              onClick={() => handleOpenDetails(item.device.new_deviceioid)}
            >
              Detalhes
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const showEmptyState = !loading && !error && selectedProjectId && deviceRows.length === 0;

  return (
    <>
      <CommandBar primaryActions={primaryActions} secondaryActions={secondaryActions} />
      <PageHeader title="Guia de Conexões" subtitle="Gerencie dispositivos e conexões por projeto" />
      <PageContainer>
        <div className={styles.container}>
          <div className={styles.filtersRow}>
            <div className="flex flex-col gap-2">
              <Label>Projeto</Label>
              <SearchableCombobox
                placeholder="Buscar projeto"
                value={selectedProjectLabel}
                selectedId={selectedProjectId}
                onSelect={(id, label) => {
                  setSelectedProjectId(id);
                  setSelectedProjectLabel(label);
                }}
                onSearch={searchProjects}
              />
            </div>
            <Field label="Buscar dispositivo">
              <Input
                value={searchTerm}
                onChange={(_, data) => setSearchTerm(data.value)}
                placeholder="Nome ou localização"
                disabled={!selectedProjectId}
              />
            </Field>
            <div className="flex flex-col gap-2">
              <Label>Agrupar</Label>
              <Dropdown
                value={GROUP_BY_OPTIONS.find((option) => option.value === groupBy)?.label || ''}
                onOptionSelect={(_, data) => setGroupBy(data.optionValue as GroupByMode)}
                disabled={!selectedProjectId}
              >
                {GROUP_BY_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Dropdown>
            </div>
          </div>

          {selectedProjectId && tabOptions.length > 0 && (
            <TabList
              selectedValue={selectedTab}
              onTabSelect={(_, data) => setSelectedTab(data.value as string)}
              className={styles.tabList}
            >
              {tabOptions.map((tab) => (
                <Tab key={tab.value} value={tab.value}>
                  {tab.label}
                </Tab>
              ))}
            </TabList>
          )}

          {!selectedProjectId && (
            <EmptyState
              title="Selecione um projeto"
              description="Escolha um projeto para visualizar os dispositivos e conexões."
            />
          )}

          {selectedProjectId && loading && <LoadingState label="Carregando dispositivos..." />}

          {selectedProjectId && error && (
            <EmptyState
              title="Falha ao carregar dados"
              description={error}
              actionLabel="Tentar novamente"
              onAction={reload}
            />
          )}

          {selectedProjectId && actionError && (
            <Text size={300} style={{ color: tokens.colorPaletteRedForeground2 }}>
              {actionError}
            </Text>
          )}
          {selectedProjectId && bulkStatus && (
            <Text size={300} className={styles.dimText}>
              {bulkStatus}
            </Text>
          )}

          {showEmptyState && (
            <EmptyState
              title="Nenhum dispositivo encontrado"
              description="Ajuste os filtros ou selecione outro projeto."
            />
          )}

          {selectedProjectId && !loading && !error && deviceRows.length > 0 && (
            <>
              <div className={styles.tableWrapper}>
                <DataGrid
                  items={deviceRows}
                  columns={columns}
                  getRowId={(item) => item.device.new_deviceioid}
                  selectionMode="multiselect"
                  onSelectionChange={setSelectedDeviceRows}
                />
              </div>
              {renderCards()}
            </>
          )}
        </div>
      </PageContainer>
      <DeviceDetailDialog
        open={detailOpen && !!detailDeviceId}
        deviceId={detailDeviceId}
        projectId={selectedProjectId}
        onClose={handleCloseDetails}
        onUpdated={reload}
      />
      <NovoEquipamentoDialog
        open={novoOpen}
        projectId={selectedProjectId}
        onClose={() => setNovoOpen(false)}
        onCreated={reload}
      />
      <GerarPendenciasDialog
        open={pendenciasOpen}
        projectId={selectedProjectId}
        produtos={produtos}
        modelos={modelos}
        onClose={() => setPendenciasOpen(false)}
        onGenerated={reload}
      />
      <RootDeviceSelectionDialog
        open={rootSelectionOpen}
        devices={visibleDevices}
        onClose={() => setRootSelectionOpen(false)}
        onSelect={handleRootSelected}
      />
      <DiagramModal
        open={diagramModalOpen}
        chart={currentDiagramCode}
        onClose={() => setDiagramModalOpen(false)}
      />
    </>
  );
}
