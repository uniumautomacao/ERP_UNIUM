import type { CronogramaOS, StatusProgramacao, TipoServicoFiltro } from './types';
import { PENDENTES_STATUS } from './constants';

export const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateShort = (value?: string | null): string => {
  const date = parseDate(value);
  if (!date) return 'Sem previsão';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

export const formatDateLong = (value?: string | null): string => {
  const date = parseDate(value);
  if (!date) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatMonthYear = (date: Date): string => {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const differenceInDays = (start: Date, end: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
};

export const getDiasRestantes = (dataPrevista?: string | null, hoje = new Date()): number | null => {
  const date = parseDate(dataPrevista);
  if (!date) return null;
  return differenceInDays(hoje, date);
};

export const getDiasDesdeCriacao = (dataCriacao?: string, hoje = new Date()): number | null => {
  const date = parseDate(dataCriacao ?? null);
  if (!date) return null;
  return Math.max(0, differenceInDays(date, hoje));
};

export const getDiasDesdeData = (data?: string | null, hoje = new Date()): number | null => {
  const date = parseDate(data ?? null);
  if (!date) return null;
  return Math.max(0, differenceInDays(date, hoje));
};

export const calcularStatus = (os: CronogramaOS, hoje = new Date()): StatusProgramacao => {
  const dataPrevista = parseDate(os.datadaproximaatividade);
  if (!dataPrevista) {
    return os.statusdaprogramacao === 10 ? 10 : 1;
  }

  const diasRestantes = differenceInDays(hoje, dataPrevista);
  if (diasRestantes > 60) return 2;
  if (diasRestantes > 45) return os.confirmacao60d ? 4 : 3;
  if (diasRestantes > 20) return os.confirmacao30d ? 6 : 5;
  if (diasRestantes > 7) return os.confirmacao15d ? 8 : 7;
  return 9;
};

export const filtrarPorAno = (os: CronogramaOS, ano: number): boolean => {
  if (!os.datadaproximaatividade) return true;
  const date = parseDate(os.datadaproximaatividade);
  return !!date && date.getFullYear() === ano;
};

export const filtrarPorTipoServico = (os: CronogramaOS, tipo: TipoServicoFiltro): boolean => {
  if (tipo === 'todos') return true;
  return tipo === 'instalacao' ? os.tipodeservico === 'Instalação' : os.tipodeservico === 'Cabeamento';
};

export const filtrarPorBusca = (os: CronogramaOS, term: string): boolean => {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;
  return (
    os.projetoapelido.toLowerCase().includes(normalized) ||
    os.cliente.toLowerCase().includes(normalized)
  );
};

export const ordenarPendentes = (items: CronogramaOS[]): CronogramaOS[] => {
  return [...items].sort((a, b) => {
    if (a.statusdaprogramacao === 1 && b.statusdaprogramacao !== 1) return -1;
    if (b.statusdaprogramacao === 1 && a.statusdaprogramacao !== 1) return 1;

    const dateA = parseDate(a.datadaproximaatividade);
    const dateB = parseDate(b.datadaproximaatividade);
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return dateA.getTime() - dateB.getTime();
  });
};

export const obterAnosDisponiveis = (items: CronogramaOS[], anoAtual = new Date().getFullYear()): number[] => {
  const set = new Set<number>([anoAtual, anoAtual + 1]);
  items.forEach((os) => {
    const date = parseDate(os.datadaproximaatividade);
    if (date) {
      set.add(date.getFullYear());
    }
  });
  return Array.from(set).sort((a, b) => b - a);
};

export const isPendencia = (status: StatusProgramacao): boolean => PENDENTES_STATUS.includes(status);

export const agruparPendentes = (items: CronogramaOS[]): Record<StatusProgramacao, CronogramaOS[]> => {
  const grupos: Record<StatusProgramacao, CronogramaOS[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
  };

  items.forEach((os) => {
    grupos[os.statusdaprogramacao].push(os);
  });

  (Object.keys(grupos) as Array<StatusProgramacao>).forEach((status) => {
    grupos[status] = ordenarPendentes(grupos[status]);
  });

  return grupos;
};

export const getConfirmacaoStatus = (os: CronogramaOS) => {
  return {
    confirmacao60d: Boolean(os.confirmacao60d),
    confirmacao30d: Boolean(os.confirmacao30d),
    confirmacao15d: Boolean(os.confirmacao15d),
  };
};

