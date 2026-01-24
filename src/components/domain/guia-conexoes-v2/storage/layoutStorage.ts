import type { Node, Viewport } from 'reactflow';

export interface LayoutState {
  canvasDeviceIds: string[];
  nodePositions: Record<string, { x: number; y: number }>;
  viewport: Viewport;
  autoLayoutEnabled: boolean;
}

const STORAGE_KEY_PREFIX = 'guiaConexoesV2:layout:';

export function getStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

export function loadLayoutFromStorage(projectId: string): LayoutState | null {
  try {
    const key = getStorageKey(projectId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as LayoutState;
  } catch (err) {
    console.error('Erro ao carregar layout do localStorage:', err);
    return null;
  }
}

export async function saveLayoutToStorage(
  projectId: string,
  layout: LayoutState
): Promise<void> {
  try {
    const key = getStorageKey(projectId);
    localStorage.setItem(key, JSON.stringify(layout));
  } catch (err) {
    console.error('Erro ao salvar layout no localStorage:', err);
    throw err;
  }
}

export function clearLayoutFromStorage(projectId: string): void {
  try {
    const key = getStorageKey(projectId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Erro ao limpar layout do localStorage:', err);
  }
}
