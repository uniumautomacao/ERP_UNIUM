import type { StatusProgramacao, TipoComentario } from './types';

export const STATUS_LABELS: Record<StatusProgramacao, string> = {
  1: 'Aguardando 1º Contato',
  2: 'Programado',
  3: 'Pendente Reconfirmação 60d',
  4: 'Confirmado 60d',
  5: 'Pendente Reconfirmação 30d',
  6: 'Confirmado 30d',
  7: 'Pendente Reconfirmação 15d',
  8: 'Confirmado 15d',
  9: 'Pronto para Agendar',
  10: 'Sem Resposta',
};

export const STATUS_COLORS: Record<StatusProgramacao, { background: string; text: string }> = {
  1: { background: '#FEE2E2', text: '#991B1B' },
  2: { background: '#F3F4F6', text: '#374151' },
  3: { background: '#DCFCE7', text: '#166534' },
  4: { background: '#F3F4F6', text: '#374151' },
  5: { background: '#FEF9C3', text: '#854D0E' },
  6: { background: '#F3F4F6', text: '#374151' },
  7: { background: '#FFEDD5', text: '#9A3412' },
  8: { background: '#F3F4F6', text: '#374151' },
  9: { background: '#F3F4F6', text: '#374151' },
  10: { background: '#FEF2F2', text: '#7F1D1D' },
};

export const SERVICE_COLORS: Record<'Instalação' | 'Cabeamento', string> = {
  'Instalação': '#3B82F6',
  'Cabeamento': '#8B5CF6',
};

export const TIPO_COMENTARIO_LABELS: Record<TipoComentario, string> = {
  1: '1ª Definição de Data',
  2: 'Alteração de Data',
  3: 'Confirmação 60 dias',
  4: 'Confirmação 30 dias',
  5: 'Confirmação 15 dias',
  6: 'Tentativa de Contato',
  7: 'Cliente Sem Resposta',
  8: 'Observação Geral',
};

export const PENDENTES_STATUS: StatusProgramacao[] = [1, 7, 5, 3];

export const STATUS_GROUPS: Array<{
  status: StatusProgramacao;
  title: string;
}> = [
  { status: 1, title: 'Aguardando 1º Contato' },
  { status: 7, title: 'Reconfirmar 15 dias' },
  { status: 5, title: 'Reconfirmar 30 dias' },
  { status: 3, title: 'Reconfirmar 60 dias' },
];

export const SEARCH_PLACEHOLDER = 'Buscar projeto ou cliente...';

