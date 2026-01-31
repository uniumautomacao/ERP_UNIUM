import * as XLSX from 'xlsx';
import {
  ParsedExcelData,
  ParsedExcelRow,
  MonetaryColumn,
  ValoresInferidos,
  ComparisonResults,
  ProductoNovo,
  ProductoExistente,
  ProductoDescontinuado,
} from './importacaoTypes';
import {
  Cr22fModelosdeProdutoFromSharepointListService,
  NewPrecodeProdutoService,
  NewTiposervicoprecodeprodutoService,
} from '../../../generated';

/**
 * Normaliza valores monetários de diferentes formatos para number
 * Suporta: "R$ 3.000,00", "R$ 3,000.00", "3000", 3000, etc.
 */
export const parseMonetaryValue = (value: any): number | null => {
  // Se já é número, retorna direto
  if (typeof value === 'number') {
    return value;
  }

  // Se não é string, retorna null
  if (typeof value !== 'string') {
    return null;
  }

  // Remove espaços, prefixos monetários (R$, $, etc)
  let cleaned = value.trim().replace(/^[R\$\s]+/gi, '');

  // Detecta formato: Se tem vírgula DEPOIS do último ponto, é formato BR (1.000,00)
  // Se tem ponto DEPOIS da última vírgula, é formato US (1,000.00)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Formato BR: 3.000,00 ou 3000,00
    // Remove pontos (separadores de milhar) e troca vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // Formato US: 3,000.00 ou 3000.00
    // Remove vírgulas (separadores de milhar), ponto já é decimal
    cleaned = cleaned.replace(/,/g, '');
  }
  // Se não tem vírgula nem ponto, ou só tem um, já está no formato correto

  // Converte para número
  const parsed = parseFloat(cleaned);

  // Valida
  return !isNaN(parsed) && parsed >= 0 ? parsed : null;
};

/**
 * Detecta a linha de cabeçalho no Excel
 * Procura por keywords específicas em até 200 linhas
 */
export const detectHeaderRow = (rawData: any[][]): number => {
  const REQUIRED_KEYWORDS = ['código', 'codigo', 'code'];
  const OPTIONAL_KEYWORDS = ['descrição', 'descricao', 'preço', 'preco', 'price', 'valor', 'família', 'familia'];

  // Strategy 1: Search for keywords in first 200 rows
  for (let i = 0; i < Math.min(rawData.length, 200); i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const normalized = row.map((cell) => String(cell || '').toLowerCase().trim());

    const hasRequired = REQUIRED_KEYWORDS.some((keyword) =>
      normalized.some((cell) => cell.includes(keyword))
    );

    const optionalMatches = OPTIONAL_KEYWORDS.filter((keyword) =>
      normalized.some((cell) => cell.includes(keyword))
    ).length;

    if (hasRequired && optionalMatches >= 1) {
      return i;
    }
  }

  // Strategy 2: Look for row with many non-empty text cells (likely header)
  for (let i = 0; i < Math.min(rawData.length, 200); i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const textCells = row.filter((cell) => {
      const str = String(cell || '').trim();
      return str !== '' && isNaN(Number(str));
    }).length;

    // If more than 50% are non-empty text cells, likely a header
    if (textCells > row.length * 0.5 && textCells >= 3) {
      return i;
    }
  }

  return 0; // fallback
};

/**
 * Parse arquivo Excel e retorna dados estruturados
 */
