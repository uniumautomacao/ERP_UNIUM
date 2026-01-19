import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  ProgressBar,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { QrCode24Regular } from '@fluentui/react-icons';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/shared/LoadingState';
import { useCurrentSystemUser } from '../../hooks/useCurrentSystemUser';
import {
  Cr22fEstoqueFromSharepointListService,
  NewContagemEstoqueService,
} from '../../generated';

type ViewState = 'home' | 'scanner' | 'form' | 'list' | 'success';

type EstoqueItem = {
  cr22f_estoquefromsharepointlistid: string;
  new_referenciadoproduto?: string;
  cr22f_title?: string;
  cr22f_querytag?: number;
  new_ultimacontagem?: string;
  new_classecriticidade?: number;
  new_quantidade?: number;
  statecode?: number;
  new_endereco?: string;
  new_depositotexto?: string;
  new_ruatexto?: string;
  new_estantetexto?: string;
  new_prateleiratexto?: string;
  new_etiquetaemtextocalculated?: string;
};

const CLASS_THRESHOLDS: Record<number, number> = {
  100000000: 20,
  100000001: 40,
  100000002: 60,
};

const TIPO_CONTAGEM = {
  Rotina: 100000000,
  Surpresa: 100000001,
};

const SITUACAO_CONTAGEM = {
  Pendente: 100000000,
  Validada: 100000001,
};

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
  },
  bigButton: {
    height: '40vh',
    minHeight: '220px',
    fontSize: tokens.fontSizeBase500,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
  },
  actionsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  infoBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
  warningText: {
    color: tokens.colorPaletteYellowForeground1,
  },
  successText: {
    color: tokens.colorPaletteGreenForeground1,
  },
  listGroupTitle: {
    margin: `${tokens.spacingVerticalM} 0 ${tokens.spacingVerticalS}`,
    color: tokens.colorNeutralForeground3,
  },
  listItem: {
    cursor: 'pointer',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    display: 'inline-block',
  },
});

