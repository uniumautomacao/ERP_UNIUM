import type { StatusProgramacao, TipoComentario } from './types';

export const STATUS_PROGRAMACAO = {
  AguardandoPrimeiroContato: 100000000,
  Programado: 100000001,
  PendenteReconfirmacao60d: 100000002,
  Confirmado60d: 100000003,
  PendenteReconfirmacao30d: 100000004,
  Confirmado30d: 100000005,
  PendenteReconfirmacao15d: 100000006,
  Confirmado15d: 100000007,
  ProntoParaAgendar: 100000008,
  SemResposta: 100000009,
} as const;

export const TIPO_COMENTARIO = {
  DefinicaoData: 100000000,
  AlteracaoData: 100000001,
  Confirmacao60d: 100000002,
  Confirmacao30d: 100000003,
  Confirmacao15d: 100000004,
  TentativaContato: 100000005,
  ClienteSemResposta: 100000006,
  ObservacaoGeral: 100000007,
} as const;

export const TIPO_SERVICO = {
  Cabeamento: 100000000,
  Instalacao: 100000001,
} as const;

export const STATUS_LABELS: Record<StatusProgramacao, string> = {
  100000000: 'Aguardando 1º Contato',
  100000001: 'Programado',
  100000002: 'Pendente Reconfirmação 60d',
  100000003: 'Confirmado 60d',
  100000004: 'Pendente Reconfirmação 30d',
  100000005: 'Confirmado 30d',
  100000006: 'Pendente Reconfirmação 15d',
  100000007: 'Confirmado 15d',
  100000008: 'Pronto para Agendar',
  100000009: 'Sem Resposta',
};

export const STATUS_COLORS: Record<StatusProgramacao, { background: string; text: string }> = {
  100000000: { background: '#FEE2E2', text: '#991B1B' },
  100000001: { background: '#F3F4F6', text: '#374151' },
  100000002: { background: '#DCFCE7', text: '#166534' },
  100000003: { background: '#F3F4F6', text: '#374151' },
  100000004: { background: '#FEF9C3', text: '#854D0E' },
  100000005: { background: '#F3F4F6', text: '#374151' },
  100000006: { background: '#FFEDD5', text: '#9A3412' },
  100000007: { background: '#F3F4F6', text: '#374151' },
  100000008: { background: '#F3F4F6', text: '#374151' },
  100000009: { background: '#FEF2F2', text: '#7F1D1D' },
};

export const SERVICE_COLORS: Record<'Instalação' | 'Cabeamento', string> = {
  'Instalação': '#3B82F6',
  'Cabeamento': '#8B5CF6',
};

export const TIPO_COMENTARIO_LABELS: Record<TipoComentario, string> = {
  100000000: '1ª Definição de Data',
  100000001: 'Alteração de Data',
  100000002: 'Confirmação 60 dias',
  100000003: 'Confirmação 30 dias',
  100000004: 'Confirmação 15 dias',
  100000005: 'Tentativa de Contato',
  100000006: 'Cliente Sem Resposta',
  100000007: 'Observação Geral',
};

export const PENDENTES_STATUS: StatusProgramacao[] = [
  100000000,
  100000006,
  100000004,
  100000002,
];

export const STATUS_GROUPS: Array<{
  status: StatusProgramacao;
  title: string;
}> = [
  { status: 100000000, title: 'Aguardando 1º Contato' },
  { status: 100000006, title: 'Reconfirmar 15 dias' },
  { status: 100000004, title: 'Reconfirmar 30 dias' },
  { status: 100000002, title: 'Reconfirmar 60 dias' },
];

export const SEARCH_PLACEHOLDER = 'Buscar projeto ou cliente...';

