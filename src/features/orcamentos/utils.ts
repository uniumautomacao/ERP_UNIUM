/**
 * Funções utilitárias para o módulo de Orçamentos
 */

import { differenceInDays, isAfter, addDays } from 'date-fns';
import type {
  Orcamento,
  ItemOrcamento,
  OrcamentoSecao,
  OrcamentoResumo,
  ExpiracaoStatus,
  ItemStatus,
} from './types';
import type { TipoServicoPreco } from '../../services/orcamentos/ServicoService';
import { EXPIRACAO_REGRAS, SECAO_ESPECIAL } from './constants';

// ============================================================================
// Cálculos financeiros
// ============================================================================

/**
 * Calcula o resumo financeiro do orçamento
 */
export function calcularResumoOrcamento(
  orcamento: Orcamento,
  itens: ItemOrcamento[]
): OrcamentoResumo {
  // Somar valores dos itens (new_valordeproduto e new_valordeservico já incluem quantidade)
  const valorTotalProdutos = itens.reduce(
    (acc, item) => acc + (item.new_valordeproduto ?? 0),
    0
  );

  const valorTotalServicos = itens.reduce(
    (acc, item) => acc + (item.new_valordeservico ?? 0),
    0
  );

  const valorSubtotal = valorTotalProdutos + valorTotalServicos;

  // Aplicar desconto percentual
  const descontoPercentual = orcamento.new_descontopercentual ?? 0;
  const valorDesconto = valorSubtotal * (descontoPercentual / 100);

  // Subtrair créditos
  const creditosUtilizados = orcamento.new_creditoutilizado ?? 0;

  // Valor total
  const valorTotal = valorSubtotal - valorDesconto - creditosUtilizados;

  return {
    valorTotalProdutos,
    valorTotalServicos,
    valorSubtotal,
    descontoPercentual,
    valorDesconto,
    creditosUtilizados,
    valorTotal,
    valorPago: 0, // TODO: Calcular baseado nas parcelas pagas
    saldoDevedor: valorTotal,
  };
}

// ============================================================================
// Gerenciamento de seções/abas
// ============================================================================

/**
 * Extrai as seções únicas dos itens
 */
export function extrairSecoes(itens: ItemOrcamento[]): OrcamentoSecao[] {
  console.log('[extrairSecoes] Iniciando cálculo de seções', {
    totalItens: itens.length
  });

  const secoesMap = new Map<string, OrcamentoSecao>();

  itens.forEach((item) => {
    const sectionName = item.new_section || 'Sem Seção';
    const orderIndex = item.new_sectionorderindex ?? 0;

    if (!secoesMap.has(sectionName)) {
      secoesMap.set(sectionName, {
        name: sectionName,
        orderIndex,
        itemCount: 0,
        valorTotal: 0,
      });
    }

    const secao = secoesMap.get(sectionName)!;
    const valorAnterior = secao.valorTotal;
    // Calcular valor total corretamente ao invés de usar new_valortotal do banco
    const valorItem = (item.new_valordeproduto ?? 0) + (item.new_valordeservico ?? 0);
    secao.itemCount++;
    secao.valorTotal += valorItem;

    console.log(`[Seção: ${sectionName}] Adicionando item`, {
      ref: item.new_ref,
      new_valortotal: item.new_valortotal,
      new_quantidade: item.new_quantidade,
      new_valordeproduto: item.new_valordeproduto,
      new_valordeservico: item.new_valordeservico,
      valorCalculado: valorItem,
      valorAnterior,
      valorNovo: secao.valorTotal
    });
  });

  const resultado = ordenarSecoes(Array.from(secoesMap.values()));

  console.log('[extrairSecoes] Resultado final:', {
    secoes: resultado.map(s => ({
      name: s.name,
      itemCount: s.itemCount,
      valorTotal: s.valorTotal
    }))
  });

  return resultado;
}

/**
 * Ordena seções seguindo a lógica do guia:
 * 1. Por sectionOrderIndex (ascendente)
 * 2. "DEVOLUÇÃO" sempre por último
 * 3. Alfabético como fallback
 */
export function ordenarSecoes(secoes: OrcamentoSecao[]): OrcamentoSecao[] {
  return secoes.sort((a, b) => {
    // DEVOLUÇÃO sempre por último
    if (a.name === SECAO_ESPECIAL.DEVOLUCAO) return 1;
    if (b.name === SECAO_ESPECIAL.DEVOLUCAO) return -1;

    // Ordenar por orderIndex
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }

    // Fallback alfabético
    return a.name.localeCompare(b.name);
  });
}

/**
 * Calcula novos orderIndex após reordenação por drag-and-drop
 */
