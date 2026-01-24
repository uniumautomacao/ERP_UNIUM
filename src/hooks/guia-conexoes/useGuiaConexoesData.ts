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
import { resolveErrorMessage } from '../../utils/guia-conexoes/errors';
import { buildOrFilter, chunkIds, escapeODataValue } from '../../utils/guia-conexoes/odata';

const DEVICE_SELECT = [
  'new_deviceioid',
  'new_name',
  'new_localizacao',
  'new_serainstaladobase',
  'new_serainstalado',
  'new_raiz',
  'new_externalid',
  '_new_modelodeproduto_value',
  '_new_produto_value',
  '_new_projeto_value',
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
  '_new_device_value',
  '_new_connectedto_value',
  '_new_projeto_value',
];

const PRODUTO_SELECT = [
  'new_produtoservicoid',
  'new_name',
  'new_referenciadoproduto',
  '_new_produto_value',
  'new_quantidade',
];

const MODELO_SELECT = [
  'cr22f_modelosdeprodutofromsharepointlistid',
  'cr22f_id',
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

const buildDeviceFilter = (
  projectId: string,
  searchTerm: string,
  locationFilter?: string | null
) => {
  const base = buildProjectFilter(projectId);
  const filters: string[] = [base];
  const normalized = searchTerm.trim();
  if (!normalized) {
    if (locationFilter && locationFilter.trim().length > 0) {
      filters.push(`new_localizacao eq '${escapeODataValue(locationFilter.trim())}'`);
    }
    return filters.join(' and ');
  }

  const escaped = escapeODataValue(normalized);
  const searchFilter = `(contains(new_name, '${escaped}') or contains(new_localizacao, '${escaped}'))`;
  filters.push(searchFilter);
  if (locationFilter && locationFilter.trim().length > 0) {
    filters.push(`new_localizacao eq '${escapeODataValue(locationFilter.trim())}'`);
  }
  return filters.join(' and ');
};

const emptyData: GuiaConexoesData = {
  devices: [],
  connections: [],
  produtos: [],
  modelos: [],
};

export const useGuiaConexoesData = (
  projectId: string | null,
  searchTerm: string,
  locationFilter?: string | null
) => {
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
        (response.data as GuiaModeloProduto[]).forEach((item) => {
          if (item.cr22f_modelosdeprodutofromsharepointlistid) {
            merged.set(item.cr22f_modelosdeprodutofromsharepointlistid, item);
          }
        });
      }
    });

    return Array.from(merged.values());
  }, []);

  const loadModelosByReference = useCallback(async (references: string[]) => {
    if (references.length === 0) {
      return [] as GuiaModeloProduto[];
    }

    const chunks = chunkIds(references, 25);
    const responses = await Promise.all(
      chunks.map((chunk) =>
        Cr22fModelosdeProdutoFromSharepointListService.getAll({
          select: MODELO_SELECT,
          filter: `statecode eq 0 and (${chunk
            .map(
              (ref) =>
                `contains(cr22f_id, '${escapeODataValue(ref)}') or contains(cr22f_title, '${escapeODataValue(
                  ref
                )}')`
            )
            .join(' or ')})`,
          maxPageSize: 5000,
        })
      )
    );

    const merged = new Map<string, GuiaModeloProduto>();
    responses.forEach((response) => {
      if (response.success && response.data) {
        (response.data as GuiaModeloProduto[]).forEach((item) => {
          if (item.cr22f_modelosdeprodutofromsharepointlistid) {
            merged.set(item.cr22f_modelosdeprodutofromsharepointlistid, item);
          }
        });
      }
    });

    return Array.from(merged.values());
  }, []);

  const updateDevice = useCallback((deviceId: string, updates: Partial<GuiaDeviceIO>) => {
    setData((prevData) => ({
      ...prevData,
      devices: prevData.devices.map((device) =>
        device.new_deviceioid === deviceId ? { ...device, ...updates } : device
      ),
    }));
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
      const deviceFilter = buildDeviceFilter(projectId, searchTerm, locationFilter);

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
        throw new Error(
          resolveErrorMessage(deviceResult.error, 'Falha ao carregar devices.')
        );
      }
      if (!connectionResult.success) {
        throw new Error(
          resolveErrorMessage(connectionResult.error, 'Falha ao carregar conexões.')
        );
      }
      if (!produtoResult.success) {
        throw new Error(
          resolveErrorMessage(produtoResult.error, 'Falha ao carregar produtos.')
        );
      }

      const devices = (deviceResult.data ?? []) as GuiaDeviceIO[];
      const connections = (connectionResult.data ?? []) as GuiaDeviceIOConnection[];
      const produtosRaw = (produtoResult.data ?? []) as any[];
      
      console.log('[useGuiaConexoesData] Primeira resposta de produto (raw):', produtosRaw[0]);
      console.log('[useGuiaConexoesData] Chaves do produto:', Object.keys(produtosRaw[0] ?? {}));

      const produtos = produtosRaw.map((p) => ({
        new_produtoservicoid: p.new_produtoservicoid,
        new_name:
          p.new_name ||
          p.cr22f_name ||
          p.displayname ||
          `Produto ${p.new_produtoservicoid?.substring(0, 8)}`,
        new_referenciadoproduto: p.new_referenciadoproduto,
        _new_produto_value: p._new_produto_value,
        new_quantidade: p.new_quantidade,
      })) as GuiaProdutoServico[];

      if (produtosRaw.length > 0) {
        console.log('[useGuiaConexoesData] Primeiro produto raw completo:', produtosRaw[0]);
        console.log('[useGuiaConexoesData] Campos disponíveis:', Object.keys(produtosRaw[0]));
        console.log('[useGuiaConexoesData] Produto mapeado:', produtos[0]);
      }

      const modelIds = new Set<string>();
      const modelReferences = new Set<string>();
      devices.forEach((device) => {
        if (device._new_modelodeproduto_value) {
          modelIds.add(device._new_modelodeproduto_value);
        }
      });
      produtos.forEach((produto) => {
        if (produto._new_produto_value) {
          modelIds.add(produto._new_produto_value);
        } else if (produto.new_referenciadoproduto) {
          modelReferences.add(produto.new_referenciadoproduto);
        }
      });

      const [modelosById, modelosByRef] = await Promise.all([
        loadModelos(Array.from(modelIds)),
        loadModelosByReference(Array.from(modelReferences)),
      ]);
      const modelos = new Map<string, GuiaModeloProduto>();
      modelosById.forEach((modelo) => {
        modelos.set(modelo.cr22f_modelosdeprodutofromsharepointlistid, modelo);
      });
      modelosByRef.forEach((modelo) => {
        if (!modelos.has(modelo.cr22f_modelosdeprodutofromsharepointlistid)) {
          modelos.set(modelo.cr22f_modelosdeprodutofromsharepointlistid, modelo);
        }
      });

      setData({
        devices,
        connections,
        produtos,
        modelos: Array.from(modelos.values()),
      });
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao carregar dados.'));
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, [loadModelos, projectId, searchTerm, locationFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      ...data,
      loading,
      error,
      reload: load,
      updateDevice,
    }),
    [data, loading, error, load, updateDevice]
  );
};
