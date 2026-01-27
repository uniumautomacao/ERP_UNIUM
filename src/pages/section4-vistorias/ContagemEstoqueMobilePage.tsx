import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Spinner,
  Switch,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Search24Regular,
  QrCode24Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  Keyboard24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
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
  NewContagemDoDiaItemService,
  NewContagemDoDiaService,
  NewAppPreferenceService,
  NewRegistrodeLeituradeMercadoriaemEstoqueService,
} from '../../generated';
import { parseEnderecoCodigo } from '../../utils/inventory/enderecoParser';
import {
  buildDayRange,
  buildSearchClause,
  buildListaDoDiaFilter,
  DEFAULT_CONTAGEM_THRESHOLDS,
  toDateOnlyString,
} from '../../utils/inventory/contagemListaDoDia';

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
  new_datadaultimaleitura?: string;
};

type PendingItem = {
  item: EstoqueItem;
  quantidadeContada: number;
  timestamp: Date;
};

type SnapshotInfo = {
  id: string;
  dateKey: string;
  esperados: number;
  contados: number;
};

type SnapshotItemRecord = {
  new_contagemdodiaitemid: string;
  new_contado?: boolean;
  _new_snapshot_value?: string;
  _new_itemestoque_value?: string;
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
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: tokens.spacingHorizontalS,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  pendingBanner: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  pendingItemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
  },
  bluetoothSection: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
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

