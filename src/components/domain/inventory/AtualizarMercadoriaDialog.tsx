import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Tab,
  TabList,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { QrCode24Regular, Print24Regular } from '@fluentui/react-icons';
import { useMultiBarcodeScanner } from '../../../hooks/inventory/useMultiBarcodeScanner';
import { parseEnderecoCodigo } from '../../../utils/inventory/enderecoParser';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
  },
  helper: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  actionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
});

interface AtualizarMercadoriaDialogProps {
  open: boolean;
  selectedIds: string[];
  isLoading?: boolean;
  onClose: () => void;
  onUpdateSerial: (ids: string[], serial: string) => Promise<void>;
  onUpdateEndereco: (ids: string[], endereco: string) => Promise<void>;
  onReprint: (ids: string[]) => Promise<void>;
}

export function AtualizarMercadoriaDialog({
  open,
  selectedIds,
  isLoading,
  onClose,
  onUpdateSerial,
  onUpdateEndereco,
  onReprint,
}: AtualizarMercadoriaDialogProps) {
  const styles = useStyles();
  const isBulk = selectedIds.length > 1;
  const [selectedTab, setSelectedTab] = useState<'serial' | 'endereco'>('serial');
  const [serialValue, setSerialValue] = useState('');
  const [enderecoValue, setEnderecoValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isBulk) {
      setSelectedTab('endereco');
    } else {
      setSelectedTab('serial');
    }
  }, [isBulk, open]);

  const scanner = useMultiBarcodeScanner({
    onScan: (codes) => {
      const latest = codes[codes.length - 1]?.value;
      if (!latest) return;
      if (selectedTab === 'serial') {
        setSerialValue(latest);
      } else {
        setEnderecoValue(latest);
      }
    },
  });

  const enderecoValidation = useMemo(
    () => (enderecoValue ? parseEnderecoCodigo(enderecoValue) : null),
    [enderecoValue]
  );

  useEffect(() => {
    if (open) {
      setFeedback(null);
    } else {
      scanner.stopScan();
    }
  }, [open, scanner]);

  const handleUpdateSerial = async () => {
    const value = serialValue.trim();
    if (!value) {
      setFeedback('Informe o número de série.');
      return;
    }
    setFeedback(null);
    await onUpdateSerial(selectedIds, value);
  };

  const handleUpdateEndereco = async () => {
    const value = enderecoValue.trim();
    if (!value) {
      setFeedback('Informe o endereço.');
      return;
    }
    if (!enderecoValidation?.valido) {
      setFeedback(enderecoValidation?.erro ?? 'Endereço inválido.');
      return;
    }
    setFeedback(null);
    await onUpdateEndereco(selectedIds, value);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Atualizar informações</DialogTitle>
          <DialogContent className={styles.content}>
            <Text size={200} className={styles.helper}>
              {selectedIds.length} mercadoria(s) selecionada(s)
            </Text>

            <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as 'serial' | 'endereco')}>
              {!isBulk && <Tab value="serial">Número de série</Tab>}
              <Tab value="endereco">Endereço</Tab>
            </TabList>

            <div className={styles.videoWrapper}>
              <video ref={scanner.videoRef} className={styles.video} muted playsInline />
            </div>

            <div className={styles.actionRow}>
              <Button appearance="primary" icon={<QrCode24Regular />} onClick={scanner.startScan} disabled={scanner.isScanning || isLoading}>
                {scanner.isScanning ? 'Lendo...' : 'Iniciar leitura'}
              </Button>
              <Button appearance="secondary" onClick={scanner.stopScan} disabled={!scanner.isScanning}>
                Parar leitura
              </Button>
              <Button appearance="secondary" icon={<Print24Regular />} onClick={() => onReprint(selectedIds)} disabled={isLoading}>
                Reimprimir etiqueta
              </Button>
            </div>

            {scanner.error && <Text size={200} className={styles.error}>{scanner.error}</Text>}
            {feedback && <Text size={200} className={styles.error}>{feedback}</Text>}

            {selectedTab === 'serial' ? (
              <Field label="Número de série">
                <Input value={serialValue} onChange={(_, data) => setSerialValue(data.value)} placeholder="Ex: SN123456" />
              </Field>
            ) : (
              <Field label="Endereço (CD-DEP-RUA-EST-PRAT)">
                <Input value={enderecoValue} onChange={(_, data) => setEnderecoValue(data.value)} placeholder="Ex: U1-A-01-E1-P1" />
                {enderecoValidation && !enderecoValidation.valido && (
                  <Text size={200} className={styles.error}>
                    {enderecoValidation.erro}
                  </Text>
                )}
              </Field>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Fechar
            </Button>
            {selectedTab === 'serial' ? (
              <Button appearance="primary" onClick={handleUpdateSerial} disabled={isLoading}>
                Atualizar número de série
              </Button>
            ) : (
              <Button appearance="primary" onClick={handleUpdateEndereco} disabled={isLoading}>
                Atualizar endereço
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
