import { RMA_STAGE_OWNER_LABELS } from './constants';

export const escapeODataString = (value: string) => value.replace(/'/g, "''");

export const buildRmaSearchFilter = (searchText: string) => {
  const trimmed = searchText.trim();
  if (!trimmed) {
    return '';
  }
  const safe = escapeODataString(trimmed);
  const fields = [
    'new_assistenciatecnica',
    'new_descricao',
    'new_observacoes',
    'new_nomedoclientefx',
    'new_projetoapelidofx',
    'new_codigoderastreiodatransportadora',
  ];

  return `(${fields.map((field) => `contains(${field}, '${safe}')`).join(' or ')})`;
};

export const getStageOwnerLabel = (stageValue?: number) => {
  if (!stageValue) {
    return 'CS';
  }
  return RMA_STAGE_OWNER_LABELS[stageValue] ?? 'CS';
};
