export type GuiaConexoesV2Layout = {
  viewport: { x: number; y: number; zoom: number };
};

const STORAGE_PREFIX = 'guiaConexoesV2:layout:';

export const getLayoutStorageKey = (projectId: string) => `${STORAGE_PREFIX}${projectId}`;

export const loadLayout = (projectId: string): GuiaConexoesV2Layout | null => {
  if (!projectId) return null;
  try {
    const raw = localStorage.getItem(getLayoutStorageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuiaConexoesV2Layout;
    if (!parsed) {
      return null;
    }
    return {
      viewport: parsed.viewport ?? { x: 0, y: 0, zoom: 1 },
    };
  } catch (error) {
    console.warn('[GuiaConexoesV2] Falha ao carregar layout:', error);
    return null;
  }
};

export const saveLayout = (projectId: string, layout: GuiaConexoesV2Layout) => {
  if (!projectId) return;
  try {
    localStorage.setItem(getLayoutStorageKey(projectId), JSON.stringify(layout));
  } catch (error) {
    console.warn('[GuiaConexoesV2] Falha ao salvar layout:', error);
  }
};
