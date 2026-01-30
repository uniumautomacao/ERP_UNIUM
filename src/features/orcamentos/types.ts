/**
 * Tipos e interfaces para o módulo de Orçamentos
 * Baseado nas entidades do Dataverse
 */

// ============================================================================
// Entidades principais
// ============================================================================

/**
 * Orçamento principal
 * Entidade: new_orcamento
 */
export interface Orcamento {
  new_orcamentoid: string;
  new_name?: string | null;
  new_numerodaproposta?: string | null;

  // Relacionamentos
  new_cliente?: string | null; // ID do contact
  new_nomecliente?: string | null; // Computed
  new_consultor?: string | null; // ID do systemuser
  new_nomeconsultor?: string | null; // Computed
  new_projeto?: string | null; // ID do projeto
  new_nomeprojeto?: string | null; // Computed

  // Informações financeiras
  new_valortotal?: number | null;
  new_creditoutilizado?: number | null;
  new_custosdecompra?: number | null;
  new_descontopercentual?: number | null;

  // Datas
  createdon?: string | null;
  new_datapublicacao?: string | null;
  new_datemodified?: string | null;
  new_dataimportacao?: string | null;

  // Status e flags
  statecode?: number | null; // 0 = Active, 1 = Inactive
  statuscode?: number | null;
  new_publicado?: boolean | null;
  new_arquivado?: boolean | null;
  new_seminstalacao?: boolean | null;
  new_duplicacaoemandamento?: boolean | null;

  // Descrições e notas
  new_anotacao?: string | null;
  new_descricaodepagamento?: string | null;

  // Canvas (legado - ignorar)
  new_canvasmetadata?: string | null;
  new_canvassections?: string | null;
  new_canvasgridvisible?: boolean | null;

  // Arquivos PDF
  new_contratodecompraevendaempdf?: string | null;
  new_demonstrativoempdf?: string | null;
  new_arquivodocontratoassinado?: string | null;
  new_arquivodopedidoassinado?: string | null;
}

/**
 * Item de orçamento
 * Entidade: new_itemdeorcamento
 */
export interface ItemOrcamento {
  new_itemdeorcamentoid: string;
  new_name?: string | null;

  // Relacionamentos
  new_orcamento?: string | null; // ID do orçamento
  new_produto?: string | null; // ID do produto
  new_parent?: string | null; // ID do item pai (para hierarquia)
  _new_precodeproduto_value?: string | null; // ID do preço de produto (lookup)

  // Informações do produto
  new_ref?: string | null;
  new_descricao?: string | null;
  new_descricaopersonalizada?: string | null;
  new_descricaocalculada?: string | null;
  new_ambiente?: string | null;

  // Quantidades
  new_quantidade?: number | null;
  new_quantidadedevolvida?: number | null;
  new_quantidadedisponiveldevolucao?: number | null;

  // Valores
  new_valordeproduto?: number | null;
  new_valordeservico?: number | null;
  new_valortotal?: number | null;
  new_valororiginaldoproduto?: number | null;
  new_valorfinalnegociado?: number | null;
  new_valorfinalnegociadodeservico?: number | null;
  new_valordesobreposicao?: number | null;
  new_valorservicodesobreposicao?: number | null;

  // Custos
  new_custodecompra?: number | null;
  new_custodecomprafixado?: number | null;
  new_acrescimo?: number | null;
  new_lucrobrutototal?: number | null;

  // Seção/Tab
  new_section?: string | null;
  new_sectionorderindex?: number | null;
  new_position?: number | null;

  // Flags
  new_kit?: boolean | null;
  new_removido?: boolean | null;
  new_edevolucao?: boolean | null;
  new_congelar?: boolean | null;
  new_orcamentofoipublicado?: boolean | null;
  new_duplicacaosolicitada?: boolean | null;

  // Option sets
  new_opcaodefornecimento?: number | null; // Padrão, Fornecido pelo Cliente, Removido
  new_opcaodedevolucao?: number | null;
  new_tipodeorcamento?: number | null;
  new_tipodeospadrao?: number | null;
  new_tipodesistema?: number | null;

  // Canvas (legado - ignorar)
  new_canvasx?: number | null;
  new_canvasy?: number | null;
  new_canvaszone?: string | null;
  new_canvaszoom?: number | null;
  new_isincanvas?: boolean | null;

