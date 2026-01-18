import { useCallback, useEffect, useState } from 'react';
import { Cr22fModelosdeProdutoFromSharepointListService } from '../../generated/services/Cr22fModelosdeProdutoFromSharepointListService';
import type { DeviceIOProduct } from '../../types';

const escapeODataValue = (value: string) => value.replace(/'/g, "''");

export const useDeviceIOProducts = (manufacturerId: string | null, search: string) => {
  const [products, setProducts] = useState<DeviceIOProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!manufacturerId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const escaped = escapeODataValue(manufacturerId);
      const searchTerm = search.trim();
      const filterParts = [
        'statecode eq 0',
        'cr22f_title ne null',
        `_new_fabricante_value eq ${escaped}`,
      ];
      if (searchTerm) {
        filterParts.push(`contains(cr22f_title, '${escapeODataValue(searchTerm)}')`);
      }

      const result = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
        select: [
          'cr22f_modelosdeprodutofromsharepointlistid',
          'cr22f_title',
          'cr22f_queryfabricante',
          'new_nomedofabricante',
          'new_deviceiotemplatejson',
        ],
        filter: filterParts.join(' and '),
        orderBy: ['cr22f_title asc'],
        top: 500,
      });

      setProducts((result.data ?? []) as DeviceIOProduct[]);
    } catch (err) {
      setError('Falha ao carregar produtos.');
      console.error('Falha ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, [manufacturerId, search]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    products,
    loading,
    error,
    reload: load,
  };
};
