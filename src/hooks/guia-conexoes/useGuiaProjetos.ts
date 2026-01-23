import { useCallback, useEffect, useState } from 'react';
import { Cr22fProjetoService } from '../../generated/services/Cr22fProjetoService';
import type { GuiaProjeto } from '../../types/guiaConexoes';
import { resolveErrorMessage } from '../../utils/guia-conexoes/errors';
import { escapeODataValue } from '../../utils/guia-conexoes/odata';

const DEFAULT_PAGE_SIZE = 100;

const buildProjectFilter = (term: string) => {
  const normalized = term.trim();
  if (!normalized) {
    return 'statecode eq 0';
  }

  const escaped = escapeODataValue(normalized);
  return `statecode eq 0 and contains(cr22f_apelido, '${escaped}')`;
};

export const useGuiaProjetos = (searchTerm: string) => {
  const [projects, setProjects] = useState<GuiaProjeto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await Cr22fProjetoService.getAll({
        select: [
          'cr22f_projetoid',
          'cr22f_apelido',
          'cr22f_ano',
          'new_datadeconclusaodoguiadeconexoes',
        ],
        filter: buildProjectFilter(searchTerm),
        orderBy: ['cr22f_apelido asc'],
        top: DEFAULT_PAGE_SIZE,
      });

      if (!result.success) {
        throw new Error(
          resolveErrorMessage(result.error, 'Falha ao carregar projetos.')
        );
      }

      setProjects((result.data ?? []) as GuiaProjeto[]);
    } catch (err) {
      setError(resolveErrorMessage(err, 'Falha ao carregar projetos.'));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    projects,
    loading,
    error,
    reload: load,
  };
};
