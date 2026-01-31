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
  tipodeOSPadrao: number[];
  controlaSN: boolean[];
  controlaEtiqueta: boolean[];
  requerConfiguracao: boolean[];
  requerCabeamento: boolean[];
  omitirGuia: boolean[];
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
  tipodeOSPadrao: number | null;
  controlaSN: boolean;
  controlaEtiqueta: boolean;
  requerConfiguracao: boolean;
  requerCabeamento: boolean;
  omitirGuia: boolean;
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

export interface ProductoDescontinuado {
  codigo: string;
  modeloId: string;
  descricao: string;
  action: 'deactivate' | 'keep';
}

export interface ProductoSemAlteracao {
  codigo: string;
  modeloId: string;
  descricao: string;
  precoBase: number;
  desconto: number;
  markup: number;
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
  unchanged: ProductoSemAlteracao[];
  toDeactivate: ProductoDescontinuado[];
}

export interface ReportInsights {
  variacaoMedia: number;
  ticketMedioAntes: number;
  ticketMedioDepois: number;
  variacaoTicketMedio: number;
  variacaoMin: number;
  variacaoMax: number;
  totalAumentos: number;
  totalReducoes: number;
  impactoTotalValor: number;
  taxaRenovacao: number;
  taxaDescontinuacao: number;
  taxaEstabilidade: number;
  alertasExtremos: Array<{
    codigo: string;
    descricao: string;
    precoAtual: number;
    precoNovo: number;
    variacaoPercentual: number;
  }>;
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

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface MonetaryColumn {
  columnName: string;
  sampleValues: number[];
  avgValue: number;
}
