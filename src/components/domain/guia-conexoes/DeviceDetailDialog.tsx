import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Delete24Regular } from '@fluentui/react-icons';
import {
  NewDeviceIOConnectionService,
  NewDeviceIOService,
} from '../../../generated';
import type {
  GuiaDeviceIO,
  GuiaDeviceIOConnection,
} from '../../../types/guiaConexoes';
import { DeviceConnectionsAccordion } from './DeviceConnectionsAccordion';
import { VincularConexaoDialog } from './VincularConexaoDialog';
import { useConnectionEndpointLabels } from '../../../hooks/guia-conexoes/useConnectionEndpointLabels';
import {
  clearDeviceIOConnectionLink,
  deleteDeviceWithConnections,
} from '../../../utils/guia-conexoes/deleteDevice';
import { resolveErrorMessage } from '../../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../../utils/guia-conexoes/odata';

const useStyles = makeStyles({
  surface: {
    width: 'min(1200px, 96vw)',
    maxWidth: '1200px',
    maxHeight: '90vh',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    overflowY: 'auto',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
  dimText: {
    color: tokens.colorNeutralForeground3,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
});

interface DeviceDetailDialogProps {
  open: boolean;
  deviceId: string | null;
  projectId: string | null;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
}

export function DeviceDetailDialog({
  open,
  deviceId,
  projectId,
  onClose,
  onUpdated,
}: DeviceDetailDialogProps) {
  const styles = useStyles();
  const dialogRef = useRef<HTMLDivElement>(null);
  type DeviceUpdatePayload = Parameters<typeof NewDeviceIOService.update>[1];
  type ConnectionUpdatePayload = Parameters<typeof NewDeviceIOConnectionService.update>[1];
  const [device, setDevice] = useState<GuiaDeviceIO | null>(null);
  const [connections, setConnections] = useState<GuiaDeviceIOConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [manualDrafts, setManualDrafts] = useState<Record<string, string>>({});
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkConnection, setLinkConnection] = useState<GuiaDeviceIOConnection | null>(null);
  const { labels: endpointLabels, loading: endpointLoading, error: endpointError } =
    useConnectionEndpointLabels(connections);

  // Restore focus to dialog when link dialog closes
  useEffect(() => {
    if (!linkOpen && dialogRef.current) {
      // Small delay to ensure the dialog is visible
      const timer = setTimeout(() => {
        const firstInput = dialogRef.current?.querySelector('input') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [linkOpen]);

  const loadData = useCallback(async () => {
    if (!deviceId) {
      setDevice(null);
      setConnections([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [deviceResult, connectionResult] = await Promise.all([
        NewDeviceIOService.get(deviceId, {
          select: ['new_deviceioid', 'new_name', 'new_localizacao', 'new_serainstaladobase'],
        }),
        NewDeviceIOConnectionService.getAll({
          select: [
            'new_deviceioconnectionid',
            'new_name',
            'new_displayname',
            'new_direcao',
            'new_direcaorawtext',
            'new_tipodeconexao',
            'new_tipodeconexaorawtext',
            'new_localizacao',
            'new_connectedtomanual',
            '_new_connectedto_value',
          ],
          filter: `statecode eq 0 and _new_device_value eq ${escapeODataValue(deviceId)}`,
          orderBy: ['new_name asc'],
          maxPageSize: 5000,
        }),
      ]);

      if (!deviceResult.success || !deviceResult.data) {
        throw new Error(
          resolveErrorMessage(deviceResult.error, 'Falha ao carregar o equipamento.')
        );
      }

      if (!connectionResult.success) {
        throw new Error(
          resolveErrorMessage(connectionResult.error, 'Falha ao carregar conexões.')
        );
      }

      setDevice(deviceResult.data as GuiaDeviceIO);
      setConnections((connectionResult.data ?? []) as GuiaDeviceIOConnection[]);
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao carregar dados.'));
      setDevice(null);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, loadData]);

  const completedConnections = useMemo(
    () =>
      connections.filter(
        (connection) =>
          !!connection._new_connectedto_value || !!connection.new_connectedtomanual
      ).length,
    [connections]
  );

  const handleSaveDevice = useCallback(async () => {
    if (!deviceId || !device) return;
    setSaving(true);
    setError('');
    try {
      const result = await NewDeviceIOService.update(deviceId, {
        new_name: device.new_name ?? '',
        new_localizacao: device.new_localizacao ?? '',
      } as DeviceUpdatePayload);
      if (!result.success) {
        throw new Error(resolveErrorMessage(result.error, 'Falha ao salvar.'));
      }
      await onUpdated();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao salvar.'));
    } finally {
      setSaving(false);
    }
  }, [device, deviceId, onUpdated]);

  const clearConnection = useCallback(
    async (connection: GuiaDeviceIOConnection) => {
      setSaving(true);
      setError('');
      try {
        await clearDeviceIOConnectionLink(
          connection.new_deviceioconnectionid,
          connection._new_connectedto_value
        );

        await loadData();
        await onUpdated();
      } catch (err) {
        console.error('[GuiaConexoes] Falha ao limpar vínculo', err);
        setError(resolveErrorMessage(err, 'Falha ao limpar vínculo.'));
      } finally {
        setSaving(false);
      }
    },
    [loadData, onUpdated]
  );

  const saveManual = useCallback(
    async (connectionId: string) => {
      const value = manualDrafts[connectionId]?.trim() || null;
      setSaving(true);
      setError('');
      try {
        const payload = {
          'new_ConnectedTo@odata.bind': null,
          new_connectedtomanual: value,
        } as unknown as Record<string, unknown>;
        const result = await NewDeviceIOConnectionService.update(connectionId, payload);
        if (!result.success) {
          throw new Error('Falha ao salvar destino manual.');
        }
        await loadData();
        await onUpdated();
      } catch (err) {
        setError(resolveErrorMessage(err, 'Falha ao salvar destino manual.'));
      } finally {
        setSaving(false);
      }
    },
    [loadData, manualDrafts, onUpdated]
  );

  const handleOpenLink = useCallback((connection: GuiaDeviceIOConnection) => {
    setLinkConnection(connection);
    setLinkOpen(true);
  }, []);

  const deleteConnection = useCallback(
    async (connection: GuiaDeviceIOConnection) => {
      const confirm = window.confirm('Deseja remover esta conexão?');
      if (!confirm) return;
      setSaving(true);
      setError('');
      try {
        if (connection._new_connectedto_value) {
          await clearConnection(connection);
        }
        await NewDeviceIOConnectionService.delete(connection.new_deviceioconnectionid);
        await loadData();
        await onUpdated();
      } catch (err) {
        setError(resolveErrorMessage(err, 'Falha ao remover conexão.'));
      } finally {
        setSaving(false);
      }
    },
    [clearConnection, loadData, onUpdated]
  );

  const deleteDevice = useCallback(async () => {
    if (!deviceId) return;
    const confirm = window.confirm('Deseja apagar este equipamento e suas conexões?');
    if (!confirm) return;
    setSaving(true);
    setError('');
    try {
      await deleteDeviceWithConnections(deviceId);
      await onUpdated();
      onClose();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao apagar equipamento.'));
    } finally {
      setSaving(false);
    }
  }, [deviceId, onClose, onUpdated]);

  if (!open) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(_, data) => (!data.open ? onClose() : null)}>
      <DialogSurface className={styles.surface} ref={dialogRef}>
        <DialogBody className={styles.body}>
            <DialogTitle>Detalhes do equipamento</DialogTitle>
            <DialogContent className={styles.content}>
              {loading && <Text>Carregando...</Text>}
              {error && <Text className={styles.errorText}>{error}</Text>}

              {!loading && device && (
                <>
                  <div className={styles.formRow}>
                    <Field label="Nome">
                      <Input
                        value={device.new_name ?? ''}
                        onChange={(_, data) =>
                          setDevice((prev) => (prev ? { ...prev, new_name: data.value } : prev))
                        }
                      />
                    </Field>
                    <Field label="Localização">
                      <Input
                        value={device.new_localizacao ?? ''}
                        onChange={(_, data) =>
                          setDevice((prev) =>
                            prev ? { ...prev, new_localizacao: data.value } : prev
                          )
                        }
                      />
                    </Field>
                  </div>

                  <div className={styles.summaryRow}>
                    <Text size={300} className={styles.dimText}>
                      {completedConnections}/{connections.length} conexões concluídas
                    </Text>
                    <Badge appearance="outline">
                      {completedConnections}/{connections.length}
                    </Badge>
                  </div>

                  {endpointError && (
                    <Text size={200} className={styles.errorText}>
                      {endpointError}
                    </Text>
                  )}

                  <DeviceConnectionsAccordion
                    connections={connections}
                    endpointLabels={endpointLabels}
                    endpointLoading={endpointLoading}
                    saving={saving}
                    manualDrafts={manualDrafts}
                    onManualDraftChange={(id, value) =>
                      setManualDrafts((prev) => ({ ...prev, [id]: value }))
                    }
                    onSaveManual={saveManual}
                    onOpenLink={handleOpenLink}
                    onClearLink={clearConnection}
                    onDeleteConnection={deleteConnection}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={handleSaveDevice} disabled={saving || loading}>
                Salvar alterações
              </Button>
              <Button appearance="subtle" onClick={onClose}>
                Fechar
              </Button>
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                onClick={deleteDevice}
                disabled={saving || loading}
              >
                Apagar equipamento
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <VincularConexaoDialog
        open={linkOpen}
        connection={linkConnection}
        projectId={projectId}
        deviceId={deviceId}
        onClose={() => setLinkOpen(false)}
        onLinked={async () => {
          await loadData();
          await onUpdated();
        }}
      />
    </>
  );
}
