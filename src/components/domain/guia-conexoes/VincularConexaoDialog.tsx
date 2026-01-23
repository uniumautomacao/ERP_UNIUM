import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Label,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { SearchableCombobox } from '../../shared/SearchableCombobox';
import { NewDeviceIOConnectionService, NewDeviceIOService } from '../../../generated';
import type { GuiaDeviceIOConnection } from '../../../types/guiaConexoes';
import { resolveErrorMessage } from '../../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../../utils/guia-conexoes/odata';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
  helper: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

const DIRECTION = {
  Input: 100000000,
  Output: 100000001,
  Bidirectional: 100000002,
  Bus: 100000003,
};

const buildDirectionFilter = (direction?: number | null) => {
  if (direction === DIRECTION.Input) {
    return `(new_direcao eq ${DIRECTION.Output} or new_direcao eq ${DIRECTION.Bidirectional} or new_direcao eq ${DIRECTION.Bus})`;
  }
  if (direction === DIRECTION.Output) {
    return `(new_direcao eq ${DIRECTION.Input} or new_direcao eq ${DIRECTION.Bidirectional} or new_direcao eq ${DIRECTION.Bus})`;
  }
  return '';
};

interface VincularConexaoDialogProps {
  open: boolean;
  connection: GuiaDeviceIOConnection | null;
  projectId: string | null;
  deviceId: string | null;
  onClose: () => void;
  onLinked: () => Promise<void> | void;
}

