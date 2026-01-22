/**
 * Utilitarios para construir filtros OData delegaveis para queries do Dataverse
 */

/**
 * Constroi filtro de busca por apelido ou ano (delegavel)
 */
export function buildProjectSearchFilter(searchTerm: string): string {
  if (!searchTerm.trim()) {
    return "";
  }

  const term = searchTerm.trim().replace(/'/g, "''");

  // Busca por apelido OU ano
  return `(contains(cr22f_apelido, '${term}') or contains(cr22f_ano, '${term}'))`;
}

/**
 * Constroi filtro para ordens de servico de um projeto
 */
export function buildWorkOrdersByProjectFilter(projectId: string): string {
  return `_new_projeto_value eq ${projectId}`;
}

/**
 * Constroi filtro para s3objects por multiplos IDs de ordem de servico (delegavel)
 */
export function buildS3ObjectsByWorkOrdersFilter(workOrderIds: string[]): string {
  if (workOrderIds.length === 0) {
    return "1 eq 0";
  }

  if (workOrderIds.length === 1) {
    return `_new_ordemdeservico_value eq ${workOrderIds[0]}`;
  }

  const filters = workOrderIds.map(
    (id) => `_new_ordemdeservico_value eq ${id}`
  );
  return `(${filters.join(" or ")})`;
}

/**
 * Constroi filtro para ultima foto de um projeto
 */
export function buildLastPhotoFilter(workOrderIds: string[]): string {
  const baseFilter = buildS3ObjectsByWorkOrdersFilter(workOrderIds);

  if (baseFilter === "1 eq 0") {
    return baseFilter;
  }

  return `${baseFilter} and new_isimage eq true`;
}

/**
 * Constroi filtro para busca universal de fotos (delegavel)
 */
export function buildUniversalPhotoSearchFilter(searchTerm: string): string {
  const baseFilter = "_new_ordemdeservico_value ne null";

  if (!searchTerm.trim()) {
    return baseFilter;
  }

  const term = searchTerm.trim().replace(/'/g, "''");

  const searchFilter = `(contains(new_nomedoremetente, '${term}') or contains(new_nomedocliente, '${term}') or contains(new_wazzupmessagetext, '${term}') or contains(new_id, '${term}') or contains(new_nomedoprojeto, '${term}'))`;

  return `${baseFilter} and ${searchFilter}`;
}

/**
 * Constroi filtro para busca de midias no album (delegavel)
 */
export function buildAlbumMediaSearchFilter(searchTerm: string): string {
  if (!searchTerm.trim()) {
    return "";
  }

  const term = searchTerm.trim().replace(/'/g, "''");

  return `(contains(new_nomedoremetente, '${term}') or contains(new_nomedocliente, '${term}') or contains(new_wazzupmessagetext, '${term}') or contains(new_id, '${term}'))`;
}
