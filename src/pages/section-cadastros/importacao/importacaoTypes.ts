// Types for Excel Import Wizard

export interface ParsedExcelRow {
  [columnName: string]: any;
}

export interface ParsedExcelData {
  headers: string[];
  rows: ParsedExcelRow[];
  headerRowIndex: number;
  rawData?: any[][]; // Raw Excel data for dropdown filtering
}

export interface ColumnMapping {
  codigoColumn: string | null;
  descricaoColumn: string | null;
  precoBaseColumn: string | null;
  precoSugeridoColumn: string | null;
}

export interface ValoresInferidos {
  // Modelo
  categoria: string[];
  tipoSistema: number[];
  tipoOS: number[];
  controlaSN: boolean[];
  controlaEtiqueta: boolean[];
  requerConfiguracao: boolean[];
  requerCabeamento: boolean[];
  omitirGuia: boolean[];
  omitirGuiaConexoes: boolean[];
  horasAgregadas: string[];

  // Preço
  fornecedorId: string[];
  desconto: number[];
  markup: number[];
  requerInstalacao: boolean[];
  servicosIds: Array<{ servicoId: string; frequencia: number }>;
}

export interface ProductoNovo {
  codigo: string;
  descricao: string;
  precoBase: number;

  // Campos inferidos do modelo (editáveis)
  categoria: string;
  tipoSistema: number | null;
  tipoOS: number | null;
  controlaSN: boolean;
  controlaEtiqueta: boolean;
  requerConfiguracao: boolean;
  requerCabeamento: boolean;
  omitirGuia: boolean;
  omitirGuiaConexoes: boolean;
  horasAgregadas: string;

  // Campos inferidos do preço (editáveis)
  descricaoPreco: string;
  fornecedorId: string;
  desconto: number;
  markup: number;
  requerInstalacao: boolean;
  servicosIds: string[];

  // Estado
  action: 'create' | 'ignore';
  hasMultipleOptions: boolean;
  camposComOpcoes: CampoComOpcoes[];
}

export interface ProductoExistente {
  codigo: string;
  modeloId: string;
  descricao: string;
  precoBase: number;
  precoAtual: number;
  descontoAtual: number;
  markupAtual: number;

  // Campos para atualização
  descricaoPreco: string;
  fornecedorId: string;
  desconto: number;
  markup: number;
  requerInstalacao: boolean;
  servicosIds: string[];

  // Estado
  existingPrices: any[];
  action: 'update' | 'create_new' | 'ignore';
}

export interface ProductoSemAlteracao {
  codigo: string;
  modeloId: string;
  descricao: string;
  precoBase: number;
  desconto: number;
  markup: number;
}

export interface ProductoDescontinuado {
  codigo: string;
  modeloId: string;
  descricao: string;
  action: 'deactivate' | 'keep';
}

export interface CampoComOpcoes {
  campo: string;
  label: string;
  opcoes: Array<{ valor: any; frequencia: number }>;
  valorPadrao?: any;
}

export interface ComparisonResults {
  toCreate: ProductoNovo[];
  toUpdate: ProductoExistente[];
  toKeep: ProductoSemAlteracao[];
  toDeactivate: ProductoDescontinuado[];
}

export interface ExecutionResults {
  created: number;
  updated: number;
  deactivated: number;
  failed: number;
  errors: Array<{ codigo: string; error: string }>;
}

export interface ImportacaoState {
  currentStep: number;
  excelData: ParsedExcelData | null;
  columnMapping: ColumnMapping;
  fabricanteId: string;
  fabricanteLabel: string;
  comparisonResults: ComparisonResults | null;
  executionResults: ExecutionResults | null;
  valoresInferidos: ValoresInferidos | null;
  // Configuração de markup/desconto
  markupSource: 'inferred' | 'calculated';
  markupBaseColumn: string | null;
  markupSugeridoColumn: string | null;
}

export type WizardStep = 1 | 2 | 3 | 4;

export interface MonetaryColumn {
  columnName: string;
  sampleValues: number[];
  avgValue: number;
}
