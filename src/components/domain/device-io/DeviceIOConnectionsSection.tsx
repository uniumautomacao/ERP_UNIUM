import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Tab,
  TabList,
  Text,
  tokens,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import { Add24Regular, Delete24Regular, Edit24Regular, PlugDisconnected24Regular } from '@fluentui/react-icons';
import { DataGrid, createTableColumn } from '../../shared/DataGrid';
import { EmptyState } from '../../shared/EmptyState';
import type {
  DeviceIOConnection,
  DeviceIOConnectionDirectionOption,
  DeviceIOConnectionTypeOption,
} from '../../../types';
import { DeviceIOConnectionDialog } from './DeviceIOConnectionDialog';

const useStyles = makeStyles({
  card: {
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabList: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  actionsCell: {
    display: 'flex',
    ...shorthands.gap('8px'),
  },
});

interface DeviceIOConnectionsSectionProps {
  connections: DeviceIOConnection[];
  connectionTypes: DeviceIOConnectionTypeOption[];
  connectionDirections: DeviceIOConnectionDirectionOption[];
  onAdd: (connection: DeviceIOConnection) => void;
  onUpdate: (index: number, connection: DeviceIOConnection) => void;
  onRemove: (index: number) => void;
}

export function DeviceIOConnectionsSection({
  connections,
  connectionTypes,
  connectionDirections,
  onAdd,
  onUpdate,
  onRemove,
}: DeviceIOConnectionsSectionProps) {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState('inputs');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const typeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    connectionTypes.forEach((item) => map.set(item.value.toString(), item.label));
    return map;
  }, [connectionTypes]);

  const directionLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    connectionDirections.forEach((item) => map.set(item.value.toString(), item.label));
    return map;
  }, [connectionDirections]);

  const groupedConnections = useMemo(() => {
    return connections.map((connection, index) => ({
      connection,
      index,
    }));
  }, [connections]);

  const filteredConnections = useMemo(() => {
    if (activeTab === 'inputs') {
      return groupedConnections.filter((item) => item.connection.Direction === '100000000');
    }
    if (activeTab === 'outputs') {
      return groupedConnections.filter((item) => item.connection.Direction === '100000001');
    }
    return groupedConnections.filter((item) =>
      ['100000002', '100000003'].includes(item.connection.Direction)
    );
  }, [activeTab, groupedConnections]);

  const columns = useMemo(
    () => [
      createTableColumn<typeof filteredConnections[number]>({
        columnId: 'name',
        renderHeaderCell: () => 'Conexão',
        renderCell: (item) => item.connection.Name,
      }),
      createTableColumn<typeof filteredConnections[number]>({
        columnId: 'type',
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => typeLabelMap.get(item.connection.Type) ?? 'Tipo desconhecido',
      }),
      createTableColumn<typeof filteredConnections[number]>({
        columnId: 'direction',
        renderHeaderCell: () => 'Direção',
        renderCell: (item) => directionLabelMap.get(item.connection.Direction) ?? 'Direção desconhecida',
      }),
      createTableColumn<typeof filteredConnections[number]>({
        columnId: 'actions',
        renderHeaderCell: () => '',
        renderCell: (item) => (
          <div className={styles.actionsCell}>
            <Button
              appearance="subtle"
              icon={<Edit24Regular />}
              size="small"
              onClick={() => {
                setEditingIndex(item.index);
                setDialogOpen(true);
              }}
            >
              Editar
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete24Regular />}
              size="small"
              onClick={() => {
                const confirmed = window.confirm('Deseja remover esta conexão?');
                if (confirmed) {
                  onRemove(item.index);
                }
              }}
            >
              Remover
            </Button>
          </div>
        ),
      }),
    ],
    [directionLabelMap, onRemove, styles.actionsCell, typeLabelMap]
  );

  const emptyState = (
    <EmptyState
      icon={<PlugDisconnected24Regular />}
      title="Nenhuma conexão nesta seção"
      description="Adicione uma nova conexão para continuar."
      actionLabel="Adicionar conexão"
      onAction={() => {
        setEditingIndex(null);
        setDialogOpen(true);
      }}
    />
  );

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Text size={500} weight="semibold">
          Conexões
        </Text>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={() => {
            setEditingIndex(null);
            setDialogOpen(true);
          }}
        >
          Adicionar Conexão
        </Button>
      </div>

      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(data.value as string)}
        className={styles.tabList}
      >
        <Tab value="inputs">Entradas</Tab>
        <Tab value="outputs">Saídas</Tab>
        <Tab value="other">Bidirecionais e Bus</Tab>
      </TabList>

      <DataGrid
        items={filteredConnections}
        columns={columns}
        getRowId={(item) => `${item.connection.Name}-${item.index}`}
        emptyState={emptyState}
      />

      <DeviceIOConnectionDialog
        open={dialogOpen}
        initialConnection={
          typeof editingIndex === 'number' ? connections[editingIndex] : undefined
        }
        index={typeof editingIndex === 'number' ? editingIndex : undefined}
        connectionTypes={connectionTypes}
        connectionDirections={connectionDirections}
        onClose={() => {
          setDialogOpen(false);
          setEditingIndex(null);
        }}
        onSave={(connection, index) => {
          if (typeof index === 'number') {
            onUpdate(index, connection);
          } else {
            onAdd(connection);
          }
          setDialogOpen(false);
          setEditingIndex(null);
        }}
      />
    </Card>
  );
}
