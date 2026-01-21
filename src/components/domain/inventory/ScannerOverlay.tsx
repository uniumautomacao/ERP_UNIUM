import { Button, Card, Text, makeStyles, tokens } from '@fluentui/react-components';
import { QrCode24Regular, Stop24Regular, Delete24Regular, Checkmark24Regular } from '@fluentui/react-icons';
import type { RefObject } from 'react';

const useStyles = makeStyles({
  container: {
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
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface ScannerOverlayProps {
  videoRef: RefObject<HTMLVideoElement>;
  isScanning: boolean;
  scannedCount: number;
  error?: string | null;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onProcess: () => void;
}

export function ScannerOverlay({
  videoRef,
  isScanning,
  scannedCount,
  error,
  onStart,
  onStop,
  onClear,
  onProcess,
}: ScannerOverlayProps) {
  const styles = useStyles();

  return (
    <Card style={{ padding: '16px' }}>
      <div className={styles.container}>
        <div className={styles.videoWrapper}>
          <video ref={videoRef} className={styles.video} muted playsInline />
        </div>
        <Text size={200}>
          {scannedCount > 0 ? `${scannedCount} código(s) lido(s)` : 'Nenhum código lido ainda.'}
        </Text>
        <div className={styles.actions}>
          <Button appearance="primary" icon={<QrCode24Regular />} onClick={onStart} disabled={isScanning}>
            {isScanning ? 'Lendo...' : 'Iniciar leitura'}
          </Button>
          <Button appearance="secondary" icon={<Stop24Regular />} onClick={onStop} disabled={!isScanning}>
            Parar leitura
          </Button>
          <Button appearance="secondary" icon={<Delete24Regular />} onClick={onClear} disabled={scannedCount === 0}>
            Limpar códigos
          </Button>
          <Button appearance="primary" icon={<Checkmark24Regular />} onClick={onProcess} disabled={scannedCount === 0}>
            Processar leituras
          </Button>
        </div>
        {error && (
          <Text size={200} className={styles.error}>
            {error}
          </Text>
        )}
      </div>
    </Card>
  );
}
