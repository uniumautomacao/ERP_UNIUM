export type MercadoriaStatus = 'ativo' | 'inativo';

export interface MercadoriaLida {
  id: string;
  etiqueta?: number;
  numeroSerie?: string;
  referencia?: string;
  quantidade?: number;
  situacao?: string;
  endereco?: string;
  cliente?: string;
  status: number;
  tagConfirmadaBool: boolean;
  dataUltimaLeitura?: string;
  leituraCodigo?: string;
}

export interface EnderecoDeposito {
  centroDistribuicao: number;
  deposito: number;
  rua: number;
  estante: number;
  prateleira: number;
}

export interface EnderecoParseResult {
  valido: boolean;
  codigo?: string;
  endereco?: EnderecoDeposito;
  erro?: string;
}

export interface ParsedBarcode {
  original: string;
  value: string;
  isNumeric: boolean;
}
