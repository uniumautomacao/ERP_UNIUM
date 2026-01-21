import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import { parseBarcodes } from '../../utils/inventory/barcodeParser';
import type { ParsedBarcode } from '../../types';

interface UseMultiBarcodeScannerProps {
  onScan?: (codes: ParsedBarcode[]) => void;
}

export const useMultiBarcodeScanner = ({ onScan }: UseMultiBarcodeScannerProps = {}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawCodes, setRawCodes] = useState<string[]>([]);

  const parsedCodes = useMemo(() => parseBarcodes(rawCodes), [rawCodes]);

  const stopScan = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }, []);

  const clearCodes = useCallback(() => setRawCodes([]), []);
  const addCode = useCallback((value: string) => {
    if (!value) return;
    setRawCodes((prev) => (prev.includes(value) ? prev : [...prev, value]));
  }, []);
  const removeCode = useCallback((value: string) => {
    if (!value) return;
    setRawCodes((prev) => prev.filter((code) => code !== value));
  }, []);

  const startScan = useCallback(async () => {
    if (isScanning) return;
    setError(null);

    if (!window.isSecureContext) {
      setError('A câmera exige HTTPS ou localhost para funcionar.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador não oferece suporte à câmera.');
      return;
    }

    if (!videoRef.current) {
      setError('Não foi possível inicializar o preview da câmera.');
      return;
    }

    try {
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;

      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          const value = result.getText();
            addCode(value);
        } else if (err) {
          const shouldIgnore =
            err instanceof NotFoundException ||
            err instanceof ChecksumException ||
            err instanceof FormatException;
          if (!shouldIgnore) {
            setError('Erro ao ler o QR Code. Tente novamente.');
          }
        }
      });

      controlsRef.current = controls;
      setIsScanning(true);
    } catch (scanError: any) {
      console.error('Erro ao iniciar leitura do QR Code:', scanError);
      setError('Não foi possível acessar a câmera. Verifique a permissão.');
      setIsScanning(false);
    }
  }, [isScanning]);

  useEffect(() => {
    if (onScan) onScan(parsedCodes);
  }, [onScan, parsedCodes]);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  return {
    videoRef,
    isScanning,
    error,
    rawCodes,
    parsedCodes,
    startScan,
    stopScan,
    clearCodes,
    addCode,
    removeCode,
  };
};