export function VincularConexaoDialog({
  open,
  connection,
  projectId,
  deviceId,
  onClose,
  onLinked,
}: VincularConexaoDialogProps) {
  const styles = useStyles();
  type ConnectionUpdatePayload = Parameters<typeof NewDeviceIOConnectionService.update>[1];
  type ConnectionSearchRecord = {
    new_deviceioconnectionid: string;
    new_name?: string | null;
    new_displayname?: string | null;
    new_localizacao?: string | null;
    _new_device_value?: string | null;
  };

  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetLabel, setTargetLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    if (!connection) return 'Vincular conexão';
    return `Vincular: ${connection.new_name || connection.new_displayname || 'Conexão'}`;
  }, [connection]);

  const searchConnections = useCallback(
    async (term: string) => {
      if (!connection || !projectId) return [];

      const normalized = term.trim();
      // Permita busca vazia para mostrar todas as conexões compatíveis
      // if (!normalized) return [];

      const typeFilter =
        connection.new_tipodeconexao !== null && connection.new_tipodeconexao !== undefined
          ? `new_tipodeconexao eq ${connection.new_tipodeconexao}`
          : '';
      const directionFilter = buildDirectionFilter(connection.new_direcao);
      
      // Só adiciona searchFilter se houver termo
      let searchFilter = '';
      if (normalized) {
        const escapedTerm = escapeODataValue(normalized);
        searchFilter = `(contains(new_name, '${escapedTerm}') or contains(new_displayname, '${escapedTerm}') or contains(new_localizacao, '${escapedTerm}'))`;
      }

      const filterParts = [
        `statecode eq 0`,
        `_new_projeto_value eq ${escapeODataValue(projectId)}`,
        `new_deviceioconnectionid ne ${escapeODataValue(connection.new_deviceioconnectionid)}`,
        deviceId ? `_new_device_value ne ${escapeODataValue(deviceId)}` : '',
        `_new_connectedto_value eq null and (new_connectedtomanual eq null or new_connectedtomanual eq '')`, // Excluir conexões que já têm vínculo
        typeFilter,
        directionFilter,
        searchFilter,
      ].filter(Boolean);

      const result = await NewDeviceIOConnectionService.getAll({
        select: [
          'new_deviceioconnectionid',
          'new_name',
          'new_displayname',
          'new_localizacao',
          '_new_device_value',
        ],
        filter: filterParts.join(' and '),
        orderBy: ['new_name asc'],
        top: 50,
      });

      if (!result.success || !result.data) {
        return [];
      }

      const connections = result.data as ConnectionSearchRecord[];
      const deviceIds = Array.from(
        new Set(connections.map((item) => item._new_device_value).filter(Boolean))
      ) as string[];
      const deviceNameMap = new Map<string, string>();

      if (deviceIds.length > 0) {
        const deviceFilter = deviceIds
          .map((id) => `new_deviceioid eq ${escapeODataValue(id)}`)
          .join(' or ');
        const deviceResult = await NewDeviceIOService.getAll({
          select: ['new_deviceioid', 'new_name'],
          filter: deviceFilter,
          top: deviceIds.length,
        });

        if (deviceResult.success && deviceResult.data) {
          (deviceResult.data as { new_deviceioid: string; new_name?: string }[]).forEach(
            (device) => {
              if (device.new_deviceioid) {
                deviceNameMap.set(device.new_deviceioid, device.new_name ?? 'Equipamento');
              }
            }
          );
        }
      }

      return connections.map((item) => {
        const deviceName = item._new_device_value
          ? deviceNameMap.get(item._new_device_value) ?? 'Equipamento'
          : 'Equipamento';
        const connectionLabel = item.new_name || item.new_displayname || 'Conexão';
        const location = item.new_localizacao || 'Sem localização';
        return {
          id: item.new_deviceioconnectionid,
          label: `${deviceName} · ${connectionLabel} · ${location}`,
        };
      });
    },
    [connection, deviceId, projectId]
  );

  const handleLink = useCallback(async () => {
    if (!connection || !targetId) return;

    setLoading(true);
    setError('');
    try {
      const payload = {
        'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${targetId})`,
        new_connectedtomanual: null,
      } as unknown as Record<string, unknown>;

      const payloadTarget = {
        'new_ConnectedTo@odata.bind': `/new_deviceioconnections(${connection.new_deviceioconnectionid})`,
        new_connectedtomanual: null,
      } as unknown as Record<string, unknown>;

      console.log('[VincularConexao] Vinculando:', {
        connection: connection.new_deviceioconnectionid,
        target: targetId,
        payload,
        payloadTarget,
      });

      // Fazer sequencialmente para evitar deadlock no SQL
      const resultA = await NewDeviceIOConnectionService.update(
        connection.new_deviceioconnectionid,
        payload
      );

      if (!resultA.success) {
        throw new Error(
          `Falha ao vincular conexão A: ${resolveErrorMessage(resultA.error, 'Erro desconhecido')}`
        );
      }

      const resultB = await NewDeviceIOConnectionService.update(targetId, payloadTarget);

      if (!resultB.success) {
        throw new Error(
          `Falha ao vincular conexão B: ${resolveErrorMessage(resultB.error, 'Erro desconhecido')}`
        );
      }

      console.log('[VincularConexao] Vínculo criado com sucesso');

      await onLinked();
      onClose();
    } catch (err) {
      console.error('[VincularConexao] Erro:', err);
      setError(resolveErrorMessage(err, 'Falha ao vincular conexões.'));
    } finally {
      setLoading(false);
    }
  }, [connection, onClose, onLinked, targetId]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => (!data.open ? onClose() : null)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent className={styles.content}>
            {error && <Text className={styles.errorText}>{error}</Text>}
            <div className="flex flex-col gap-2">
              <Label>Buscar conexão compatível</Label>
              <SearchableCombobox
                placeholder="Digite para buscar"
                value={targetLabel}
                selectedId={targetId}
                onSelect={(id, label) => {
                  setTargetId(id);
                  setTargetLabel(label);
                }}
                onSearch={searchConnections}
                showAllOnFocus={true}
              />
              <Text className={styles.helper}>
                Busca por nome/descrição da porta dentro do projeto.
              </Text>
            </div>
            {connection && (
              <Field label="Conexão atual">
                <Text>
                  {connection.new_name || connection.new_displayname || 'Conexão'}
                </Text>
              </Field>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={handleLink} disabled={!targetId || loading}>
              Vincular
            </Button>
            <Button appearance="subtle" onClick={onClose}>
              Cancelar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
