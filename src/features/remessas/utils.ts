export const escapeODataString = (value: string) => value.replace(/'/g, "''");

export const buildRemessaSearchFilter = (searchText: string) => {
  const trimmed = searchText.trim();
  if (!trimmed) return '';
  const safe = escapeODataString(trimmed);
  const fields = [
    'new_nomedofornecedorfx',
    'new_nomedatransportadora',
    'new_notas',
    'new_codigoderastreio',
    'new_id',
  ];
  return `(${fields.map((field) => `contains(${field}, '${safe}')`).join(' or ')})`;
};

export const buildProdutoServicoSearchFilter = (searchText: string) => {
  const trimmed = searchText.trim();
  if (!trimmed) return '';
  const safe = escapeODataString(trimmed);
  const fields = [
    'new_referenciadoproduto',
    'new_descricao',
    'new_nomedofabricante',
    'new_nomedoclientefx',
    'new_apelidodoprojetofx',
  ];
  return `(${fields.map((field) => `contains(${field}, '${safe}')`).join(' or ')})`;
};

export const chunkIds = (items: string[], chunkSize: number) => {
  const chunks: string[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};
