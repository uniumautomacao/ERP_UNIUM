export const escapeODataValue = (value: string) => value.replace(/'/g, "''");

export const chunkIds = (ids: string[], chunkSize: number) => {
  if (chunkSize <= 0) {
    return [ids];
  }

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }
  return chunks;
};

export const buildOrFilter = (fieldName: string, ids: string[]) => {
  return ids
    .map((id) => `${fieldName} eq ${escapeODataValue(id)}`)
    .join(' or ');
};
