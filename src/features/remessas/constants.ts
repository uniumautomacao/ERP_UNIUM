export const REMESSA_STAGE_CONFIRMADO = 100000000;
export const REMESSA_STAGE_PRODUCAO = 100000001;
export const REMESSA_STAGE_EM_ESPERA = 100000002;
export const REMESSA_STAGE_FATURAMENTO = 100000003;
export const REMESSA_STAGE_ENVIO = 100000004;
export const REMESSA_STAGE_ENTREGUE = 100000005;

export const REMESSA_STAGES = [
  { value: REMESSA_STAGE_CONFIRMADO, label: 'Confirmado' },
  { value: REMESSA_STAGE_PRODUCAO, label: 'Produção' },
  { value: REMESSA_STAGE_EM_ESPERA, label: 'Em espera' },
  { value: REMESSA_STAGE_FATURAMENTO, label: 'Faturamento' },
  { value: REMESSA_STAGE_ENVIO, label: 'Envio' },
  { value: REMESSA_STAGE_ENTREGUE, label: 'Entregue em estoque' },
];

export const REMESSA_PRIORITY_ALTA = 100000000;
export const REMESSA_PRIORITY_NORMAL = 100000001;
export const REMESSA_PRIORITY_BAIXA = 100000002;

export const REMESSA_PRIORITIES = [
  { value: REMESSA_PRIORITY_ALTA, label: 'Alta' },
  { value: REMESSA_PRIORITY_NORMAL, label: 'Normal' },
  { value: REMESSA_PRIORITY_BAIXA, label: 'Baixa' },
];

export const REMESSA_HISTORICO_MOVIMENTACAO = 100000000;
export const REMESSA_HISTORICO_EDICAO = 100000001;
export const REMESSA_HISTORICO_DIVISAO = 100000002;
export const REMESSA_HISTORICO_JUNCAO = 100000003;
export const REMESSA_HISTORICO_MOVER_ITENS = 100000004;
