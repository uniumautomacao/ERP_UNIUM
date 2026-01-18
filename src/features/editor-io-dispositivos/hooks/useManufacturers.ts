import { useCallback, useEffect, useState } from 'react';
import { Cr22fFabricantesfromsharpointlistService } from '../generated/services/Cr22fFabricantesfromsharpointlistService';
import type { Manufacturer } from '../types';

const escapeODataValue = (value: string) => value.replace(/'/g, "''");

export const useManufacturers = (search: string) => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const searchTerm = search.trim();
      const filterParts = ['statecode eq 0', 'cr22f_title ne null'];
      if (searchTerm) {
        filterParts.push(`contains(cr22f_title, '${escapeODataValue(searchTerm)}')`);
      }

      const result = await Cr22fFabricantesfromsharpointlistService.getAll({
        select: [
          'cr22f_title',
          'cr22f_fabricantesfromsharpointlistid',
        ],
        filter: filterParts.join(' and '),
        orderBy: ['cr22f_title asc'],
        top: 500,
      });

      setManufacturers((result.data ?? []) as Manufacturer[]);
    } catch (err) {
      setError('Falha ao carregar fabricantes.');
      console.error('Falha ao carregar fabricantes:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    manufacturers,
    loading,
    error,
    reload: load,
  };
};
