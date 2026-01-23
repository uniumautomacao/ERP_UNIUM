import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Checkbox,
  Field,
  Input,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  NewDeviceIOConnectionService,
  NewDeviceIOService,
} from '../../../generated';
import type { GuiaModeloProduto, GuiaProdutoServico } from '../../../types/guiaConexoes';
import { resolveErrorMessage } from '../../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../../utils/guia-conexoes/odata';
import { parseDeviceTemplate } from '../../../utils/guia-conexoes/deviceTemplate';
import { SISTEMA_TIPOS_EXCLUIDOS_PENDENCIA } from '../../../utils/guia-conexoes/systemTypes';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  dimText: {
    color: tokens.colorNeutralForeground3,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
  },
});

type PendingItem = {
  produto: GuiaProdutoServico;
  missing: number;
  existing: number;
  modelos: GuiaModeloProduto[];
};

interface GerarPendenciasDialogProps {
  open: boolean;
  projectId: string | null;
  produtos: GuiaProdutoServico[];
  modelos: GuiaModeloProduto[];
  onClose: () => void;
  onGenerated: () => Promise<void> | void;
}

export function GerarPendenciasDialog({
  open,
  projectId,
  produtos,
  modelos,
  onClose,
  onGenerated,
}: GerarPendenciasDialogProps) {
  const styles = useStyles();
  const normalizeRef = useCallback((value?: string | null) => value?.trim().toLowerCase() ?? '', []);
  const [location, setLocation] = useState('');
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modelosMap = useMemo(() => {
    const map = new Map<string, GuiaModeloProduto>();
    modelos.forEach((modelo) => {
      map.set(modelo.cr22f_modelosdeprodutofromsharepointlistid, modelo);
    });
    return map;
  }, [modelos]);

  const modelosByReference = useMemo(() => {
    const map = new Map<string, GuiaModeloProduto>();
    modelos.forEach((modelo) => {
      const refKey = normalizeRef(modelo.cr22f_id);
      const titleKey = normalizeRef(modelo.cr22f_title);
      if (refKey && !map.has(refKey)) {
        map.set(refKey, modelo);
      }
      if (titleKey && !map.has(titleKey)) {
        map.set(titleKey, modelo);
      }
    });
    return map;
  }, [modelos, normalizeRef]);

  const loadPending = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError('');
    try {
      const items: PendingItem[] = [];

      console.log('[GerarPendencias] Produtos disponíveis:', produtos.length);

      for (const produto of produtos) {
        const produtoLabel =
          produto.new_referenciadoproduto?.trim() ||
          produto.new_name?.trim() ||
          `Produto ${produto.new_produtoservicoid?.substring(0, 8)}`;
        console.log(
          '[GerarPendencias] Checando produto:',
          produtoLabel,
          'Quantidade:',
          produto.new_quantidade
        );

        if (!produto.new_quantidade || produto.new_quantidade <= 0) {
          console.log('[GerarPendencias] Pulando - quantidade <= 0');
          continue;
        }

        // Contar devices vinculados a este produto
        const result = await NewDeviceIOService.getAll({
          select: ['new_deviceioid', '_new_modelodeproduto_value'],
          filter: `statecode eq 0 and _new_projeto_value eq ${escapeODataValue(
            projectId
          )} and _new_produto_value eq ${escapeODataValue(
            produto.new_produtoservicoid
          )}`,
          maxPageSize: 5000,
        });

        const existingDevices = (result.data ?? []) as {
          _new_modelodeproduto_value?: string | null;
        }[];
        let existingModelId = '';
        for (const device of existingDevices) {
          if (device._new_modelodeproduto_value) {
            existingModelId = device._new_modelodeproduto_value;
            break;
          }
        }
        const existing = existingDevices.length ?? 0;
        const missing = produto.new_quantidade - existing;

        console.log(
          '[GerarPendencias] Produto:',
          produtoLabel,
          'Existentes:',
          existing,
          'Necessários:',
          produto.new_quantidade,
          'Faltando:',
          missing
        );

        if (missing > 0) {
          const modelId =
            produto._new_produto_value ?? existingModelId ?? '';
          const modelo = modelId ? modelosMap.get(modelId) : undefined;
          const fallbackModelo =
            modelo ??
            modelosByReference.get(
              normalizeRef(produto.new_referenciadoproduto || produto.new_name)
            );
          const modelosDoProduto = fallbackModelo ? [fallbackModelo] : [];
          items.push({ produto, missing, existing, modelos: modelosDoProduto });
        }
      }

      console.log('[GerarPendencias] Total de pendências encontradas:', items.length);
      setPending(items);
      setSelectedIds(new Set(items.map((item) => item.produto.new_produtoservicoid)));
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao calcular pendências.'));
      setPending([]);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [modelosByReference, modelosMap, normalizeRef, produtos, projectId]);

  useEffect(() => {
    if (open) {
      void loadPending();
    }
  }, [open, loadPending]);

  const handleGenerate = useCallback(async () => {
    if (!projectId) return;
    const selectedItems = pending.filter((item) =>
      selectedIds.has(item.produto.new_produtoservicoid)
    );
    if (selectedItems.length === 0) {
      setError('Não há pendências para gerar.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const modelCounters = new Map<string, number>();

      for (const item of selectedItems) {
        if (item.modelos.length === 0) {
          console.log('[GerarPendencias] Pulando - nenhum modelo encontrado');
          continue;
        }

        // Usar o primeiro modelo como template
        const modelo = item.modelos[0];
        const modelId = modelo.cr22f_modelosdeprodutofromsharepointlistid;
        
        if (!modelCounters.has(modelId)) {
          const countResult = await NewDeviceIOService.getAll({
            select: ['new_deviceioid'],
            filter: `statecode eq 0 and _new_projeto_value eq ${escapeODataValue(
              projectId
            )} and _new_modelodeproduto_value eq ${escapeODataValue(modelId)}`,
            maxPageSize: 5000,
          });
          modelCounters.set(modelId, countResult.data?.length ?? 0);
        }

        const template = parseDeviceTemplate(modelo.new_deviceiotemplatejson);
        console.log(
          '[GerarPendencias] Conexões no template:',
          template?.Connections?.length ?? 0
        );
        const base = modelCounters.get(modelId) ?? 0;

        for (let i = 0; i < item.missing; i += 1) {
          const sequence = base + i + 1;
          const sequenceLabel = String(sequence).padStart(2, '0');
          const name = `${modelo.cr22f_title ?? 'Equipamento'} (${sequenceLabel})`;
          const locationValue = location.trim() || null;

          const payload = {
            new_name: name,
            new_localizacao: locationValue,
            'new_ModelodeProduto@odata.bind': `/cr22f_modelosdeprodutofromsharepointlists(${modelId})`,
            'new_Projeto@odata.bind': `/cr22f_projetos(${projectId})`,
            'new_Produto@odata.bind': `/new_produtoservicos(${item.produto.new_produtoservicoid})`,
          } as Record<string, unknown>;

          console.log('[GerarPendencias] Payload de criação:', payload);
          const createResult = await NewDeviceIOService.create(payload as any);
          console.log('[GerarPendencias] Resultado de criação:', createResult);
          if (!createResult.success || !createResult.data?.new_deviceioid) {
            const errorMsg = createResult.error?.message || JSON.stringify(createResult.error);
            console.error('[GerarPendencias] Erro ao criar:', errorMsg);
            throw new Error(`Falha ao criar equipamento pendente: ${errorMsg}`);
          }

          const deviceId = createResult.data.new_deviceioid as string;
          if (template?.Connections?.length) {
            for (const connection of template.Connections) {
              const connectionPayload = {
                new_name: connection.Name,
                new_tipodeconexao: Number(connection.Type),
                new_direcao: Number(connection.Direction),
                'new_Device@odata.bind': `/new_deviceios(${deviceId})`,
                'new_Projeto@odata.bind': `/cr22f_projetos(${projectId})`,
              } as Record<string, unknown>;

              const connectionResult = await NewDeviceIOConnectionService.create(
                connectionPayload as any
              );
              if (!connectionResult.success) {
                console.error(
                  '[GerarPendencias] Falha ao criar conexão',
                  connectionResult.error,
                  connectionPayload
                );
                throw new Error(
                  `Falha ao criar conexão ${connection.Name ?? ''}.`
                );
              }
            }
          }
        }

        modelCounters.set(modelId, base + item.missing);
      }

      await onGenerated();
      onClose();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao gerar pendências.'));
    } finally {
      setLoading(false);
    }
  }, [location, onClose, onGenerated, pending, projectId, selectedIds]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => (!data.open ? onClose() : null)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Gerar pendências</DialogTitle>
          <DialogContent className={styles.content}>
            {error && <Text className={styles.errorText}>{error}</Text>}
            <Field label="Localização padrão">
              <Input
                value={location}
                onChange={(_, data) => setLocation(data.value)}
                placeholder="Opcional — usa a localização do produto quando vazio"
              />
            </Field>

            {loading && <Text className={styles.dimText}>Calculando pendências...</Text>}

            {!loading && pending.length === 0 && (
              <Text className={styles.dimText}>Nenhuma pendência encontrada.</Text>
            )}

            {!loading && pending.length > 0 && (
              <div className={styles.list}>
                {pending.map((item) => (
                  <Card key={item.produto.new_produtoservicoid} className={styles.card}>
                    <Checkbox
                      checked={selectedIds.has(item.produto.new_produtoservicoid)}
                      onChange={(_, data) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          const id = item.produto.new_produtoservicoid;
                          if (data.checked) {
                            next.add(id);
                          } else {
                            next.delete(id);
                          }
                          return next;
                        });
                      }}
                      label="Gerar pendência"
                    />
                    <Text weight="semibold">
                      {item.produto.new_referenciadoproduto ||
                        item.produto.new_name ||
                        item.modelos[0]?.cr22f_title ||
                        'Produto'}
                    </Text>
                    <Text size={300} className={styles.dimText}>
                      {item.missing} pendente(s) · {item.existing} existentes
                    </Text>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={handleGenerate} disabled={loading}>
              Gerar pendências
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
