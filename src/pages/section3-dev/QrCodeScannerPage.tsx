import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { QrCode24Regular } from '@fluentui/react-icons';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
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
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  resultBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
  },
  hintText: {
    color: tokens.colorNeutralForeground3,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
});

export function QrCodeScannerPage() {
  const styles = useStyles();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [qrText, setQrText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const stopScan = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    if (isScanning) return;
    setError(null);
    setQrText('');

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

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            setQrText(result.getText());
            stopScan();
            return;
          }

          if (err && !(err instanceof NotFoundException)) {
            setError('Erro ao ler o QR Code. Tente novamente.');
          }
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);
    } catch (scanError: any) {
      console.error('Erro ao iniciar leitura do QR Code:', scanError);
      setError('Não foi possível acessar a câmera. Verifique a permissão.');
      setIsScanning(false);
    }
  }, [isScanning, stopScan]);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  return (
    <>
      <CommandBar primaryActions={[]} />
      <PageHeader
        title="Leitor de QR Code"
        subtitle="Use a câmera do celular para ler um QR Code"
      />
      <PageContainer>
        <div className={styles.container}>
          <Card className={styles.card}>
            <CardHeader
              image={<QrCode24Regular />}
              header={<Text weight="semibold">Câmera</Text>}
              description={<Text size={200}>Aponte para o QR Code</Text>}
            />
            <div className="flex flex-col gap-4 p-4">
              <div className={styles.videoWrapper}>
                <video ref={videoRef} className={styles.video} muted playsInline />
              </div>
              <div className={styles.actions}>
                <Button appearance="primary" onClick={startScan} disabled={isScanning}>
                  {qrText ? 'Ler novamente' : 'Iniciar leitura'}
                </Button>
                <Button appearance="secondary" onClick={stopScan} disabled={!isScanning}>
                  Parar
                </Button>
              </div>
              {error && (
                <Text size={200} className={styles.errorText}>
                  {error}
                </Text>
              )}
            </div>
          </Card>

          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">Texto do QR Code</Text>}
              description={<Text size={200}>Resultado da leitura</Text>}
            />
            <div className="p-4">
              <div className={styles.resultBox}>
                {qrText ? (
                  <Text>{qrText}</Text>
                ) : (
                  <Text size={200} className={styles.hintText}>
                    Nenhum QR Code lido ainda.
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