export function recalcularOrderIndex(
  secoes: OrcamentoSecao[],
  startIndex: number,
  endIndex: number
): OrcamentoSecao[] {
  const result = Array.from(secoes);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  // Atribuir novos índices com gaps de 10
  return result.map((secao, index) => ({
    ...secao,
    orderIndex: index * 10,
  }));
}

// ============================================================================
// Validação e expiração
// ============================================================================

/**
 * Verifica se o orçamento está expirado (> 20 dias)
 */
export function isOrcamentoExpirado(orcamento: Orcamento): boolean {
  if (!orcamento.createdon) return false;

  const dataCriacao = new Date(orcamento.createdon);
  const dataExpiracao = addDays(dataCriacao, EXPIRACAO_REGRAS.ORCAMENTO_DIAS);
  const hoje = new Date();

  return isAfter(hoje, dataExpiracao);
}

/**
 * Calcula quantos dias restam até a expiração do orçamento
 */
export function diasRestantesExpiracao(orcamento: Orcamento): number {
  if (!orcamento.createdon) return 0;

  const dataCriacao = new Date(orcamento.createdon);
  const dataExpiracao = addDays(dataCriacao, EXPIRACAO_REGRAS.ORCAMENTO_DIAS);
  const hoje = new Date();

  return differenceInDays(dataExpiracao, hoje);
}

/**
 * Verifica se um item está expirado (> 10 dias com preço desatualizado)
 */
export function isItemExpirado(item: ItemOrcamento): boolean {
  if (!item.createdon) return false;

  // Se o preço foi sobreposto (congelado), não expira
  if (item.new_congelar) return false;

  const dataCriacao = new Date(item.createdon);
  const dataExpiracao = addDays(dataCriacao, EXPIRACAO_REGRAS.ITEM_DIAS);
  const hoje = new Date();

  return isAfter(hoje, dataExpiracao);
}

/**
 * Calcula status de expiração completo
 */
export function calcularExpiracaoStatus(
  orcamento: Orcamento,
  itens: ItemOrcamento[]
): ExpiracaoStatus {
  return {
    orcamentoExpirado: isOrcamentoExpirado(orcamento),
    orcamentoDiasRestantes: diasRestantesExpiracao(orcamento),
    itensExpirados: itens.filter(isItemExpirado),
  };
}

// ============================================================================
// Status de itens
// ============================================================================

/**
 * Calcula o status de disponibilidade de um item
 * TODO: Integrar com sistema de estoque quando disponível
 */
export function calcularItemStatus(item: ItemOrcamento): ItemStatus {
  // Placeholder - integração futura com estoque
  return {
    available: true,
    partial: false,
    unavailable: false,
    expired: isItemExpirado(item),
  };
}

// ============================================================================
// Formatação
// ============================================================================

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata percentual
 */
export function formatarPercentual(
  valor: number | null | undefined
): string {
  if (valor === null || valor === undefined) return '0%';

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor / 100);
}

/**
 * Formata data
 */
export function formatarData(data: string | null | undefined): string {
  if (!data) return '-';

  return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
}

/**
 * Formata data e hora
 */
export function formatarDataHora(data: string | null | undefined): string {
  if (!data) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
}

// ============================================================================
// Helpers de query
// ============================================================================

/**
 * Divide array de IDs em chunks para evitar query string muito longa
 */
export function chunkIds<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Constrói filtro OData para lista de IDs
 */
export function buildIdFilter(
  fieldName: string,
  ids: string[]
): string | null {
  if (ids.length === 0) return null;

  const conditions = ids.map((id) => `${fieldName} eq '${id}'`);
  return conditions.join(' or ');
}

// ============================================================================
// Validações
// ============================================================================

/**
 * Valida se a quantidade é válida
 */
export function isQuantidadeValida(quantidade: number | null | undefined): boolean {
  if (quantidade === null || quantidade === undefined) return false;
  return quantidade > 0 && Number.isFinite(quantidade);
}

/**
 * Valida se o orçamento pode ser editado
 */
export function podeEditarOrcamento(orcamento: Orcamento): boolean {
  // Não pode editar se publicado
  if (orcamento.new_publicado) return false;

  // Não pode editar se expirado
  if (isOrcamentoExpirado(orcamento)) return false;

  // Não pode editar se inativo
  if (orcamento.statecode === 1) return false;

  return true;
}

/**
 * Valida se o orçamento pode ser publicado
 */
export function podePublicarOrcamento(orcamento: Orcamento, itens: ItemOrcamento[]): boolean {
  // Precisa ter itens
  if (itens.length === 0) return false;

  // Não pode estar expirado
  if (isOrcamentoExpirado(orcamento)) return false;

  // Precisa ter cliente
  if (!orcamento.new_cliente) return false;

  // Não pode estar já publicado
  if (orcamento.new_publicado) return false;

  return true;
}

