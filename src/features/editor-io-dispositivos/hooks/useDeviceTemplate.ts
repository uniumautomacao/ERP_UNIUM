import { useCallback, useEffect, useState } from 'react';
import { Cr22fModelosdeprodutofromsharepointlistService } from '../generated/services/Cr22fModelosdeprodutofromsharepointlistService';
import type { DeviceIOTemplate, Product } from '../types';
import { parseTemplate, serializeTemplate } from '../utils/jsonTemplate';

export const useDeviceTemplate = (product: Product | null) => {
  const [template, setTemplate] = useState<DeviceIOTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product) {
      setTemplate(null);
      return;
    }

    setTemplate(parseTemplate(product.new_deviceiotemplatejson));
  }, [product]);

  const save = useCallback(
    async (nextTemplate: DeviceIOTemplate) => {
      if (!product) {
        return;
      }

      setLoading(true);
      setError('');
      try {
        await Cr22fModelosdeprodutofromsharepointlistService.update(
          product.cr22f_modelosdeprodutofromsharepointlistid,
          {
            new_deviceiotemplatejson: serializeTemplate(nextTemplate),
          }
        );
      } catch (err) {
        setError('Falha ao salvar o template.');
        console.error('Falha ao salvar o template:', err);
      } finally {
        setLoading(false);
      }
    },
    [product]
  );

  return {
    template,
    setTemplate,
    loading,
    error,
    save,
  };
};
