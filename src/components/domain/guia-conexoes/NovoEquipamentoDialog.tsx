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
  Input,
  Label,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { SearchableCombobox } from '../../shared/SearchableCombobox';
import {
  Cr22fModelosdeProdutoFromSharepointListService,
  NewDeviceIOConnectionService,
  NewDeviceIOService,
} from '../../../generated';
import type { GuiaModeloProduto } from '../../../types/guiaConexoes';
import { resolveErrorMessage } from '../../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../../utils/guia-conexoes/odata';
import { parseDeviceTemplate } from '../../../utils/guia-conexoes/deviceTemplate';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  helper: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
});

interface NovoEquipamentoDialogProps {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

export function NovoEquipamentoDialog({
  open,
  projectId,
  onClose,
  onCreated,
}: NovoEquipamentoDialogProps) {
  const styles = useStyles();
  const [modelId, setModelId] = useState<string | null>(null);
  const [modelLabel, setModelLabel] = useState('');
  const [model, setModel] = useState<GuiaModeloProduto | null>(null);
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  type DeviceCreatePayload = Parameters<typeof NewDeviceIOService.create>[0];
  type ConnectionCreatePayload = Parameters<typeof NewDeviceIOConnectionService.create>[0];
  type ModelSearchRecord = {
    cr22f_modelosdeprodutofromsharepointlistid: string;
    cr22f_title?: string | null;
  };

  const quantityValue = useMemo(() => {
    const parsed = Number(quantity);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [quantity]);

  const searchModels = useCallback(async (term: string) => {
    const normalized = term.trim();
    const filter =
      normalized.length >= 2
        ? `statecode eq 0 and contains(cr22f_title, '${escapeODataValue(normalized)}')`
        : 'statecode eq 0';

    const result = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
      select: [
        'cr22f_modelosdeprodutofromsharepointlistid',
        'cr22f_title',
        'new_deviceiotemplatejson',
      ],
      filter,
      orderBy: ['cr22f_title asc'],
      top: 50,
    });

    if (!result.success || !result.data) {
      return [];
    }

    return (result.data as ModelSearchRecord[]).map((item) => ({
      id: item.cr22f_modelosdeprodutofromsharepointlistid,
      label: item.cr22f_title || 'Modelo',
    }));
  }, []);

  const handleSelectModel = useCallback(
    async (id: string | null, label: string) => {
      setModelId(id);
      setModelLabel(label);
      if (!id) {
        setModel(null);
        return;
      }

      const result = await Cr22fModelosdeProdutoFromSharepointListService.get(id, {
        select: [
          'cr22f_modelosdeprodutofromsharepointlistid',
          'cr22f_title',
          'new_deviceiotemplatejson',
        ],
      });

      if (result.success && result.data) {
        setModel(result.data as GuiaModeloProduto);
      } else {
        setModel(null);
      }
    },
    []
  );

  const handleCreate = useCallback(async () => {
    if (!projectId) return;
    if (!modelId || !model) {
      setError('Selecione um modelo de produto.');
      return;
    }
    if (quantityValue <= 0) {
      setError('Informe uma quantidade válida.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const baseCountResult = await NewDeviceIOService.getAll({
        select: ['new_deviceioid'],
        filter: `statecode eq 0 and _new_projeto_value eq ${escapeODataValue(
          projectId
        )} and _new_modelodeproduto_value eq ${escapeODataValue(modelId)}`,
        maxPageSize: 5000,
      });
      const existingCount = baseCountResult.data?.length ?? 0;

      const template = parseDeviceTemplate(model.new_deviceiotemplatejson);
      console.log(
        '[NovoEquipamento] Conexões no template:',
        template?.Connections?.length ?? 0
      );

      for (let i = 0; i < quantityValue; i += 1) {
        const sequence = existingCount + i + 1;
        const sequenceLabel = String(sequence).padStart(2, '0');
        const name = `${model.cr22f_title ?? 'Equipamento'} (${sequenceLabel})`;

        const payload: DeviceCreatePayload = {
          new_name: name,
          new_localizacao: location.trim() || undefined,
          'new_ModelodeProduto@odata.bind': `/cr22f_modelosdeprodutofromsharepointlists(${modelId})`,
          'new_Projeto@odata.bind': `/cr22f_projetos(${projectId})`,
        };

        const createResult = await NewDeviceIOService.create(payload);
        if (!createResult.success || !createResult.data?.new_deviceioid) {
          throw new Error('Falha ao criar o equipamento.');
        }

        const deviceId = createResult.data.new_deviceioid as string;

        if (template?.Connections?.length) {
          for (const connection of template.Connections) {
            const connectionPayload: ConnectionCreatePayload = {
              new_name: connection.Name,
              new_tipodeconexao: Number(connection.Type),
              new_direcao: Number(connection.Direction),
              'new_Device@odata.bind': `/new_deviceios(${deviceId})`,
              'new_Projeto@odata.bind': `/cr22f_projetos(${projectId})`,
            };

            const connectionResult = await NewDeviceIOConnectionService.create(
              connectionPayload
            );
            if (!connectionResult.success) {
              console.error(
                '[NovoEquipamento] Falha ao criar conexão',
                connectionResult.error,
                connectionPayload
              );
              throw new Error(`Falha ao criar conexão ${connection.Name ?? ''}.`);
            }
          }
        }
      }

      await onCreated();
      onClose();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao criar equipamento.'));
    } finally {
      setLoading(false);
    }
  }, [location, model, modelId, onClose, onCreated, projectId, quantityValue]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => (!data.open ? onClose() : null)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Novo equipamento</DialogTitle>
          <DialogContent className={styles.content}>
            {error && <Text className={styles.errorText}>{error}</Text>}
            <div className="flex flex-col gap-2">
              <Label>Modelo de produto</Label>
              <SearchableCombobox
                placeholder="Buscar modelo"
                value={modelLabel}
                selectedId={modelId}
                onSelect={(id, label) => void handleSelectModel(id, label)}
                onSearch={searchModels}
              />
            </div>
            <div className={styles.formRow}>
              <Field label="Localização">
                <Input value={location} onChange={(_, data) => setLocation(data.value)} />
              </Field>
              <Field label="Quantidade">
                <Input
                  type="number"
                  value={quantity}
                  onChange={(_, data) => setQuantity(data.value)}
                />
              </Field>
            </div>
            <Text className={styles.helper}>
              As conexões serão criadas a partir do template do modelo selecionado.
            </Text>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={handleCreate} disabled={loading}>
              Criar equipamentos
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