export const parseExcel = async (file: File): Promise<ParsedExcelData> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  // Convert to raw array
  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  }) as any[][];

  // Auto-detect header row
  const headerRowIndex = detectHeaderRow(rawData);
  const headers = rawData[headerRowIndex].map((h) => String(h || '').trim());

  // Parse data rows
  const dataRows = rawData
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell !== '')) // skip empty rows
    .map((row) => {
      const obj: ParsedExcelRow = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

  return {
    headers,
    rows: dataRows,
    headerRowIndex,
    rawData,
  };
};

/**
 * Identifica colunas monetárias no Excel
 */
export const identificarColunasMonetarias = (data: ParsedExcelData): MonetaryColumn[] => {
  const monetaryColumns: MonetaryColumn[] = [];

  data.headers.forEach((header) => {
    // Tenta converter os primeiros 10 valores não-vazios
    const values = data.rows
      .map((row) => parseMonetaryValue(row[header]))
      .filter((v) => v !== null && v > 0)
      .slice(0, 10) as number[];

    // Se pelo menos 70% dos valores foram convertidos com sucesso, é uma coluna monetária
    if (values.length >= 7) {
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      monetaryColumns.push({
        columnName: header,
        sampleValues: values,
        avgValue,
      });
    }
  });

  return monetaryColumns;
};

/**
 * Calcula a moda (valor mais frequente) de um array
 */
export const calculateModa = <T>(values: T[]): T[] => {
  if (values.length === 0) return [];

  const frequencias = values.reduce(
    (acc, val) => {
      const key = JSON.stringify(val);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxFreq = Math.max(...Object.values(frequencias));
  return Object.keys(frequencias)
    .filter((k) => frequencias[k] === maxFreq)
    .map((k) => JSON.parse(k));
};

/**
 * Busca serviços mais comuns vinculados a preços
 */
export const buscarServicosMaisComuns = async (
  precosIds: string[]
): Promise<Array<{ servicoId: string; frequencia: number }>> => {
  if (precosIds.length === 0) return [];

  // Dividir em chunks de 50 para evitar query muito grande
  const chunks: string[][] = [];
  for (let i = 0; i < precosIds.length; i += 50) {
    chunks.push(precosIds.slice(i, i + 50));
  }

  const allVinculos: any[] = [];

  for (const chunk of chunks) {
    const filter = chunk.map((id) => `_new_precodeproduto_value eq '${id}'`).join(' or ');

    const result = await NewTiposervicoprecodeprodutoService.getAll({
      filter: `statecode eq 0 and (${filter})`,
      select: ['_new_tipodeservico_value', '_new_precodeproduto_value'],
    });

    if (result.success && result.data) {
      allVinculos.push(...result.data);
    }
  }

  // Contar frequência de cada serviço
  const frequencias = allVinculos.reduce(
    (acc, vinculo) => {
      const servicoId = (vinculo as any)._new_tipodeservico_value;
      if (servicoId) {
        acc[servicoId] = (acc[servicoId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Ordenar por frequência (mais comum primeiro)
  const servicosOrdenados = Object.entries(frequencias)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .map(([servicoId, freq]) => ({ servicoId, frequencia: freq as number }));

  // Retornar top 5 serviços mais comuns
  return servicosOrdenados.slice(0, 5);
};

/**
 * Infere valores para modelo de produto baseado em produtos do fabricante
 */
export const inferirValoresModelo = async (fabricanteId: string): Promise<Partial<ValoresInferidos>> => {
  const modelos = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
    filter: `statecode eq 0 and _new_fabricante_value eq '${fabricanteId}'`,
    select: [
      'cr22f_querycategoria',
      'new_tipodesistemapadrao',
      'new_tipodeospadrao',
      'new_controlasn',
      'new_controlaetiqueta',
      'new_requerconfiguracao',
      'new_requercabeamento',
      'new_requerengraving',
      'cr22f_horasagregadas',
    ],
  });

  if (!modelos.success || !modelos.data || modelos.data.length === 0) {
    return {};
  }

  const calcularModaCampo = (campo: string) => {
    const valores = modelos.data!.map((m: any) => m[campo]).filter((v) => v !== null && v !== undefined);
    return calculateModa(valores);
  };

  return {
    categoria: calcularModaCampo('cr22f_querycategoria'),
    tipoSistema: calcularModaCampo('new_tipodesistemapadrao'),
    tipodeOSPadrao: calcularModaCampo('new_tipodeospadrao'),
    controlaSN: calcularModaCampo('new_controlasn'),
    controlaEtiqueta: calcularModaCampo('new_controlaetiqueta'),
    requerConfiguracao: calcularModaCampo('new_requerconfiguracao'),
    requerCabeamento: calcularModaCampo('new_requercabeamento'),
    omitirGuia: calcularModaCampo('new_requerengraving'),
    horasAgregadas: calcularModaCampo('cr22f_horasagregadas'),
  };
};

/**
 * Infere valores para preço de produto baseado em preços do fabricante
 */
export const inferirValoresPreco = async (fabricanteId: string): Promise<Partial<ValoresInferidos>> => {
  // Primeiro, buscar IDs dos modelos do fabricante
  const modelosResult = await Cr22fModelosdeProdutoFromSharepointListService.getAll({
    filter: `statecode eq 0 and _new_fabricante_value eq '${fabricanteId}'`,
    select: ['cr22f_modelosdeprodutofromsharepointlistid'],
  });

  if (!modelosResult.success || !modelosResult.data || modelosResult.data.length === 0) {
    return {};
  }

  const modelosIds = modelosResult.data.map((m: any) => m.cr22f_modelosdeprodutofromsharepointlistid);

  // Buscar preços desses modelos
  const precosResult = await NewPrecodeProdutoService.getAll({
    filter: `statecode eq 0 and _new_modelodeproduto_value ne null`,
    select: [
      'new_precodeprodutoid',
      '_new_modelodeproduto_value',
      '_new_fornecedor_value',
      'new_descontopercentualdecompra',
      'new_markup',
      'new_requerinstalacao',
    ],
  });

  if (!precosResult.success || !precosResult.data) {
    return {};
  }

  // Filtrar apenas preços de modelos do fabricante
  const precosFabricante = precosResult.data.filter((p: any) =>
    modelosIds.includes(p._new_modelodeproduto_value)
  );

  if (precosFabricante.length === 0) {
    return {};
  }

  const calcularModaCampo = (campo: string) => {
    const valores = precosFabricante.map((p: any) => p[campo]).filter((v) => v !== null && v !== undefined);
    return calculateModa(valores);
  };

  // Buscar serviços mais comuns
  const precosIds = precosFabricante.map((p: any) => p.new_precodeprodutoid);
  const servicosMaisComuns = await buscarServicosMaisComuns(precosIds);

  return {
    fornecedorId: calcularModaCampo('_new_fornecedor_value'),
    desconto: calcularModaCampo('new_descontopercentualdecompra'),
    markup: calcularModaCampo('new_markup'),
    requerInstalacao: calcularModaCampo('new_requerinstalacao'),
    servicosIds: servicosMaisComuns,
  };
};

/**
 * Auto-mapping de colunas conhecidas
 */
export const autoMapColumns = (headers: string[]) => {
  const mapping = {
    codigoColumn: null as string | null,
    descricaoColumn: null as string | null,
    precoBaseColumn: null as string | null,
    precoSugeridoColumn: null as string | null,
  };

  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // Mapear código
  const codigoIndex = normalizedHeaders.findIndex((h) => h.includes('código') || h.includes('codigo') || h === 'code');
  if (codigoIndex !== -1) {
    mapping.codigoColumn = headers[codigoIndex];
  }

  // Mapear descrição
  const descricaoIndex = normalizedHeaders.findIndex(
    (h) => h.includes('descrição') || h.includes('descricao') || h.includes('description')
  );
  if (descricaoIndex !== -1) {
    mapping.descricaoColumn = headers[descricaoIndex];
  }

  return mapping;
};
