import { createContext, useContext } from 'react';
import type { Connection, DeviceIOTemplate, Dimensions } from '../types';

export interface EditorContextValue {
  template: DeviceIOTemplate | null;
  isDirty: boolean;
  connectionTypes: { value: number; label: string }[];
  connectionDirections: { value: number; label: string }[];
  setDimensions: (dims: Dimensions) => void;
  setRackCategory: (category: string) => void;
  addConnection: (connection: Connection) => void;
  updateConnection: (index: number, connection: Connection) => void;
  removeConnection: (index: number) => void;
  save: () => Promise<void>;
  discard: () => void;
  saving: boolean;
  error: string;
}

export const EditorContext = createContext<EditorContextValue | undefined>(undefined);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext deve ser usado dentro do EditorProvider.');
  }
  return context;
};