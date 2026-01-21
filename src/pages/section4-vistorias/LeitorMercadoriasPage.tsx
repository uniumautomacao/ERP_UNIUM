import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Field, Input, MessageBar, Text, tokens } from '@fluentui/react-components';
import {
  ArrowSync24Regular,
  Checkmark24Regular,
  QrCode24Regular,
  Edit24Regular,
  Delete24Regular,
  Keyboard24Regular,
  Dismiss24Regular,
  CheckmarkSquare24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { AtualizarMercadoriaDialog } from '../../components/domain/inventory/AtualizarMercadoriaDialog';
import { MercadoriasList } from '../../components/domain/inventory/MercadoriasList';
import { ScannerOverlay } from '../../components/domain/inventory/ScannerOverlay';
import { useMultiBarcodeScanner } from '../../hooks/inventory/useMultiBarcodeScanner';
import { useMercadoriaReader } from '../../hooks/inventory/useMercadoriaReader';
import { imprimirEtiquetas } from '../../services/powerAutomate/printLabelFlow';
import { getMercadoriaSituacaoTexto } from '../../utils/inventory/statusUtils';
import type { MercadoriaLida } from '../../types';

type MessageState = { intent: 'info' | 'error' | 'success'; text: string } | null;

export function LeitorMercadoriasPage() {
  const scanner = useMultiBarcodeScanner();
  const { fetchMercadorias, atualizarUltimaLeitura, registrarLeituras, ativarMercadorias, atualizarNumeroSerie, atualizarEndereco } = useMercadoriaReader();

  const [mercadorias, setMercadorias] = useState<MercadoriaLida[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [bluetoothValue, setBluetoothValue] = useState('');
  const bluetoothInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessCodes = useCallback(async () => {
    if (scanner.parsedCodes.length === 0) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const items = await fetchMercadorias(scanner.parsedCodes);
      if (!items.length) {
        setMessage({ intent: 'info', text: 'Nenhuma mercadoria encontrada para os códigos lidos.' });
        return;
      }

      const ids = items.map((item) => item.id);
      await atualizarUltimaLeitura(ids);
      await registrarLeituras(ids);

      const numericMap = new Map<number, string>();
      const textMap = new Map<string, string>();
      scanner.parsedCodes.forEach((code) => {
        if (code.isNumeric) {
          numericMap.set(Number(code.value), code.value);
        } else {
          textMap.set(code.value, code.value);
        }
      });

      const merged = items.map((item) => ({
        ...item,
        situacao: getMercadoriaSituacaoTexto(item),
        leituraCodigo: item.etiqueta && numericMap.has(item.etiqueta)
          ? numericMap.get(item.etiqueta)
          : item.numeroSerie && textMap.has(item.numeroSerie)
            ? textMap.get(item.numeroSerie)
            : undefined,
      }));

      setMercadorias(merged);
      scanner.clearCodes();
      setMessage({ intent: 'success', text: `${merged.length} mercadoria(s) carregada(s).` });
    } catch (err: any) {
      console.error('[LeitorMercadorias] erro ao processar códigos:', err);
      setMessage({ intent: 'error', text: err?.message || 'Erro ao processar códigos.' });
    } finally {
      setIsProcessing(false);
    }
  }, [scanner, fetchMercadorias, atualizarUltimaLeitura, registrarLeituras]);

  const handleActivate = useCallback(async (id: string) => {
    const item = mercadorias.find((record) => record.id === id);
    if (!item) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      await ativarMercadorias([item]);
      setMercadorias((prev) => prev.map((record) => (record.id === id ? { ...record, status: 0 } : record)));
      setMessage({ intent: 'success', text: 'Mercadoria ativada com sucesso.' });
    } catch (err: any) {
      console.error('[LeitorMercadorias] erro ao ativar:', err);
      setMessage({ intent: 'error', text: err?.message || 'Erro ao ativar mercadoria.' });
    } finally {
      setIsProcessing(false);
    }
  }, [mercadorias, ativarMercadorias]);

  const handleActivateAll = useCallback(async () => {
    if (!mercadorias.length) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      await ativarMercadorias(mercadorias);
      setMercadorias((prev) => prev.map((record) => ({ ...record, status: 0, tagConfirmadaBool: true, situacao: 'Ativo' })));
      setMessage({ intent: 'success', text: 'Todas as mercadorias foram ativadas.' });
    } catch (err: any) {
      console.error('[LeitorMercadorias] erro ao ativar em lote:', err);
      setMessage({ intent: 'error', text: err?.message || 'Erro ao ativar mercadorias.' });
    } finally {
      setIsProcessing(false);
    }
  }, [mercadorias, ativarMercadorias]);

  const handleRefresh = useCallback(async () => {
    if (mercadorias.length === 0) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      // Cria uma lista de códigos baseada no que está na tela para re-buscar
      const codes = mercadorias.map(m => ({
        value: m.leituraCodigo || (m.etiqueta ? String(m.etiqueta) : m.numeroSerie || ''),
        isNumeric: !!m.etiqueta && !isNaN(Number(m.leituraCodigo))
      })).filter(c => c.value);

      const items = await fetchMercadorias(codes as any);
      
      const numericMap = new Map<number, string>();
      const textMap = new Map<string, string>();
      codes.forEach((code) => {
        if (code.isNumeric) {
          numericMap.set(Number(code.value), code.value);
        } else {
          textMap.set(code.value, code.value);
        }
      });

      const merged = items.map((item) => ({
        ...item,
        situacao: getMercadoriaSituacaoTexto(item),
        leituraCodigo: item.etiqueta && numericMap.has(item.etiqueta)
          ? numericMap.get(item.etiqueta)
          : item.numeroSerie && textMap.has(item.numeroSerie)
            ? textMap.get(item.numeroSerie)
            : undefined,
      }));

      setMercadorias(merged);
      setMessage({ intent: 'success', text: 'Dados atualizados.' });
    } catch (err: any) {
      console.error('[LeitorMercadorias] erro ao dar refresh:', err);
      setMessage({ intent: 'error', text: 'Erro ao atualizar dados.' });
    } finally {
      setIsProcessing(false);
    }
  }, [mercadorias, fetchMercadorias]);

  const handleOpenUpdateDialog = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    setDialogOpen(true);
  }, []);

  const handleUpdateSerial = useCallback(async (ids: string[], serial: string) => {
    setIsProcessing(true);
    setMessage(null);

    try {
      await atualizarNumeroSerie(ids, serial);
      setMercadorias((prev) =>
        prev.map((record) => (ids.includes(record.id) ? { ...record, numeroSerie: serial } : record))
      );
      setMessage({ intent: 'success', text: 'Número de série atualizado.' });
    } catch (err: any) {
      console.error('[LeitorMercadorias] erro ao atualizar serial:', err);
      setMessage({ intent: 'error', text: err?.message || 'Erro ao atualizar número de série.' });
    } finally {
      setIsProcessing(false);
    }
  }, [atualizarNumeroSerie]);

  const handleUpdateEndereco = useCallback(async (ids: string[], endereco: string) => {
    setIsProcessing(true);
    setMessage(null);

    try {
      await atualizarEndereco(ids, endereco);
      await registrarLeituras(ids, endereco);
      setMercadorias((prev) =>
        prev.map((record) => (ids.includes(record.id) ? { ...record, endereco } : record))
      );
      setMessage({ intent: 'success', text: 'Endereço atualizado.' });
    } catch (err: any) {
      console.error('[LeitorMercadorias] erro ao atualizar endereço:', err);
      setMessage({ intent: 'error', text: err?.message || 'Erro ao atualizar endereço.' });
    } finally {
      setIsProcessing(false);
    }
  }, [atualizarEndereco, registrarLeituras]);

  const handleReprint = useCallback(async (ids: string[]) => {
    setIsProcessing(true);
    setMessage(null);
    try {
      await imprimirEtiquetas(ids);
      setMessage({ intent: 'success', text: 'Solicitação de impressão enviada.' });
    } catch (err: any) {
      console.error('[LeitorMercadorias] erro ao reimprimir:', err);
      setMessage({ intent: 'error', text: err?.message || 'Erro ao reimprimir etiqueta.' });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const commandBarActions = useMemo(() => ([
    {
      id: 'scan',
      label: 'Ler mercadorias',
      icon: <QrCode24Regular />,
      onClick: scanner.startScan,
      appearance: 'primary' as const,
      disabled: scanner.isScanning,
    },
    {
      id: 'process',
      label: 'Processar leitura',
      icon: <Checkmark24Regular />,
      onClick: handleProcessCodes,
      disabled: scanner.parsedCodes.length === 0 || isProcessing,
    },
  ]), [scanner, handleProcessCodes, isProcessing]);

  const secondaryActions = useMemo(() => ([
    {
      id: 'ativar-todas',
      label: 'Ativar todas',
      icon: <CheckmarkSquare24Regular />,
      onClick: handleActivateAll,
      disabled: mercadorias.length === 0 || isProcessing,
    },
    {
      id: 'refresh',
      label: 'Atualizar dados',
      icon: <ArrowSync24Regular />,
      onClick: handleRefresh,
      disabled: mercadorias.length === 0 || isProcessing,
    },
    {
      id: 'atualizar-info',
      label: 'Atualizar informações (todas)',
      icon: <Edit24Regular />,
      onClick: () => handleOpenUpdateDialog(mercadorias.map((item) => item.id)),
      disabled: mercadorias.length === 0 || isProcessing,
    },
    {
      id: 'limpar-lista',
      label: 'Limpar lista',
      icon: <Delete24Regular />,
      onClick: () => setMercadorias([]),
      disabled: mercadorias.length === 0 || isProcessing,
    },
  ]), [mercadorias, handleActivateAll, handleOpenUpdateDialog, isProcessing]);

  const handleBluetoothSubmit = useCallback(() => {
    const value = bluetoothValue.trim();
    if (!value) return;
    scanner.addCode(value);
    setBluetoothValue('');
  }, [bluetoothValue, scanner]);

  return (
    <>
      <CommandBar primaryActions={commandBarActions} secondaryActions={secondaryActions} />
      <PageHeader
        title="Leitor de Mercadorias"
        subtitle={`Mercadorias lidas: ${mercadorias.length}`}
      />
      <PageContainer>
        {message && (
          <MessageBar intent={message.intent} style={{ marginBottom: tokens.spacingVerticalM }}>
            {message.text}
          </MessageBar>
        )}

        <ScannerOverlay
          videoRef={scanner.videoRef}
          isScanning={scanner.isScanning}
          scannedCount={scanner.parsedCodes.length}
          error={scanner.error}
          onStart={scanner.startScan}
          onStop={scanner.stopScan}
          onClear={scanner.clearCodes}
          onProcess={handleProcessCodes}
        />

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Field label="Leitor Bluetooth">
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: tokens.spacingVerticalXS }}>
              Foque no campo abaixo e leia os códigos. O leitor enviará Enter automaticamente.
            </Text>
            <div className="flex flex-wrap gap-2">
              <Input
                ref={bluetoothInputRef}
                value={bluetoothValue}
                onChange={(_, data) => setBluetoothValue(data.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleBluetoothSubmit();
                  }
                }}
                placeholder="Leia um código com o leitor Bluetooth"
              />
              <Button
                appearance="secondary"
                icon={<Keyboard24Regular />}
                onClick={() => bluetoothInputRef.current?.focus()}
              >
                Ativar leitor
              </Button>
              <Button
                appearance="primary"
                onClick={handleBluetoothSubmit}
                disabled={!bluetoothValue.trim()}
              >
                Adicionar
              </Button>
            </div>
          </Field>
        </div>

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Text weight="semibold" block>
            Códigos lidos ({scanner.parsedCodes.length})
          </Text>
          {scanner.parsedCodes.length === 0 ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Nenhum código lido ainda.
            </Text>
          ) : (
            <div className="flex flex-col gap-2" style={{ marginTop: tokens.spacingVerticalS }}>
              {scanner.parsedCodes.map((code) => (
                <div
                  key={code.value}
                  className="flex items-center justify-between gap-2"
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${tokens.colorNeutralStroke2}`,
                    borderRadius: 6,
                    background: tokens.colorNeutralBackground1,
                  }}
                >
                  <Text size={200}>{code.value}</Text>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    aria-label={`Remover código ${code.value}`}
                    onClick={() => scanner.removeCode(code.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: tokens.spacingVerticalL }}>
          {mercadorias.length === 0 ? (
            <EmptyState
              title="Nenhuma mercadoria carregada"
              description="Leia os códigos de barras para listar as mercadorias."
              actionLabel="Iniciar leitura"
              onAction={scanner.startScan}
            />
          ) : (
            <MercadoriasList
              items={mercadorias}
              onActivate={handleActivate}
              onUpdateInfo={(id) => handleOpenUpdateDialog([id])}
            />
          )}
        </div>

        <AtualizarMercadoriaDialog
          open={dialogOpen}
          selectedIds={selectedIds}
          isLoading={isProcessing}
          onClose={() => setDialogOpen(false)}
          onUpdateSerial={handleUpdateSerial}
          onUpdateEndereco={handleUpdateEndereco}
          onReprint={handleReprint}
        />
      </PageContainer>
    </>
  );
}
