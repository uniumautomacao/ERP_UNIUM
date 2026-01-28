export interface RemessaCardData {
  id: string;
  codigo?: string | null;
  stageValue?: number;
  fornecedor?: string | null;
  transportadora?: string | null;
  previsaoChegada?: string | null;
  previsaoEnvio?: string | null;
  dataEnvio?: string | null;
  dataRecebimento?: string | null;
  codigoRastreio?: string | null;
  prioridade?: number | null;
  entregue?: boolean;
  notas?: string | null;
}

export interface RemessaProdutoItem {
  id: string;
  referencia?: string | null;
  descricao?: string | null;
  fabricante?: string | null;
  cliente?: string | null;
  projeto?: string | null;
  quantidade?: number | null;
  cotacaoId?: string | null;
}

export interface RemessaCotacaoItem {
  id: string;
  nome?: string | null;
  fornecedor?: string | null;
  valorTotal?: number | null;
  opcaoEntrega?: number | null;
  enderecoEntrega?: string | null;
  observacoes?: string | null;
  dataAprovacao?: string | null;
}

export interface RemessaHistoricoItem {
  id: string;
  data?: string | null;
  campo?: string | null;
  anterior?: string | null;
  novo?: string | null;
  tipo?: number | null;
}

export interface RemessaLookupOption {
  id: string;
  label: string;
  fornecedor?: string | null;
}

export interface TransportadoraOption {
  id: string;
  label: string;
}
