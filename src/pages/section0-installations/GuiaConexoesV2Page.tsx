import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  makeStyles,
  tokens,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Save24Regular,
  Settings24Regular,
  ZoomIn24Regular,
  ZoomOut24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/shared/LoadingState';
import { EmptyState } from '../../components/shared/EmptyState';
import { useGuiaConexoesData } from '../../hooks/guia-conexoes/useGuiaConexoesData';
import { useCurrentSystemUser } from '../../hooks/useCurrentSystemUser';
import { EquipmentPalette } from '../../components/domain/guia-conexoes-v2/EquipmentPalette';
import { BlueprintCanvas } from '../../components/domain/guia-conexoes-v2/BlueprintCanvas';
import { ConnectionDetailsPanel } from '../../components/domain/guia-conexoes-v2/ConnectionDetailsPanel';
import type { BlueprintCanvasState } from '../../components/domain/guia-conexoes-v2/BlueprintCanvas';
import { loadLayoutFromStorage, saveLayoutToStorage } from '../../components/domain/guia-conexoes-v2/storage/layoutStorage';
import { Cr22fProjetoService } from '../../generated';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: tokens.spacingVerticalM,
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    gap: tokens.spacingHorizontalM,
    minHeight: 0,
  },
  palette: {
    width: '250px',
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
});

export const GuiaConexoesV2Page = () => {
  const styles = useStyles();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [canvasState, setCanvasState] = useState<BlueprintCanvasState | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [autoLayoutEnabled, setAutoLayoutEnabled] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  const { systemUserId, fullName, loading: userLoading } = useCurrentSystemUser();
  const data = useGuiaConexoesData(projectId, searchTerm);

  // Carregar projeto padrão ao montar
  useEffect(() => {
    const loadDefaultProject = async () => {
      try {
        const result = await Cr22fProjetoService.getAll({
          select: ['cr22f_projetoid'],
          filter: 'statecode eq 0',
          top: 1,
          orderBy: ['createdon desc'],
        });

        if (result.success && result.data && result.data.length > 0) {
          const firstProject = result.data[0] as any;
          setProjectId(firstProject.cr22f_projetoid);
        }
      } catch (err) {
        console.error('Erro ao carregar projeto padrão:', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadDefaultProject();
  }, []);

  // Load persisted layout on projectId change
  const persistedLayout = useMemo(() => {
    if (projectId) {
      return loadLayoutFromStorage(projectId);
    }
    return null;
  }, [projectId]);

  const handleSaveLayout = useCallback(async () => {
    if (projectId && canvasState) {
      try {
        await saveLayoutToStorage(projectId, {
          canvasDeviceIds: canvasState.nodes
            .filter(n => n.type === 'device')
            .map(n => n.id),
          nodePositions: Object.fromEntries(
            canvasState.nodes.map(n => [n.id, { x: n.position.x, y: n.position.y }])
          ),
          viewport: canvasState.viewport,
          autoLayoutEnabled,
        });
      } catch (err) {
        console.error('Erro ao salvar layout:', err);
      }
    }
  }, [projectId, canvasState, autoLayoutEnabled]);

  const handleAutoLayout = useCallback(() => {
    setAutoLayoutEnabled(!autoLayoutEnabled);
  }, [autoLayoutEnabled]);

  const handleFitView = useCallback(() => {
    if (canvasState) {
      // Blueprint canvas irá implementar esta ação
      const event = new CustomEvent('fitView');
      window.dispatchEvent(event);
    }
  }, [canvasState]);

  const commandBarPrimaryActions = useMemo(() => {
    return [
      {
        id: 'save',
        label: 'Salvar',
        icon: <Save24Regular />,
        onClick: handleSaveLayout,
      },
    ];
  }, [handleSaveLayout]);

  if (!systemUserId || userLoading) {
    return <LoadingState />;
  }

  if (!projectId) {
    return (
      <PageContainer>
        <PageHeader title="Guia de Conexões v2" />
        <EmptyState
          title="Nenhum projeto selecionado"
          description="Selecione um projeto para começar"
        />
      </PageContainer>
    );
  }

  if (data.loading) {
    return <LoadingState />;
  }

  return (
    <PageContainer>
      <PageHeader title="Guia de Conexões v2" />
      <CommandBar
        primaryActions={commandBarPrimaryActions}
        secondaryActions={[]}
      />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Blueprint Interativo</h2>
          </div>
          <div className={styles.actions}>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Tooltip content="Opções" relationship="label">
                  <Button icon={<Settings24Regular />} appearance="subtle" />
                </Tooltip>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem
                    onClick={handleAutoLayout}
                    icon={<ZoomIn24Regular />}
                  >
                    Auto-layout {autoLayoutEnabled ? '(ativo)' : '(inativo)'}
                  </MenuItem>
                  <MenuItem onClick={handleFitView} icon={<ZoomOut24Regular />}>
                    Ajustar visualização
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.palette}>
            <EquipmentPalette
              data={data}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              canvasDeviceIds={canvasState?.nodes
                .filter(n => n.type === 'device')
                .map(n => n.id) || []}
            />
          </div>

          <div className={styles.canvasWrapper}>
            <BlueprintCanvas
              data={data}
              projectId={projectId}
              onStateChange={setCanvasState}
              onSelectedEdgeChange={setSelectedEdgeId}
              persistedLayout={persistedLayout}
              autoLayoutEnabled={autoLayoutEnabled}
              onReloadData={() => data.reload()}
            />
          </div>
        </div>

        {selectedEdgeId && (
          <ConnectionDetailsPanel
            edgeId={selectedEdgeId}
            connections={data.connections}
            devices={data.devices}
            onClose={() => setSelectedEdgeId(null)}
            onRemoveConnection={() => {
              data.reload();
              setSelectedEdgeId(null);
            }}
          />
        )}
      </div>
    </PageContainer>
  );
};