const extractNextSkipToken = (result: any) => {
  const directToken =
    result?.skipToken ??
    result?.skiptoken ??
    result?.SkipToken ??
    result?.['@odata.skipToken'];
  if (typeof directToken === 'string' && directToken) {
    return directToken;
  }

  const nextLink =
    result?.nextLink ??
    result?.nextlink ??
    result?.NextLink ??
    result?.['@odata.nextLink'] ??
    result?.['odata.nextLink'];
  if (typeof nextLink === 'string' && nextLink) {
    const match = nextLink.match(/(?:\\$skiptoken|%24skiptoken)=([^&]+)/i);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
};

const buildOrFilter = (field: string, ids: string[]) => {
  if (!ids.length) return '';
  return ids.map((id) => `${field} eq '${id}'`).join(' or ');
};

const getClassThreshold = (classe: number | undefined, thresholds: typeof DEFAULT_CONTAGEM_THRESHOLDS) => {
  if (!classe) return thresholds.C;
  if (classe === 100000000) return thresholds.A;
  if (classe === 100000001) return thresholds.B;
  return thresholds.C;
};

const getDueLimitDate = (now: Date, classe: number | undefined, thresholds: typeof DEFAULT_CONTAGEM_THRESHOLDS) => {
  const threshold = getClassThreshold(classe, thresholds);
  const limit = new Date(now);
  limit.setDate(limit.getDate() - threshold);
  return limit;
};

const getCountStatus = (item: EstoqueItem, now: Date, thresholds: typeof DEFAULT_CONTAGEM_THRESHOLDS) => {
  if (!item.new_ultimacontagem) {
    return { label: 'Atrasado', color: tokens.colorPaletteRedForeground1, overdueDays: 999, countedToday: false };
  }
  const last = new Date(item.new_ultimacontagem);
  if (isSameDay(last, now)) {
    return { label: 'Contado hoje', color: tokens.colorPaletteGreenForeground1, overdueDays: 0, countedToday: true };
  }
  const threshold = getClassThreshold(item.new_classecriticidade, thresholds);
  const atraso = daysDiff(last, now) - threshold;
  if (atraso > 5) {
    return { label: `${atraso} dias de atraso`, color: tokens.colorPaletteRedForeground1, overdueDays: atraso, countedToday: false };
  }
  return { label: 'No prazo', color: tokens.colorPaletteYellowForeground1, overdueDays: atraso, countedToday: false };
};

const MAX_LISTA_ITENS = 200;

// Verifica se o código é um endereço (formato CD-DEP-RUA-EST-PRAT)
const isEnderecoCodigo = (codigo: string): boolean => {
  const result = parseEnderecoCodigo(codigo);
  return result.valido;
};

export function ContagemEstoqueMobilePage() {
  const styles = useStyles();
  const { systemUserId, loading: userLoading, error: userError } = useCurrentSystemUser();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const bluetoothInputRef = useRef<HTMLInputElement | null>(null);

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
  const [thresholds, setThresholds] = useState(DEFAULT_CONTAGEM_THRESHOLDS);
  const [snapshotInfo, setSnapshotInfo] = useState<SnapshotInfo | null>(null);
  const snapshotInfoRef = useRef<SnapshotInfo | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [expandAll, setExpandAll] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Novo: Input Bluetooth
  const [bluetoothValue, setBluetoothValue] = useState('');
  
  // Novo: Itens pendentes de persistência (bipados mas ainda não confirmados com endereço)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  
  // Novo: Modal para quantidade quando > 1
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [quantityDialogItem, setQuantityDialogItem] = useState<EstoqueItem | null>(null);
  const [quantityDialogValue, setQuantityDialogValue] = useState('');

  // Novo: Message feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{ intent: 'info' | 'success' | 'error' | 'warning'; text: string } | null>(null);

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

  useEffect(() => {
    snapshotInfoRef.current = snapshotInfo;
  }, [snapshotInfo]);

  const loadThresholds = useCallback(async () => {
    try {
      const result = await NewAppPreferenceService.getAll({
        filter: "startswith(new_preferencekey, 'contagem_threshold_')",
        select: ['new_preferencekey', 'new_integervalue'],
      });
      const next = { ...DEFAULT_CONTAGEM_THRESHOLDS };
      (result.data ?? []).forEach((item: any) => {
        if (item.new_preferencekey === 'contagem_threshold_A') next.A = item.new_integervalue ?? next.A;
        if (item.new_preferencekey === 'contagem_threshold_B') next.B = item.new_integervalue ?? next.B;
        if (item.new_preferencekey === 'contagem_threshold_C') next.C = item.new_integervalue ?? next.C;
      });
      setThresholds(next);
      return next;
    } catch (err) {
      console.warn('[ContagemEstoque] Falha ao carregar thresholds. Usando padrão.');
      return DEFAULT_CONTAGEM_THRESHOLDS;
    }
  }, []);

  useEffect(() => {
    void loadThresholds();
  }, [loadThresholds]);

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


  const loadListaDoDia = useCallback(async (search?: string, onlyPending?: boolean) => {
    setListaLoading(true);
    setListaError(null);
    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      const todayStartISO = todayStart.toISOString();
      const todayEndISO = todayEnd.toISOString();
      const baseFilter = "statecode eq 0 and new_tagconfirmadabool eq true and cr22f_status ne 'Entregue' and new_separado ne true";

      const select = [
        'cr22f_estoquefromsharepointlistid',
        'new_referenciadoproduto',
        'cr22f_title',
        'cr22f_querytag',
        'new_ultimacontagem',
        'new_classecriticidade',
        'new_quantidade',
        'new_endereco',
        'new_depositotexto',
        'new_ruatexto',
        'new_estantetexto',
        'new_prateleiratexto',
        'new_etiquetaemtextocalculated',
        'new_datadaultimaleitura',
      ];

      const countedTodayFilter = `${baseFilter} and new_ultimacontagem ge ${todayStartISO} and new_ultimacontagem le ${todayEndISO}${buildSearchClause(search)}`;
      const pendingFilter = buildListaDoDiaFilter(now, thresholds, search);

      const countedTodayPromise = onlyPending
        ? Promise.resolve({ data: [] })
        : Cr22fEstoqueFromSharepointListService.getAll({
          filter: countedTodayFilter,
          select,
          orderBy: ['new_ultimacontagem desc'],
          top: MAX_LISTA_ITENS,
        });

      const pendingPromise = Cr22fEstoqueFromSharepointListService.getAll({
        filter: pendingFilter,
        select,
        orderBy: [
          'new_ultimacontagem asc',
          'new_deposito asc',
          'new_rua asc',
          'new_estante asc',
          'new_prateleira asc',
        ],
        top: MAX_LISTA_ITENS,
      });

      const [countedTodayResult, pendingResult] = await Promise.all([countedTodayPromise, pendingPromise]);
      const countedTodayItems = (countedTodayResult.data ?? []) as EstoqueItem[];
      const pendingItems = (pendingResult.data ?? []) as EstoqueItem[];

      const merged: EstoqueItem[] = [];
      const seen = new Set<string>();

      const pushItems = (items: EstoqueItem[]) => {
        for (const item of items) {
          if (merged.length >= MAX_LISTA_ITENS) break;
          const id = item.cr22f_estoquefromsharepointlistid;
          if (seen.has(id)) continue;
          merged.push(item);
          seen.add(id);
        }
      };

      if (!onlyPending) {
        pushItems(countedTodayItems);
      }
      pushItems(pendingItems);

      setListaDoDia(merged);
    } catch (err: any) {
      console.error('[ContagemEstoque] erro ao carregar lista do dia:', err);
      setListaError(err.message || 'Erro ao carregar lista do dia.');
    } finally {
      setListaLoading(false);
    }
  }, [thresholds]);

  const ensureDailySnapshot = useCallback(async (): Promise<SnapshotInfo | null> => {
    if (!systemUserId || snapshotLoading) return snapshotInfoRef.current;
    const now = new Date();
    const dateKey = toDateOnlyString(now);
    if (snapshotInfoRef.current?.dateKey === dateKey && snapshotInfoRef.current?.id) {
      return snapshotInfoRef.current;
    }

    setSnapshotLoading(true);
    try {
      const activeThresholds = await loadThresholds();
      const existing = await NewContagemDoDiaService.getAll({
        filter: `statecode eq 0 and new_data eq ${dateKey} and _new_usuario_value eq '${systemUserId}'`,
        select: ['new_contagemdodiaid', 'new_esperados', 'new_contados'],
        top: 1,
      });
      const existingRecord = (existing.data ?? [])[0] as any;
      if (existingRecord?.new_contagemdodiaid) {
        const info: SnapshotInfo = {
          id: existingRecord.new_contagemdodiaid,
          dateKey,
          esperados: existingRecord.new_esperados ?? 0,
          contados: existingRecord.new_contados ?? 0,
        };
        setSnapshotInfo(info);
        return info;
      }

      const select = [
        'cr22f_estoquefromsharepointlistid',
        'new_referenciadoproduto',
        'cr22f_title',
        'cr22f_querytag',
        'new_ultimacontagem',
        'new_classecriticidade',
        'new_quantidade',
        'new_endereco',
        'new_depositotexto',
        'new_ruatexto',
        'new_estantetexto',
        'new_prateleiratexto',
        'new_etiquetaemtextocalculated',
        'new_datadaultimaleitura',
      ];

      const pendingFilter = buildListaDoDiaFilter(now, activeThresholds);
      const expectedItems: EstoqueItem[] = [];
      let skipToken: string | null = null;
      do {
        const result = await Cr22fEstoqueFromSharepointListService.getAll({
          filter: pendingFilter,
          select,
          orderBy: ['new_ultimacontagem asc'],
          top: 500,
          ...(skipToken ? { skipToken } : {}),
        });
        expectedItems.push(...((result.data ?? []) as EstoqueItem[]));
        skipToken = extractNextSkipToken(result);
      } while (skipToken);

      const { start, end } = buildDayRange(now);
      const contagensResult = await NewContagemEstoqueService.getAll({
        filter: `new_datacontagem ge ${start} and new_datacontagem le ${end} and _new_usuario_value eq '${systemUserId}' and new_tipocontagem eq ${TIPO_CONTAGEM.Rotina}`,
        select: ['new_contagemestoqueid', '_new_itemestoque_value'],
        top: 500,
      });
      const contagensHoje = (contagensResult.data ?? []) as Array<{
        new_contagemestoqueid?: string;
        _new_itemestoque_value?: string;
      }>;

      const contadosSet = new Set<string>();
      const contagemPorItem = new Map<string, string>();
      contagensHoje.forEach((item) => {
        if (item._new_itemestoque_value) {
          contadosSet.add(item._new_itemestoque_value);
          if (item.new_contagemestoqueid && !contagemPorItem.has(item._new_itemestoque_value)) {
            contagemPorItem.set(item._new_itemestoque_value, item.new_contagemestoqueid);
          }
        }
      });

      const expectedMap = new Map<string, EstoqueItem>();
      expectedItems.forEach((item) => {
        expectedMap.set(item.cr22f_estoquefromsharepointlistid, item);
      });

      const missingIds = Array.from(contadosSet).filter((id) => !expectedMap.has(id));
      if (missingIds.length > 0) {
        for (let i = 0; i < missingIds.length; i += 50) {
          const chunk = missingIds.slice(i, i + 50);
          const filter = buildOrFilter('cr22f_estoquefromsharepointlistid', chunk);
          if (!filter) continue;
          const result = await Cr22fEstoqueFromSharepointListService.getAll({
            filter,
            select,
            top: chunk.length,
          });
          (result.data ?? []).forEach((item: any) => {
            if (item?.cr22f_estoquefromsharepointlistid) {
              expectedMap.set(item.cr22f_estoquefromsharepointlistid, item);
            }
          });
        }
      }

      const expectedList = Array.from(expectedMap.values());
      const esperados = expectedList.length;
      const contados = Array.from(contadosSet).filter((id) => expectedMap.has(id)).length;
      const percentual = esperados > 0 ? Math.round((contados / esperados) * 100) : 0;

      const snapshotResult = await NewContagemDoDiaService.create({
        new_data: dateKey,
        new_esperados: esperados,
        new_contados: contados,
        new_percentual: percentual,
        new_thresholda: activeThresholds.A,
        new_thresholdb: activeThresholds.B,
        new_thresholdc: activeThresholds.C,
        'new_Usuario@odata.bind': `/systemusers(${systemUserId})`,
      });

      const snapshotId = snapshotResult.data?.new_contagemdodiaid as string | undefined;
      if (!snapshotId) {
        console.error('[ContagemEstoque] Snapshot criado sem ID.');
        return null;
      }

      const batchSize = 50;
      for (let i = 0; i < expectedList.length; i += batchSize) {
        const batch = expectedList.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (item) => {
            const itemId = item.cr22f_estoquefromsharepointlistid;
            const contagemId = contagemPorItem.get(itemId);
            const payload: Record<string, any> = {
              'new_Snapshot@odata.bind': `/new_contagemdodias(${snapshotId})`,
              'new_ItemEstoque@odata.bind': `/cr22f_estoquefromsharepointlists(${itemId})`,
              new_sku: item.new_referenciadoproduto ?? item.cr22f_title,
              new_querytag: item.cr22f_querytag,
              new_endereco: buildEnderecoCompleto(item),
              new_classecriticidade: item.new_classecriticidade,
              new_ultimacontagemsnapshot: item.new_ultimacontagem,
              new_contado: contadosSet.has(itemId),
            };
            if (contagemId) {
              payload['new_Contagem@odata.bind'] = `/new_contagemestoques(${contagemId})`;
            }
            await NewContagemDoDiaItemService.create(payload);
          })
        );
      }

      const info: SnapshotInfo = { id: snapshotId, dateKey, esperados, contados };
      setSnapshotInfo(info);
      return info;
    } catch (err) {
      console.error('[ContagemEstoque] erro ao gerar snapshot do dia:', err);
      return null;
    } finally {
      setSnapshotLoading(false);
    }
  }, [loadThresholds, snapshotLoading, systemUserId]);

  const updateSnapshotForCount = useCallback(
    async (itemId: string, contagemId?: string) => {
      const snapshot = await ensureDailySnapshot();
      if (!snapshot?.id) return;

      try {
        const itemResult = await NewContagemDoDiaItemService.getAll({
          filter: `_new_snapshot_value eq '${snapshot.id}' and _new_itemestoque_value eq '${itemId}'`,
          select: ['new_contagemdodiaitemid', 'new_contado'],
          top: 1,
        });
        const item = (itemResult.data ?? [])[0] as SnapshotItemRecord | undefined;
        if (!item?.new_contagemdodiaitemid || item.new_contado) return;

        const updatePayload: Record<string, any> = { new_contado: true };
        if (contagemId) {
          updatePayload['new_Contagem@odata.bind'] = `/new_contagemestoques(${contagemId})`;
        }
        await NewContagemDoDiaItemService.update(item.new_contagemdodiaitemid, updatePayload);

        const current = snapshotInfoRef.current;
        if (!current || current.id !== snapshot.id) return;
        const nextContados = current.contados + 1;
        const nextPercentual = current.esperados > 0 ? Math.round((nextContados / current.esperados) * 100) : 0;
        setSnapshotInfo({
          ...current,
          contados: nextContados,
        });

        await NewContagemDoDiaService.update(snapshot.id, {
          new_contados: nextContados,
          new_percentual: nextPercentual,
        });
      } catch (err) {
        console.error('[ContagemEstoque] erro ao atualizar snapshot:', err);
      }
    },
    [ensureDailySnapshot]
  );

  useEffect(() => {
    if (systemUserId) {
      void ensureDailySnapshot();
    }
  }, [ensureDailySnapshot, systemUserId]);

  // Busca item por tag
  const fetchItemByTag = useCallback(async (tag: string): Promise<EstoqueItem | null> => {
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
          'new_datadaultimaleitura',
        ],
        top: 1,
      });

      const item = result.data?.[0] as EstoqueItem | undefined;
      return item || null;
    } catch (err: any) {
      console.error('[ContagemEstoque] erro ao buscar item por tag:', err);
      return null;
    }
  }, []);

  // Processa código bipado (pode ser produto ou endereço)
  const processScannedCode = useCallback(async (codigo: string) => {
    setFeedbackMessage(null);
    
    // Verifica se é um endereço
    if (isEnderecoCodigo(codigo)) {
      // É um endereço - persistir todos os itens pendentes com este endereço
      if (pendingItems.length === 0) {
        setFeedbackMessage({ intent: 'warning', text: 'Nenhum item bipado para confirmar. Bipe os produtos primeiro.' });
        navigator.vibrate?.([100, 50, 100]);
        return;
      }

      const parsedEndereco = parseEnderecoCodigo(codigo);
      if (!parsedEndereco.valido || !parsedEndereco.endereco) {
        setFeedbackMessage({ intent: 'error', text: 'Endereço inválido.' });
        return;
      }

      setIsSaving(true);
      setFeedbackMessage({ intent: 'info', text: `Salvando ${pendingItems.length} contagens...` });

      try {
        const now = new Date();
        const enderecoConfirmado = parsedEndereco.codigo!;

        for (const pending of pendingItems) {
          const { item, quantidadeContada } = pending;
          const sku = item.new_referenciadoproduto ?? '';
          const enderecoAtual = buildEnderecoCompleto(item);
          const esperada = item.new_quantidade ?? 0;
          const divergencia = quantidadeContada - esperada;
          const limite = getDueLimitDate(now, item.new_classecriticidade, thresholds);
          const inLista = !item.new_ultimacontagem || new Date(item.new_ultimacontagem) <= limite;
          const tipoContagem = inLista ? TIPO_CONTAGEM.Rotina : TIPO_CONTAGEM.Surpresa;
          const situacao = divergencia === 0 ? SITUACAO_CONTAGEM.Validada : SITUACAO_CONTAGEM.Pendente;

          // Criar registro de contagem
          const contagemPayload: Record<string, any> = {
            'new_ItemEstoque@odata.bind': `/cr22f_estoquefromsharepointlists(${item.cr22f_estoquefromsharepointlistid})`,
            'new_Usuario@odata.bind': `/systemusers(${systemUserId})`,
            new_sku: sku,
            new_enderecocompleto: enderecoConfirmado,
            new_datacontagem: now.toISOString(),
            new_quantidadecontada: quantidadeContada,
            new_quantidadeesperada: esperada,
            new_tipocontagem: tipoContagem,
            new_situacao: situacao,
          };

          const contagemResult = await NewContagemEstoqueService.create(contagemPayload);
          const contagemId = contagemResult.data?.new_contagemestoqueid as string | undefined;

          // Atualizar item de estoque
          const updatePayload: Record<string, any> = {
            new_ultimacontagem: now.toISOString(),
            new_datadaultimaleitura: now.toISOString()
          };

          // Se o endereço bipado for diferente do atual, atualizar
          if (enderecoConfirmado !== enderecoAtual) {
            updatePayload.new_centrodedistribuicao = parsedEndereco.endereco!.centroDistribuicao;
            updatePayload.new_deposito = parsedEndereco.endereco!.deposito;
            updatePayload.new_rua = parsedEndereco.endereco!.rua;
            updatePayload.new_estante = parsedEndereco.endereco!.estante;
            updatePayload.new_prateleira = parsedEndereco.endereco!.prateleira;
            updatePayload.new_endereco = enderecoConfirmado;
          }

          await Cr22fEstoqueFromSharepointListService.update(item.cr22f_estoquefromsharepointlistid, updatePayload);

          // Registrar leitura em new_registrodeleiturademercadoriaemestoque
          await NewRegistrodeLeituradeMercadoriaemEstoqueService.create({
            'new_RegistradoPor@odata.bind': `/systemusers(${systemUserId})`,
            'new_Mercadoria@odata.bind': `/cr22f_estoquefromsharepointlists(${item.cr22f_estoquefromsharepointlistid})`,
            new_dataehora: now.toISOString(),
            new_endereco: enderecoConfirmado,
          });

          if (contagemId) {
            await updateSnapshotForCount(item.cr22f_estoquefromsharepointlistid, contagemId);
          }
        }

        const count = pendingItems.length;
        setPendingItems([]);
        setFeedbackMessage({ intent: 'success', text: `${count} contagens salvas com sucesso no endereço ${enderecoConfirmado}!` });
        navigator.vibrate?.(80);
        void loadContagensHoje();
        void loadListaDoDia(searchText, showOnlyPending);

      } catch (err: any) {
        console.error('[ContagemEstoque] erro ao persistir contagens:', err);
        setFeedbackMessage({ intent: 'error', text: err.message || 'Erro ao salvar contagens.' });
      } finally {
        setIsSaving(false);
      }

      return;
    }

    // Não é endereço - é um produto
    const tag = extractQueryTag(codigo);
    if (!tag) {
      setFeedbackMessage({ intent: 'error', text: 'Código inválido. Tag não encontrada.' });
      navigator.vibrate?.([100, 50, 100]);
      return;
    }

    // Verificar se já está na lista de pendentes
    const alreadyPending = pendingItems.find(p => String(p.item.cr22f_querytag) === tag);
    if (alreadyPending) {
      setFeedbackMessage({ intent: 'warning', text: `Produto ${alreadyPending.item.new_referenciadoproduto || tag} já foi bipado.` });
      navigator.vibrate?.([100, 50, 100]);
      return;
    }

    const item = await fetchItemByTag(tag);
    if (!item) {
      setFeedbackMessage({ intent: 'error', text: `Produto com Tag ${tag} não encontrado.` });
      navigator.vibrate?.([100, 50, 100]);
      return;
    }

    if (item.statecode !== undefined && item.statecode !== 0) {
      setFeedbackMessage({ intent: 'error', text: 'Este produto está inativo no sistema.' });
      navigator.vibrate?.([100, 50, 100]);
      return;
    }

    // Verifica quantidade: se > 1, abre modal; se = 1, assume automaticamente
    const qtdEsperada = item.new_quantidade ?? 1;
    
    if (qtdEsperada > 1) {
      // Abre modal para perguntar quantidade
      setQuantityDialogItem(item);
      setQuantityDialogValue(String(qtdEsperada));
      setQuantityDialogOpen(true);
    } else {
      // Quantidade = 1, assume automaticamente
      setPendingItems(prev => [...prev, {
        item,
        quantidadeContada: 1,
        timestamp: new Date(),
      }]);
      setFeedbackMessage({ intent: 'success', text: `${item.new_referenciadoproduto || 'Produto'} adicionado (Qtd: 1). Bipe o endereço para confirmar.` });
      navigator.vibrate?.(50);
    }
  }, [fetchItemByTag, loadContagensHoje, loadListaDoDia, pendingItems, searchText, showOnlyPending, systemUserId, thresholds, updateSnapshotForCount]);

  // Confirma quantidade no modal
  const handleQuantityConfirm = useCallback(() => {
    if (!quantityDialogItem) return;
    
    const qtd = Number(quantityDialogValue);
    if (Number.isNaN(qtd) || qtd < 0) {
      setFeedbackMessage({ intent: 'error', text: 'Quantidade inválida.' });
      return;
    }

    setPendingItems(prev => [...prev, {
      item: quantityDialogItem,
      quantidadeContada: qtd,
      timestamp: new Date(),
    }]);
    
    setFeedbackMessage({ 
      intent: 'success', 
      text: `${quantityDialogItem.new_referenciadoproduto || 'Produto'} adicionado (Qtd: ${qtd}). Bipe o endereço para confirmar.` 
    });
    navigator.vibrate?.(50);
    
    setQuantityDialogOpen(false);
    setQuantityDialogItem(null);
    setQuantityDialogValue('');
    
    // Foca no leitor Bluetooth após fechar o modal
    setTimeout(() => {
      bluetoothInputRef.current?.focus();
    }, 100);
  }, [quantityDialogItem, quantityDialogValue]);

  // Cancela modal de quantidade
  const handleQuantityCancel = useCallback(() => {
    setQuantityDialogOpen(false);
    setQuantityDialogItem(null);
    setQuantityDialogValue('');
    
    // Foca no leitor Bluetooth após fechar o modal
    setTimeout(() => {
      bluetoothInputRef.current?.focus();
    }, 100);
  }, []);

  // Remove item da lista de pendentes
  const removePendingItem = useCallback((itemId: string) => {
    setPendingItems(prev => prev.filter(p => p.item.cr22f_estoquefromsharepointlistid !== itemId));
    setFeedbackMessage({ intent: 'info', text: 'Item removido da lista pendente.' });
  }, []);

  // Limpa todos os pendentes
  const clearPendingItems = useCallback(() => {
    setPendingItems([]);
    setFeedbackMessage({ intent: 'info', text: 'Lista pendente limpa.' });
  }, []);

  // Handler do input Bluetooth
  const handleBluetoothSubmit = useCallback(() => {
    const value = bluetoothValue.trim();
    if (!value) return;
    void processScannedCode(value);
    setBluetoothValue('');
  }, [bluetoothValue, processScannedCode]);

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
            navigator.vibrate?.(50);
            void processScannedCode(text);
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
  }, [isScanning, processScannedCode]);

  const loadItemByTag = useCallback(async (tag: string) => {
    setPageError(null);
    setSelectedItem(null);
    try {
      const item = await fetchItemByTag(tag);

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
  }, [fetchItemByTag]);

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
      const limite = getDueLimitDate(now, selectedItem.new_classecriticidade, thresholds);
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

      const contagemResult = await NewContagemEstoqueService.create(payload);
      const contagemId = contagemResult.data?.new_contagemestoqueid as string | undefined;
      await Cr22fEstoqueFromSharepointListService.update(selectedItem.cr22f_estoquefromsharepointlistid, {
        new_ultimacontagem: now.toISOString(),
      });

      if (contagemId) {
        await updateSnapshotForCount(selectedItem.cr22f_estoquefromsharepointlistid, contagemId);
      }

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
  }, [loadContagensHoje, observacao, quantidade, resetFlow, selectedItem, systemUserId, thresholds, updateSnapshotForCount]);

  const groupedLista = useMemo(() => {
    const now = new Date();
    const map = new Map<string, EstoqueItem[]>();
    listaDoDia.forEach((item) => {
      const key = buildEnderecoCompleto(item);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    
    // Ordenar endereços por prioridade (mais atrasados primeiro, contados hoje por último)
    const entries = Array.from(map.entries());
    return entries.sort((a, b) => {
      const [, itensA] = a;
      const [, itensB] = b;
      
      // Calcular atraso máximo de cada endereço
      const maxAtrasaA = Math.max(...itensA.map(item => getCountStatus(item, now, thresholds).overdueDays));
      const maxAtrasaB = Math.max(...itensB.map(item => getCountStatus(item, now, thresholds).overdueDays));
      
      return maxAtrasaB - maxAtrasaA;
    });
  }, [listaDoDia, thresholds]);

  useEffect(() => {
    if (expandAll && groupedLista.length > 0) {
      setOpenItems(groupedLista.map(([endereco]) => endereco));
    } else if (!expandAll) {
      setOpenItems([]);
    }
  }, [expandAll, groupedLista]);

  const renderPendingBanner = () => {
    if (pendingItems.length === 0) return null;
    
    return (
      <div className={styles.pendingBanner}>
        <div className="flex items-center gap-2">
          <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
          <Text weight="semibold" style={{ color: tokens.colorPaletteYellowForeground1 }}>
            {pendingItems.length} {pendingItems.length === 1 ? 'item bipado' : 'itens bipados'} - Aguardando confirmação de endereço
          </Text>
        </div>
        <Text size={200}>
          Bipe a etiqueta do endereço para confirmar e salvar as contagens.
        </Text>
        <div className="flex flex-col gap-1">
          {pendingItems.map((pending) => (
            <div key={pending.item.cr22f_estoquefromsharepointlistid} className={styles.pendingItemRow}>
              <div className="flex flex-col">
                <Text size={200} weight="semibold">{pending.item.new_referenciadoproduto || 'SKU'}</Text>
                <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  Tag: {pending.item.cr22f_querytag} | Qtd: {pending.quantidadeContada}
                </Text>
              </div>
              <Button
                appearance="subtle"
                size="small"
                icon={<Dismiss24Regular />}
                onClick={() => removePendingItem(pending.item.cr22f_estoquefromsharepointlistid)}
                aria-label="Remover item"
              />
            </div>
          ))}
        </div>
        <Button
          appearance="secondary"
          size="small"
          onClick={clearPendingItems}
        >
          Limpar todos
        </Button>
      </div>
    );
  };

  const renderBluetoothInput = () => (
    <div className={styles.bluetoothSection}>
      <Field label="Leitor Bluetooth">
        <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: tokens.spacingVerticalXS }}>
          Foque no campo e leia os códigos. O leitor envia Enter automaticamente. Bipe produtos e depois bipe o endereço.
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
            placeholder="Leia um código (produto ou endereço)"
            style={{ flex: 1 }}
            disabled={isSaving}
          />
          <Button
            appearance="secondary"
            icon={<Keyboard24Regular />}
            onClick={() => bluetoothInputRef.current?.focus()}
          >
            Focar
          </Button>
          <Button
            appearance="primary"
            onClick={handleBluetoothSubmit}
            disabled={!bluetoothValue.trim() || isSaving}
          >
            Processar
          </Button>
        </div>
      </Field>
    </div>
  );

  const renderHome = () => (
    <div className={styles.container}>
      {pageError && (
        <Text className={styles.errorText}>{pageError}</Text>
      )}
      {userError && (
        <Text className={styles.errorText}>{userError}</Text>
      )}
      
      {feedbackMessage && (
        <MessageBar intent={feedbackMessage.intent}>
          <MessageBarBody>{feedbackMessage.text}</MessageBarBody>
        </MessageBar>
      )}
      
      {renderPendingBanner()}
      
      <Card className={styles.card}>
        <div className="flex flex-col gap-4 p-4">
          {renderBluetoothInput()}
        </div>
      </Card>

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
            BIPAR COM CÂMERA
          </Button>
          <Button
            appearance="secondary"
            onClick={() => {
              resetFlow();
              setView('list');
              setSearchText('');
              void loadListaDoDia(undefined, showOnlyPending);
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
      {feedbackMessage && (
        <MessageBar intent={feedbackMessage.intent}>
          <MessageBarBody>{feedbackMessage.text}</MessageBarBody>
        </MessageBar>
      )}
      
      {renderPendingBanner()}
      
      <Card className={styles.card}>
        <CardHeader
          image={<QrCode24Regular />}
          header={<Text weight="semibold">Câmera</Text>}
          description={<Text size={200}>Aponte para o QR Code (produto ou endereço)</Text>}
        />
        <div className="flex flex-col gap-4 p-4">
          <div className={styles.videoWrapper}>
            <video ref={videoRef} className={styles.video} muted playsInline />
          </div>
          <div className={styles.actionsRow}>
            <Button appearance="primary" onClick={startScan} disabled={isScanning || isSaving}>
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
          
          {renderBluetoothInput()}
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
              <Input
                value={observacao}
                onChange={(_, data) => setObservacao(data.value)}
                placeholder="Observações sobre a contagem"
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

  const renderList = () => {
    const now = new Date();
    
    return (
      <div className={styles.container}>
        {feedbackMessage && (
          <MessageBar intent={feedbackMessage.intent}>
            <MessageBarBody>{feedbackMessage.text}</MessageBarBody>
          </MessageBar>
        )}
        
        {renderPendingBanner()}
        
        <Card className={styles.card}>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <Text weight="semibold">Lista do dia</Text>
              <Button
                appearance="subtle"
                onClick={() => {
                  setSearchText('');
                  void loadListaDoDia(undefined, showOnlyPending);
                }}
                disabled={listaLoading}
              >
                Atualizar
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Buscar SKU ou Tag..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void loadListaDoDia(searchText, showOnlyPending);
                  }
                }}
                contentBefore={<Search24Regular />}
                style={{ flex: 1 }}
              />
              <Button appearance="primary" onClick={() => void loadListaDoDia(searchText, showOnlyPending)} disabled={listaLoading}>
                Buscar
              </Button>
            </div>

            <div className={styles.filterRow}>
              <Switch
                checked={showOnlyPending}
                onChange={(_, data) => {
                  setShowOnlyPending(data.checked);
                  void loadListaDoDia(searchText, data.checked);
                }}
                label="Mostrar apenas pendentes"
              />
              {!listaLoading && groupedLista.length > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={expandAll ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
                  onClick={() => setExpandAll(!expandAll)}
                >
                  {expandAll ? 'Recolher' : 'Expandir'}
                </Button>
              )}
            </div>

            {renderBluetoothInput()}

            {listaLoading && <Spinner label="Carregando lista..." />}
            {listaError && <Text className={styles.errorText}>{listaError}</Text>}
            {!listaLoading && listaDoDia.length === 0 && (
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {searchText ? 'Nenhum item encontrado para esta busca.' : 'Nenhum item pendente hoje.'}
              </Text>
            )}

            {groupedLista.length > 0 && (
              <Accordion
                multiple
                openItems={openItems}
                onToggle={(_, data) => {
                  setOpenItems(data.openItems as string[]);
                  setExpandAll(false);
                }}
                collapsible
              >
                {groupedLista.map(([endereco, itens]) => {
                  // Calcular estatísticas do endereço
                  const statusList = itens.map(item => getCountStatus(item, now, thresholds));
                  const atrasados = statusList.filter(s => s.overdueDays > 5).length;
                  const noPrazo = statusList.filter(s => s.overdueDays <= 5 && s.overdueDays > 0).length;
                  const contadosHoje = statusList.filter(s => s.countedToday).length;
                  
                  // Determinar a cor do badge (prioridade: vermelho > amarelo > verde)
                  const badgeColor = atrasados > 0
                    ? 'danger'
                    : noPrazo > 0
                    ? 'warning'
                    : 'success';
                  
                  const badgeText = atrasados > 0
                    ? `${atrasados} atrasado${atrasados > 1 ? 's' : ''}`
                    : noPrazo > 0
                    ? `${noPrazo} no prazo`
                    : `${contadosHoje} hoje`;

                  return (
                    <AccordionItem key={endereco} value={endereco}>
                      <AccordionHeader>
                        <div className={styles.accordionHeader}>
                          <div className={styles.headerLeft}>
                            <Text weight="semibold" size={300}>
                              {endereco}
                            </Text>
                          </div>
                          <div className={styles.headerRight}>
                            <Badge appearance="filled" color={badgeColor} size="small">
                              {badgeText}
                            </Badge>
                            <Badge appearance="outline" size="small">
                              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                            </Badge>
                          </div>
                        </div>
                      </AccordionHeader>
                      <AccordionPanel>
                        <div className="flex flex-col gap-2">
                          {itens.map((item) => {
                            const status = getCountStatus(item, now, thresholds);
                            const isPending = pendingItems.some(p => p.item.cr22f_estoquefromsharepointlistid === item.cr22f_estoquefromsharepointlistid);
                            
                            return (
                              <Card
                                key={item.cr22f_estoquefromsharepointlistid}
                                className={`${styles.listItem} card-interactive`}
                                style={{
                                  opacity: status.countedToday ? 0.7 : 1,
                                  backgroundColor: isPending ? tokens.colorPaletteYellowBackground1 : undefined,
                                }}
                              >
                                <div className="flex flex-col gap-1 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {status.countedToday ? (
                                        <Checkmark24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                                      ) : isPending ? (
                                        <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
                                      ) : (
                                        <span
                                          className={styles.statusDot}
                                          style={{ backgroundColor: status.color }}
                                          aria-hidden="true"
                                        />
                                      )}
                                      <Text weight="semibold">{item.new_referenciadoproduto || 'SKU'}</Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isPending && (
                                        <Badge appearance="tint" color="warning" size="small">Bipado</Badge>
                                      )}
                                      <Text size={200}>{status.label}</Text>
                                    </div>
                                  </div>
                                  {item.new_datadaultimaleitura && (
                                    <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                                      Última leitura: {new Date(item.new_datadaultimaleitura).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </Text>
                                  )}
                                  <div className="flex flex-col gap-0">
                                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                      Tag: {item.cr22f_querytag || '---'} | Qtd esperada: {item.new_quantidade ?? 1}
                                    </Text>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

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
  };

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
        subtitle="Bipe os produtos e depois o endereço para confirmar"
      />
      <PageContainer>
        {view === 'home' && renderHome()}
        {view === 'scanner' && renderScanner()}
        {view === 'form' && renderForm()}
        {view === 'list' && renderList()}
        {view === 'success' && renderSuccess()}
        
        {/* Modal de quantidade */}
        <Dialog open={quantityDialogOpen} onOpenChange={(_, data) => !data.open && handleQuantityCancel()}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Quantidade do produto</DialogTitle>
              <DialogContent>
                <div className="flex flex-col gap-3">
                  <Text>
                    <strong>{quantityDialogItem?.new_referenciadoproduto || 'Produto'}</strong>
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Tag: {quantityDialogItem?.cr22f_querytag} | Quantidade esperada: {quantityDialogItem?.new_quantidade ?? 1}
                  </Text>
                  <Field label="Quantidade encontrada">
                    <Input
                      value={quantityDialogValue}
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      onChange={(_, data) => setQuantityDialogValue(data.value)}
                      autoFocus
                    />
                  </Field>
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={handleQuantityCancel}>
                  Cancelar
                </Button>
                <Button appearance="primary" onClick={handleQuantityConfirm}>
                  Confirmar
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </PageContainer>
    </>
  );
}