  // Metadata
  createdon?: string | null;
  statecode?: number | null;
  statuscode?: number | null;
}

/**
 * Opção de pagamento
 * Entidade: new_opcaodepagamento
 */
export interface OpcaoPagamento {
  new_opcaodepagamentoid: string;
  new_name?: string | null;

  // Relacionamento
  new_orcamento?: string | null;

  // Informações de pagamento
  new_descontopercentual?: number | null;
  new_valortotal?: number | null;
  new_creditoutilizado?: number | null;
  new_saldodevedor?: number | null;
  new_numerodeparcelas?: number | null;

  // Status
  new_confirmado?: boolean | null;
  statecode?: number | null;
  statuscode?: number | null;
}

/**
 * Parcela de opção de pagamento
 * Entidade: new_parcelaopcaodepagamento
 */
export interface ParcelaPagamento {
  new_parcelaopcaodepagamentoid: string;
  new_name?: string | null;

  // Relacionamento
  new_opcaodepagamento?: string | null;

  // Informações da parcela
  new_numero?: number | null;
  new_valor?: number | null;
  new_datavencimento?: string | null;
  new_descricao?: string | null;

  // Status
  statecode?: number | null;
  statuscode?: number | null;
}

/**
 * Crédito do cliente
 * Entidade: new_creditosdocliente
 */
export interface CreditoCliente {
  new_creditosdoclienteid: string;
  new_name?: string | null;

  // Relacionamento
  new_cliente?: string | null;

  // Informações do crédito
  new_valordisponivel?: number | null;
  new_valororiginal?: number | null;
  new_valorutilizado?: number | null;
  new_dataexpiracao?: string | null;
  new_observacoes?: string | null;

  // Status
  statecode?: number | null;
  statuscode?: number | null;
}

/**
 * Utilização de crédito
 * Entidade: new_utilizacaodecredito
 */
export interface UtilizacaoCredito {
  new_utilizacaodecreditoid: string;
  new_name?: string | null;

  // Relacionamentos
  new_orcamento?: string | null;
  new_creditosdocliente?: string | null;

  // Informações de utilização
  new_valor?: number | null;
  new_datautilizacao?: string | null;
  new_confirmado?: boolean | null;

  // Status
  statecode?: number | null;
  statuscode?: number | null;
}

/**
 * Isenção de serviço em orçamento
 * Entidade: new_isencaodeservicoemorcamento
 */
export interface IsencaoServico {
  new_isencaodeservicoemorcamentoid: string;
  new_name?: string | null;

  // Relacionamentos
  new_orcamento?: string | null;
  new_tipodeservico?: string | null;

  // Informações
  new_valor?: number | null;
  new_justificativa?: string | null;

  // Status
  statecode?: number | null;
  statuscode?: number | null;
}

// ============================================================================
// Tipos auxiliares
// ============================================================================

/**
 * Representação de uma seção/aba do orçamento
 */
export interface OrcamentoSecao {
  name: string;
  orderIndex: number;
  itemCount: number;
  valorTotal: number;
}

/**
 * Status de item com indicadores visuais
 */
export interface ItemStatus {
  available: boolean; // Disponível em estoque
  partial: boolean; // Parcialmente disponível
  unavailable: boolean; // Indisponível
  expired: boolean; // Item expirado (> 10 dias)
}

/**
 * Resumo financeiro do orçamento
 */
export interface OrcamentoResumo {
  valorTotalProdutos: number;
  valorTotalServicos: number;
  valorSubtotal: number;
  descontoPercentual: number;
  valorDesconto: number;
  creditosUtilizados: number;
  valorTotal: number;
  valorPago: number;
  saldoDevedor: number;
}

/**
 * Filtros para lista de orçamentos
 */
export interface OrcamentoFiltros {
  searchText?: string;
  cliente?: string;
  consultor?: string;
  status?: 'rascunho' | 'publicado' | 'arquivado';
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Status de expiração
 */
export interface ExpiracaoStatus {
  orcamentoExpirado: boolean; // > 20 dias
  orcamentoDiasRestantes: number;
  itensExpirados: ItemOrcamento[];
}