const extractQueryTag = (raw: string) => {
  const parts = raw.trim().split('|');
  return parts[0]?.trim() || null;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const daysDiff = (from: Date, to: Date) => {
  const diff = to.getTime() - from.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const buildEnderecoCompleto = (item: EstoqueItem) => {
  if (item.new_endereco) return item.new_endereco;
  if (item.new_etiquetaemtextocalculated) return item.new_etiquetaemtextocalculated;
  const parts = [
    item.new_depositotexto,
    item.new_ruatexto,
    item.new_estantetexto,
    item.new_prateleiratexto,
  ].filter(Boolean);
  return parts.length ? parts.join('-') : 'Endereço não informado';
};

const getClassThreshold = (classe?: number) => {
  if (!classe) return 60;
  return CLASS_THRESHOLDS[classe] ?? 60;
};

const getDueLimitDate = (now: Date, classe?: number) => {
  const threshold = getClassThreshold(classe);
  const limit = new Date(now);
  limit.setDate(limit.getDate() - threshold);
  return limit;
};

const getCountStatus = (item: EstoqueItem, now: Date) => {
  if (!item.new_ultimacontagem) {
    return { label: 'Atrasado', color: tokens.colorPaletteRedForeground1, overdueDays: 999 };
  }
  const last = new Date(item.new_ultimacontagem);
  if (isSameDay(last, now)) {
    return { label: 'Contado hoje', color: tokens.colorPaletteGreenForeground1, overdueDays: 0 };
  }
  const threshold = getClassThreshold(item.new_classecriticidade);
  const atraso = daysDiff(last, now) - threshold;
  if (atraso > 5) {
    return { label: `${atraso} dias de atraso`, color: tokens.colorPaletteRedForeground1, overdueDays: atraso };
  }
  return { label: 'No prazo', color: tokens.colorPaletteYellowForeground1, overdueDays: atraso };
};

const buildListaDoDiaFilter = (now: Date) => {
  const limitA = getDueLimitDate(now, 100000000).toISOString();
  const limitB = getDueLimitDate(now, 100000001).toISOString();
  const limitC = getDueLimitDate(now, 100000002).toISOString();
  return [
    'statecode eq 0',
    'and (',
    'new_ultimacontagem eq null',
    `or (new_classecriticidade eq 100000000 and new_ultimacontagem le ${limitA})`,
    `or (new_classecriticidade eq 100000001 and new_ultimacontagem le ${limitB})`,
    `or (new_classecriticidade eq 100000002 and new_ultimacontagem le ${limitC})`,
    ')',
  ].join(' ');
};

const buildDayRange = (now: Date) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

export function ContagemEstoqueMobilePage() {
  const styles = useStyles();
  const { systemUserId, loading: userLoading, error: userError } = useCurrentSystemUser();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const successTimerRef = useRef<number | null>(null);

  const [view, setView] = useState<ViewState>('home');
  const [qrText, setQrText] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [expectedTag, setExpectedTag] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmacao, setConfirmacao] = useState<{ sku: string; quantidade: number } | null>(null);

  const [listaLoading, setListaLoading] = useState(false);
  const [listaError, setListaError] = useState<string | null>(null);
  const [listaDoDia, setListaDoDia] = useState<EstoqueItem[]>([]);

  const [contagensHoje, setContagensHoje] = useState(0);
  const [contagensLoading, setContagensLoading] = useState(false);

  const stopScan = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }, []);

  const resetFlow = useCallback(() => {
    stopScan();
    setQrText('');
    setScanError(null);
    setSelectedItem(null);
    setExpectedTag(null);
    setQuantidade('');
    setObservacao('');
    setConfirmacao(null);
  }, [stopScan]);

  useEffect(() => {
    return () => {
      stopScan();
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, [stopScan]);

  const loadContagensHoje = useCallback(async () => {
    if (!systemUserId) return;
    setContagensLoading(true);
    try {
      const { start, end } = buildDayRange(new Date());
      const result = await NewContagemEstoqueService.getAll({
        filter: `new_datacontagem ge ${start} and new_datacontagem le ${end} and _new_usuario_value eq '${systemUserId}'`,
        select: ['new_contagemestoqueid'],
      });
      setContagensHoje(result.data?.length ?? 0);
    } catch (err: any) {
      console.error('[ContagemEstoque] erro ao carregar contagens do dia:', err);
    } finally {
      setContagensLoading(false);
    }
  }, [systemUserId]);

  useEffect(() => {
    if (systemUserId) {
      void loadContagensHoje();
    }
  }, [loadContagensHoje, systemUserId]);

  const loadListaDoDia = useCallback(async () => {
    setListaLoading(true);
    setListaError(null);
    try {
      const now = new Date();
      const result = await Cr22fEstoqueFromSharepointListService.getAll({
        filter: buildListaDoDiaFilter(now),
        select: [
          'cr22f_estoquefromsharepointlistid',
          'new_referenciadoproduto',
          'cr22f_title',
          'cr22f_querytag',
          'new_ultimacontagem',
          'new_classecriticidade',
          'new_endereco',
          'new_depositotexto',
          'new_ruatexto',
          'new_estantetexto',
          'new_prateleiratexto',
          'new_etiquetaemtextocalculated',
        ],
        orderBy: [
          'new_ultimacontagem asc',
          'new_deposito asc',
          'new_rua asc',
          'new_estante asc',
          'new_prateleira asc',
        ],
        top: 150,
      });
      setListaDoDia((result.data ?? []) as EstoqueItem[]);
    } catch (err: any) {
      console.error('[ContagemEstoque] erro ao carregar lista do dia:', err);
      setListaError(err.message || 'Erro ao carregar lista do dia.');
    } finally {
      setListaLoading(false);
    }
  }, []);

  const startScan = useCallback(async () => {
    if (isScanning) return;
    setScanError(null);
    setQrText('');

    if (!window.isSecureContext) {
      setScanError('A câmera exige HTTPS ou localhost para funcionar.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('Este navegador não oferece suporte à câmera.');
      return;
    }

    if (!videoRef.current) {
      setScanError('Não foi possível inicializar o preview da câmera.');
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
            const text = result.getText();
            setQrText(text);
            const tag = extractQueryTag(text);
            if (!tag) {
              setScanError('QR Code inválido. Tag não encontrada.');
              return;
            }
            if (expectedTag && expectedTag !== tag) {
              setScanError(`QR Code não corresponde à tag selecionada (Lido: ${tag}).`);
              return;
            }
            navigator.vibrate?.(50);
            stopScan();
            void loadItemByTag(tag);
            return;
          }

          if (err && !(err instanceof NotFoundException)) {
            setScanError('Erro ao ler o QR Code. Tente novamente.');
          }
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);
    } catch (scanError: any) {
      console.error('Erro ao iniciar leitura do QR Code:', scanError);
      setScanError('Não foi possível acessar a câmera. Verifique a permissão.');
      setIsScanning(false);
    }
  }, [expectedTag, isScanning, stopScan]);

  const loadItemByTag = useCallback(async (tag: string) => {
    setPageError(null);
    setSelectedItem(null);
    try {
      const result = await Cr22fEstoqueFromSharepointListService.getAll({
        filter: `cr22f_querytag eq ${tag}`,
        select: [
          'cr22f_estoquefromsharepointlistid',
          'new_referenciadoproduto',
          'cr22f_title',
          'cr22f_querytag',
          'new_ultimacontagem',
          'new_classecriticidade',
          'new_quantidade',
          'statecode',
          'new_endereco',
          'new_depositotexto',
          'new_ruatexto',
          'new_estantetexto',
          'new_prateleiratexto',
          'new_etiquetaemtextocalculated',
        ],
        top: 1,
      });

      const item = result.data?.[0] as EstoqueItem | undefined;
      if (!item) {
        setPageError(`Produto com Tag ${tag} não encontrado no Dataverse.`);
        setView('home');
        return;
      }
      if (item.statecode !== undefined && item.statecode !== 0) {
        setPageError('Este produto está inativo no sistema.');
        setView('home');
        return;
      }
      setSelectedItem(item);
      setQuantidade('');
      setObservacao('');
      setView('form');
    } catch (err: any) {
      console.error('[ContagemEstoque] erro ao carregar item:', err);
      setPageError(err.message || 'Erro ao buscar item no Dataverse.');
      setView('home');
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedItem || !systemUserId) return;
    const quantidadeNumero = Number(quantidade);
    if (Number.isNaN(quantidadeNumero)) {
      setPageError('Informe uma quantidade válida.');
      return;
    }
    setIsSaving(true);
    setPageError(null);

    try {
      const now = new Date();
      const sku = selectedItem.new_referenciadoproduto ?? '';
      const endereco = buildEnderecoCompleto(selectedItem);
      const esperada = selectedItem.new_quantidade ?? 0;
      const divergencia = quantidadeNumero - esperada;
      const limite = getDueLimitDate(now, selectedItem.new_classecriticidade);
      const inLista = !selectedItem.new_ultimacontagem || new Date(selectedItem.new_ultimacontagem) <= limite;
      const tipoContagem = inLista ? TIPO_CONTAGEM.Rotina : TIPO_CONTAGEM.Surpresa;
      const situacao = divergencia === 0 ? SITUACAO_CONTAGEM.Validada : SITUACAO_CONTAGEM.Pendente;

      const payload: Record<string, any> = {
        'new_ItemEstoque@odata.bind': `/cr22f_estoquefromsharepointlists(${selectedItem.cr22f_estoquefromsharepointlistid})`,
        'new_Usuario@odata.bind': `/systemusers(${systemUserId})`,
        new_sku: sku,
        new_enderecocompleto: endereco,
        new_datacontagem: now.toISOString(),
        new_quantidadecontada: quantidadeNumero,
        new_quantidadeesperada: esperada,
        new_tipocontagem: tipoContagem,
        new_situacao: situacao,
        new_observacao: observacao || undefined,
      };

      await NewContagemEstoqueService.create(payload);
      await Cr22fEstoqueFromSharepointListService.update(selectedItem.cr22f_estoquefromsharepointlistid, {
        new_ultimacontagem: now.toISOString(),
      });

      setConfirmacao({ sku: sku || 'SKU', quantidade: quantidadeNumero });
      setView('success');
      navigator.vibrate?.(80);
      void loadContagensHoje();
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = window.setTimeout(() => {
        resetFlow();
        setView('home');
      }, 2000);
    } catch (err: any) {
      console.error('[ContagemEstoque] erro ao salvar contagem:', err);
      setPageError(err.message || 'Erro ao salvar contagem.');
    } finally {
      setIsSaving(false);
    }
  }, [loadContagensHoje, observacao, quantidade, resetFlow, selectedItem, systemUserId]);

  const groupedLista = useMemo(() => {
    const map = new Map<string, EstoqueItem[]>();
    listaDoDia.forEach((item) => {
      const key = buildEnderecoCompleto(item);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [listaDoDia]);

  const renderHome = () => (
    <div className={styles.container}>
      {pageError && (
        <Text className={styles.errorText}>{pageError}</Text>
      )}
      {userError && (
        <Text className={styles.errorText}>{userError}</Text>
      )}
      <Card className={styles.card}>
        <div className="flex flex-col gap-4 p-4">
          <Button
            appearance="primary"
            className={styles.bigButton}
            icon={<QrCode24Regular />}
            onClick={() => {
              resetFlow();
              setView('scanner');
            }}
          >
            BIPAR PRODUTO
          </Button>
          <Button
            appearance="secondary"
            onClick={() => {
              resetFlow();
              setView('list');
              void loadListaDoDia();
            }}
          >
            VER LISTA DO DIA
          </Button>
        </div>
      </Card>
      <Card className={styles.card}>
        <div className="flex flex-col gap-3 p-4">
          <Text weight="semibold">Progresso do dia</Text>
          <div className="flex items-center justify-between">
            <Text size={200}>Contagens hoje</Text>
            {contagensLoading ? (
              <Spinner size="tiny" />
            ) : (
              <Text weight="semibold">{contagensHoje}</Text>
            )}
          </div>
          <ProgressBar value={Math.min(contagensHoje / 100, 1)} />
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Lista do dia: {listaDoDia.length} itens carregados
          </Text>
        </div>
      </Card>
    </div>
  );

  const renderScanner = () => (
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
          <div className={styles.actionsRow}>
            <Button appearance="primary" onClick={startScan} disabled={isScanning}>
              {qrText ? 'Ler novamente' : 'Iniciar leitura'}
            </Button>
            <Button appearance="secondary" onClick={stopScan} disabled={!isScanning}>
              Parar
            </Button>
            <Button
              appearance="subtle"
              onClick={() => {
                stopScan();
                setView('home');
              }}
            >
              Voltar
            </Button>
          </div>
          {scanError && <Text className={styles.errorText}>{scanError}</Text>}
          {expectedTag && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Item selecionado (Tag): {expectedTag}
            </Text>
          )}
        </div>
      </Card>
    </div>
  );

  const renderForm = () => {
    if (!selectedItem) return null;
    const endereco = buildEnderecoCompleto(selectedItem);
    const classe = selectedItem.new_classecriticidade
      ? ['A', 'B', 'C'][selectedItem.new_classecriticidade - 100000000] ?? 'N/A'
      : 'N/A';
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className="flex flex-col gap-3 p-4">
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              SKU
            </Text>
            <Text weight="semibold" size={400}>
              {selectedItem.new_referenciadoproduto || 'SKU não informado'}
            </Text>
            <Text>{selectedItem.cr22f_title || 'Produto sem descrição'}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              📍 {endereco}
            </Text>
            <div className={styles.infoBox}>
              <Text size={200}>🏷️ Classe: {classe}</Text>
              <Text size={200}>
                📅 Última: {selectedItem.new_ultimacontagem
                  ? new Date(selectedItem.new_ultimacontagem).toLocaleDateString('pt-BR')
                  : 'Nunca contado'}
              </Text>
            </div>
            <Field label="Quantidade encontrada">
              <Input
                value={quantidade}
                type="number"
                inputMode="numeric"
                placeholder="0"
                onChange={(e) => setQuantidade(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Observação (opcional)">
              <Textarea
                value={observacao}
                onChange={(_, data) => setObservacao(data.value)}
                placeholder="Observações sobre a contagem"
                resize="vertical"
              />
            </Field>
            {pageError && <Text className={styles.errorText}>{pageError}</Text>}
            <div className={styles.actionsRow}>
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={!quantidade || isSaving || userLoading || !systemUserId}
              >
                {isSaving ? 'Salvando...' : 'SALVAR'}
              </Button>
              <Button
                appearance="secondary"
                onClick={() => {
                  resetFlow();
                  setView('home');
                }}
              >
                Pular
              </Button>
              <Button
                appearance="subtle"
                onClick={() => {
                  resetFlow();
                  setView('home');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderList = () => (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <Text weight="semibold">Lista do dia</Text>
            <Button appearance="subtle" onClick={loadListaDoDia} disabled={listaLoading}>
              Atualizar
            </Button>
          </div>
          {listaLoading && <Spinner label="Carregando lista..." />}
          {listaError && <Text className={styles.errorText}>{listaError}</Text>}
          {!listaLoading && listaDoDia.length === 0 && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Nenhum item pendente hoje.
            </Text>
          )}
          {groupedLista.map(([grupo, itens]) => (
            <div key={grupo}>
              <Text size={200} className={styles.listGroupTitle}>
                {grupo} ({itens.length} itens)
              </Text>
              <div className="flex flex-col gap-2">
                {itens.map((item) => {
                  const status = getCountStatus(item, new Date());
                  return (
                    <Card
                      key={item.cr22f_estoquefromsharepointlistid}
                      className={`${styles.listItem} card-interactive`}
                      onClick={() => {
                        resetFlow();
                        if (item.cr22f_querytag) {
                          setExpectedTag(String(item.cr22f_querytag));
                        }
                        setView('scanner');
                      }}
                    >
                      <div className="flex flex-col gap-1 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={styles.statusDot}
                              style={{ backgroundColor: status.color }}
                              aria-hidden="true"
                            />
                            <Text weight="semibold">{item.new_referenciadoproduto || 'SKU'}</Text>
                          </div>
                          <Text size={200}>{status.label}</Text>
                        </div>
                        <div className="flex flex-col gap-0">
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            Tag: {item.cr22f_querytag || '---'}
                          </Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            📍 {buildEnderecoCompleto(item)}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          <div className={styles.actionsRow}>
            <Button
              appearance="subtle"
              onClick={() => {
                resetFlow();
                setView('home');
              }}
            >
              Voltar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSuccess = () => (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className="flex flex-col items-center gap-3 p-6">
          <Text size={800} className={styles.successText}>
            ✓
          </Text>
          <Text weight="semibold" size={500}>
            CONTAGEM REGISTRADA!
          </Text>
          {confirmacao && (
            <>
              <Text>{confirmacao.sku}</Text>
              <Text>Quantidade: {confirmacao.quantidade}</Text>
            </>
          )}
          <div className={styles.actionsRow}>
            <Button
              appearance="primary"
              onClick={() => {
                resetFlow();
                setView('scanner');
              }}
            >
              BIPAR PRÓXIMO
            </Button>
            <Button
              appearance="secondary"
              onClick={() => {
                resetFlow();
                setView('home');
              }}
            >
              VOLTAR AO INÍCIO
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  if (userLoading && view !== 'success') {
    return (
      <>
        <CommandBar primaryActions={[]} />
        <PageHeader title="Contagem de Estoque" subtitle="Preparando ambiente..." />
        <PageContainer>
          <LoadingState label="Carregando usuário..." />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <CommandBar primaryActions={[]} />
      <PageHeader
        title="Contagem de Estoque"
        subtitle="Leitura obrigatória do QR Code para registrar contagens"
      />
      <PageContainer>
        {view === 'home' && renderHome()}
        {view === 'scanner' && renderScanner()}
        {view === 'form' && renderForm()}
        {view === 'list' && renderList()}
        {view === 'success' && renderSuccess()}
      </PageContainer>
    </>
  );
}
