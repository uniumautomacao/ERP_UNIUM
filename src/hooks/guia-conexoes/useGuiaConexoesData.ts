import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Cr22fModelosdeProdutoFromSharepointListService,
  NewDeviceIOConnectionService,
  NewDeviceIOService,
  NewProdutoServicoService,
} from '../../generated';
import type {
  GuiaConexoesData,
  GuiaDeviceIO,
  GuiaDeviceIOConnection,
  GuiaModeloProduto,
  GuiaProdutoServico,
} from '../../types/guiaConexoes';
import { buildOrFilter, chunkIds, escapeODataValue } from '../../utils/guia-conexoes/odata';

const DEVICE_SELECT = [
  'new_deviceioid',
  'new_name',
  'new_localizacao',
  'new_serainstaladobase',
  'new_serainstalado',
  'new_externalid',
  'new_modelodeproduto',
  'new_produto',
  'new_projeto',
];

const CONNECTION_SELECT = [
  'new_deviceioconnectionid',
  'new_name',
  'new_displayname',
  'new_direcao',
  'new_direcaorawtext',
  'new_tipodeconexao',
  'new_tipodeconexaorawtext',
  'new_tipodesistema',
  'new_localizacao',
  'new_templatejson',
  'new_connectedtomanual',
  'new_device',
  'new_connectedto',
  'new_projeto',
];

const PRODUTO_SELECT = [
  'new_produtoservicoid',
  'new_name',
  'new_localizacao',
  'new_quantidade',
  'new_disponivelparavinculo',
  'new_tipodesistemacontabilizadoos',
  'new_modelodeprodutooriginal',
  'new_produto',
  'new_projeto',
];

const MODELO_SELECT = [
  'cr22f_modelosdeprodutofromsharepointlistid',
  'cr22f_title',
  'new_deviceiotemplatejson',
  'new_tipodesistemapadrao',
  'new_omitirdoguiadeconexoes',
  'new_controlaetiqueta',
  'new_controlasn',
  'new_nomedofabricante',
];

const buildProjectFilter = (projectId: string) =>
  `statecode eq 0 and _new_projeto_value eq ${escapeODataValue(projectId)}`;

const buildDeviceFilter = (projectId: string, searchTerm: string) => {
  const base = buildProjectFilter(projectId);
  const normalized = searchTerm.trim();
  if (!normalized) {
    return base;
  }

  const escaped = escapeODataValue(normalized);
  const searchFilter = `(contains(new_name, '${escaped}') or contains(new_localizacao, '${escaped}'))`;
  return `${base} and ${searchFilter}`;
};

const emptyData: GuiaConexoesData = {
  devices: [],
  connections: [],
  produtos: [],
  modelos: [],
};

export const useGuiaConexoesData = (projectId: string | null, searchTerm: string) => {
  const [data, setData] = useState<GuiaConexoesData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadModelos = useCallback(async (modelIds: string[]) => {
    if (modelIds.length === 0) {
      return [] as GuiaModeloProduto[];
    }

    const chunks = chunkIds(modelIds, 25);
    const responses = await Promise.all(
      chunks.map((chunk) =>
        Cr22fModelosdeProdutoFromSharepointListService.getAll({
          select: MODELO_SELECT,
          filter: `statecode eq 0 and (${buildOrFilter(
            'cr22f_modelosdeprodutofromsharepointlistid',
            chunk
          )})`,
          top: chunk.length,
        })
      )
    );

    const merged = new Map<string, GuiaModeloProduto>();
    responses.forEach((response) => {
      if (response.success && response.data) {
        response.data.forEach((item: any) => {
          if (item.cr22f_modelosdeprodutofromsharepointlistid) {
            merged.set(item.cr22f_modelosdeprodutofromsharepointlistid, item);
          }
        });
      }
    });

    return Array.from(merged.values());
  }, []);

  const load = useCallback(async () => {
    if (!projectId) {
      setData(emptyData);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const filter = buildProjectFilter(projectId);
      const deviceFilter = buildDeviceFilter(projectId, searchTerm);

      const [deviceResult, connectionResult, produtoResult] = await Promise.all([
        NewDeviceIOService.getAll({
          select: DEVICE_SELECT,
          filter: deviceFilter,
          orderBy: ['new_localizacao asc', 'new_name asc'],
          maxPageSize: 5000,
        }),
        NewDeviceIOConnectionService.getAll({
          select: CONNECTION_SELECT,
          filter,
          orderBy: ['new_name asc'],
          maxPageSize: 5000,
        }),
        NewProdutoServicoService.getAll({
          select: PRODUTO_SELECT,
          filter,
          orderBy: ['new_name asc'],
          maxPageSize: 5000,
        }),
      ]);

      if (!deviceResult.success) {
        throw deviceResult.error ?? new Error('Falha ao carregar devices.');
      }
      if (!connectionResult.success) {
        throw connectionResult.error ?? new Error('Falha ao carregar conexões.');
      }
      if (!produtoResult.success) {
        throw produtoResult.error ?? new Error('Falha ao carregar produtos.');
      }

      const devices = (deviceResult.data ?? []) as GuiaDeviceIO[];
      const connections = (connectionResult.data ?? []) as GuiaDeviceIOConnection[];
      const produtos = (produtoResult.data ?? []) as GuiaProdutoServico[];

      const modelIds = new Set<string>();
      devices.forEach((device) => {
        if (device._new_modelodeproduto_value) {
          modelIds.add(device._new_modelodeproduto_value);
        }
      });
      produtos.forEach((produto) => {
        if (produto._new_modelodeprodutooriginal_value) {
          modelIds.add(produto._new_modelodeprodutooriginal_value);
        }
      });

      const modelos = await loadModelos(Array.from(modelIds));

      setData({
        devices,
        connections,
        produtos,
        modelos,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, [loadModelos, projectId, searchTerm]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      ...data,
      loading,
      error,
      reload: load,
    }),
    [data, loading, error, load]
  );
};
