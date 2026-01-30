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
 * Nome padrão para seção sem nome definido
 */
export const SECAO_SEM_NOME = 'Sem Seção';

/**
 * Calcula o valor total de um item de orçamento
 *
 * IMPORTANTE: new_valortotal no banco Dataverse está incorreto (multiplicado por quantidade 2x)
 * Por isso calculamos: new_valordeproduto + new_valordeservico
 * (ambos já incluem quantidade multiplicada corretamente)
 */
export function calcularValorTotalItem(item: ItemOrcamento): number {
  return (item.new_valordeproduto ?? 0) + (item.new_valordeservico ?? 0);
}

/**
 * Interface para totais de itens de orçamento
 */
export interface ItemTotals {
  totalItems: number;
  totalProducts: number;
  totalServices: number;
  totalValue: number;
}

/**
 * Calcula totais agregados de uma lista de itens
 */
export function calcularTotaisItens(items: ItemOrcamento[]): ItemTotals {
  return items.reduce(
    (acc, item) => {
      const valorProduto = item.new_valordeproduto ?? 0;
      const valorServico = item.new_valordeservico ?? 0;
      const valorTotal = calcularValorTotalItem(item);

      return {
        totalItems: acc.totalItems + 1,
        totalProducts: acc.totalProducts + valorProduto,
        totalServices: acc.totalServices + valorServico,
        totalValue: acc.totalValue + valorTotal,
      };
    },
    { totalItems: 0, totalProducts: 0, totalServices: 0, totalValue: 0 }
  );
}

/**
 * Calcula o valor total de uma lista de itens (soma de todos os valores)
 */
export function somarValorTotalItens(items: ItemOrcamento[]): number {
  return items.reduce((sum, item) => sum + calcularValorTotalItem(item), 0);
}

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
  const secoesMap = new Map<string, OrcamentoSecao>();

  itens.forEach((item) => {
    const sectionName = item.new_section || SECAO_SEM_NOME;
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
    const valorItem = calcularValorTotalItem(item);
    secao.itemCount++;
    secao.valorTotal += valorItem;
  });

  return ordenarSecoes(Array.from(secoesMap.values()));
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
  const servicosMap = new Map<string, ServicoCalculado>();

  items.forEach(item => {
    const ref = item.new_ref;
    if (!ref) return;

    // Buscar o ID do preço de produto
    const precoId = refToPrecoId.get(ref);
    if (!precoId) return;

    // Buscar os tipos de serviço associados a este preço
    const tiposDoItem = tiposServico.get(precoId) || [];

    tiposDoItem.forEach(tipo => {
      // Verificar se está isento
      if (isencoesIds.has(tipo.tipoDeServicoId)) return;

      let valor = 0;
      const isVariavel = tipo.taxaPercentual > 0;

      // Serviço variável (percentual sobre new_valordeservico)
      if (isVariavel) {
        valor = (item.new_valordeservico || 0) * tipo.taxaPercentual;
      }
      // Serviço fixo
      else if (tipo.taxaFixa > 0) {
        valor = tipo.taxaFixa;
      }

      if (valor <= 0) return;

      // Criar chave única por descrição e seção
      const key = `${item.new_section || ''}_${tipo.descricaoDoServico}`;
      const existing = servicosMap.get(key);

      if (existing) {
        // Para variáveis: soma / Para fixos: pega o maior
        if (isVariavel) {
          existing.valorTotal += valor;
        } else {
          existing.valorTotal = Math.max(existing.valorTotal, valor);
        }
      } else {
        servicosMap.set(key, {
          id: crypto.randomUUID(),
          descricao: tipo.descricaoDoServico,
          valorTotal: valor,
          section: item.new_section || '',
          remocaoPermitida: tipo.remocaoPermitida,
          isServico: true
        });
      }
    });
  });

  return Array.from(servicosMap.values());
}
