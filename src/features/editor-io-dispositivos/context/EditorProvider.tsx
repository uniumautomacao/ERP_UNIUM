import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Connection, DeviceIOTemplate, Dimensions, Product } from '../types';
import { useConnectionTypes } from '../hooks/useConnectionTypes';
import { useDeviceTemplate } from '../hooks/useDeviceTemplate';
import { EditorContext } from './EditorContext';
import type { EditorContextValue } from './EditorContext';

interface EditorProviderProps {
  product: Product | null;
  children: React.ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ product, children }) => {
  const { template: baseTemplate, save, loading: saving, error } = useDeviceTemplate(product);
  const { typeOptions, directionOptions } = useConnectionTypes();
  const [template, setTemplate] = useState<DeviceIOTemplate | null>(baseTemplate);
  const [isDirty, setIsDirty] = useState(false);
  const productId = product?.cr22f_modelosdeprodutofromsharepointlistid;
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<DeviceIOTemplate | null>(null);

  // Reset template when switching products or when baseTemplate changes
  useEffect(() => {
    setTemplate(baseTemplate);
    setIsDirty(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingSaveRef.current = null;
  }, [productId, baseTemplate]);

  // Auto-save function with debounce
  const autoSave = useCallback(
    async (templateToSave: DeviceIOTemplate, immediate = false) => {
      if (!product) {
        return;
      }

      pendingSaveRef.current = templateToSave;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const performSave = async () => {
        if (pendingSaveRef.current) {
          try {
            await save(pendingSaveRef.current);
            setIsDirty(false);
            pendingSaveRef.current = null;
          } catch (err) {
            console.error('Falha ao salvar automaticamente:', err);
            setIsDirty(true);
          }
        }
      };

      if (immediate) {
        await performSave();
      } else {
        saveTimeoutRef.current = setTimeout(performSave, 500);
      }
    },
    [save, product]
  );

  const setDimensions = useCallback(
    (dims: Dimensions) => {
      setTemplate((prev) => {
        if (!prev) {
          return prev;
        }
        const updated = { ...prev, Dimensions: dims };
        setIsDirty(true);
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const setRackCategory = useCallback(
    (category: string) => {
      setTemplate((prev) => {
        if (!prev) {
          return prev;
        }
        const updated = { ...prev, RackCategory: category };
        setIsDirty(true);
        autoSave(updated);
        return updated;
      });
    },
    [autoSave]
  );

  const addConnection = useCallback(
    (connection: Connection) => {
      setTemplate((prev) => {
        if (!prev) {
          return prev;
        }
        const updated = { ...prev, Connections: [...prev.Connections, connection] };
        setIsDirty(true);
        autoSave(updated, true); // Save immediately when adding connection
        return updated;
      });
    },
    [autoSave]
  );

  const updateConnection = useCallback(
    (index: number, connection: Connection) => {
      setTemplate((prev) => {
        if (!prev) {
          return prev;
        }
        const nextConnections = prev.Connections.map((item, idx) =>
          idx === index ? connection : item
        );
        const updated = { ...prev, Connections: nextConnections };
        setIsDirty(true);
        autoSave(updated, true); // Save immediately when updating connection
        return updated;
      });
    },
    [autoSave]
  );

  const removeConnection = useCallback(
    (index: number) => {
      setTemplate((prev) => {
        if (!prev) {
          return prev;
        }
        const nextConnections = prev.Connections.filter((_, idx) => idx !== index);
        const updated = { ...prev, Connections: nextConnections };
        setIsDirty(true);
        autoSave(updated, true); // Save immediately when removing connection
        return updated;
      });
    },
    [autoSave]
  );

  const handleSave = useCallback(async () => {
    if (!template) {
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await save(template);
    setIsDirty(false);
    pendingSaveRef.current = null;
  }, [save, template]);

  const discard = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setTemplate(baseTemplate ?? null);
    setIsDirty(false);
    pendingSaveRef.current = null;
  }, [baseTemplate]);

  const value = useMemo<EditorContextValue>(
    () => ({
      template,
      isDirty,
      connectionTypes: typeOptions,
      connectionDirections: directionOptions,
      setDimensions,
      setRackCategory,
      addConnection,
      updateConnection,
      removeConnection,
      save: handleSave,
      discard,
      saving,
      error,
    }),
    [
      template,
      isDirty,
      typeOptions,
      directionOptions,
      setDimensions,
      setRackCategory,
      addConnection,
      updateConnection,
      removeConnection,
      handleSave,
      discard,
      saving,
      error,
    ]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
