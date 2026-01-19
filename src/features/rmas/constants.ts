export const RMA_STAGE_DEVOLVIDO = 109000000;

export const RMA_STAGES = [
  { value: 100000000, label: 'Novos' },
  { value: 101000000, label: 'Em avaliação interna' },
  { value: 101100000, label: 'Enviar para assistência' },
  { value: 102000000, label: 'Em trânsito para assistência' },
  { value: 103000000, label: 'Em análise' },
  { value: 104000000, label: 'Aguardando aprovação' },
  { value: 105000000, label: 'Em reparo' },
  { value: 106000000, label: 'Em trânsito de retorno' },
  { value: 107000000, label: 'Recebido da assistência' },
  { value: 108000000, label: 'Testado' },
  { value: 109000000, label: 'Devolvido' },
];

export const RMA_STAGE_DEFAULTS = RMA_STAGES.filter((stage) => stage.value !== RMA_STAGE_DEVOLVIDO);

export const RMA_STAGE_OWNER_LABELS: Record<number, string> = {
  101100000: 'Adm',
  102000000: 'Adm',
  103000000: 'Adm',
  105000000: 'Adm',
  106000000: 'Adm',
  101000000: 'Estoquista',
  107000000: 'Estoquista',
};

export const APP_PREFERENCE_STAGE_PREFIX = 'EstagioQuadroRMA_';
export const APP_PREFERENCE_RMA_CONTEXT_PREFIX = 'CadastroMercadoriaRMA_';

export const DYNAMICS_RMA_RECORD_URL_BASE =
  'https://unium.crm2.dynamics.com/main.aspx?appid=3ec4d8a9-2a8e-ee11-8179-002248de6f66&forceUCI=1&pagetype=entityrecord&etn=new_rma&id=';

export const DYNAMICS_CADASTRO_MERCADORIA_URL =
  'https://unium.crm2.dynamics.com/main.aspx?appid=090088ff-5c8d-ee11-8179-002248de672c&pagetype=custom&name=new_cadastroderetornodemercadoriapage_754dc';

export const RMA_TYPE_LABELS: Record<number, string> = {
  100000000: 'Retorno Temporário ao Estoque',
  100000001: 'Manutenção',
  100000002: 'Devolução Definitiva do Produto',
  100000003: 'Devolução de Empréstimo',
  100000004: 'Retorno Para Troca de Produto',
};