// ============================================================================
// Cálculo de Serviços
// ============================================================================

/**
 * Interface para serviço calculado e agrupado
 */
export interface ServicoCalculado {
  id: string; // GUID gerado para identificar a linha
  descricao: string;
  valorTotal: number;
  section: string;
  remocaoPermitida: boolean;
  isServico: true;
}

/**
 * Calcula e agrupa serviços baseados nos itens do orçamento
 * Replica a lógica do BudgetViewComponent do PowerApps
 *
 * @param items - Itens do orçamento
 * @param refToPrecoId - Map de referência → precodeprodutoid
 * @param tiposServico - Map de precodeprodutoid → tipos de serviço
 * @param isencoesIds - Set de IDs de tipos de serviço isentos
 * @returns Array de serviços calculados e agrupados por descrição/seção
 */
export function calcularServicosAgrupados(
  items: ItemOrcamento[],
  refToPrecoId: Map<string, string>,
  tiposServico: Map<string, TipoServicoPreco[]>,
  isencoesIds: Set<string> = new Set()
): ServicoCalculado[] {
  console.log('[calcularServicosAgrupados] Iniciando', {
    totalItems: items.length,
    totalRefs: refToPrecoId.size,
    totalTiposServico: tiposServico.size
  });

  const servicosMap = new Map<string, ServicoCalculado>();

  items.forEach(item => {
    const ref = item.new_ref;
    if (!ref) return;

    // Buscar o ID do preço de produto
    const precoId = refToPrecoId.get(ref);
    if (!precoId) return;

    // Buscar os tipos de serviço associados a este preço
    const tiposDoItem = tiposServico.get(precoId) || [];

    // LOG: Dados do item sendo processado
    console.log(`[Item: ${ref}]`, {
      new_valordeproduto: item.new_valordeproduto,
      new_valordeservico: item.new_valordeservico,
      new_valortotal: item.new_valortotal,
      new_quantidade: item.new_quantidade,
      new_section: item.new_section,
      tiposDeServicoCount: tiposDoItem.length
    });

    tiposDoItem.forEach(tipo => {
      // Verificar se está isento
      if (isencoesIds.has(tipo.tipoDeServicoId)) return;

      let valor = 0;
      const isVariavel = tipo.taxaPercentual > 0;

      // LOG: Dados do tipo de serviço
      console.log(`  [Serviço: ${tipo.descricaoDoServico}]`, {
        taxaPercentual: tipo.taxaPercentual,
        taxaFixa: tipo.taxaFixa,
        isVariavel
      });

      // Serviço variável (percentual sobre new_valordeservico)
      if (isVariavel) {
        const valorBase = item.new_valordeservico || 0;
        //const quantidade = item.new_quantidade || 1;
        valor = valorBase ;// * tipo.taxaPercentual * quantidade;
      }
      // Serviço fixo
      else if (tipo.taxaFixa > 0) {
        valor = tipo.taxaFixa;
        console.log(`    Cálculo fixo:`, {
          taxaFixa: tipo.taxaFixa,
          resultado: valor
        });
      }

      if (valor <= 0) return;

      // Criar chave única por descrição e seção
      const key = `${item.new_section || ''}_${tipo.descricaoDoServico}`;
      const existing = servicosMap.get(key);

      if (existing) {
        const valorAnterior = existing.valorTotal;
        // Para variáveis: soma / Para fixos: pega o maior
        if (isVariavel) {
          existing.valorTotal += valor;
        } else {
          existing.valorTotal = Math.max(existing.valorTotal, valor);
        }

        // LOG: Agrupamento
        console.log(`    Agrupando:`, {
          valorAnterior,
          valorNovo: valor,
          valorFinal: existing.valorTotal,
          operacao: isVariavel ? 'soma' : 'max'
        });
      } else {
        servicosMap.set(key, {
          id: crypto.randomUUID(),
          descricao: tipo.descricaoDoServico,
          valorTotal: valor,
          section: item.new_section || '',
          remocaoPermitida: tipo.remocaoPermitida,
          isServico: true
        });

        console.log(`    Criando novo serviço:`, {
          key,
          valorTotal: valor
        });
      }
    });
  });

  const resultado = Array.from(servicosMap.values());

  console.log('[calcularServicosAgrupados] Resultado:', {
    totalServicos: resultado.length,
    servicos: resultado.map(s => ({
      descricao: s.descricao,
      valorTotal: s.valorTotal,
      section: s.section
    }))
  });

  return resultado;
}
