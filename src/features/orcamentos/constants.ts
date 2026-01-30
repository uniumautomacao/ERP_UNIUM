/**
 * Constantes para o módulo de Orçamentos
 */

// ============================================================================
// Status codes (Dataverse)
// ============================================================================

export const STATE_CODE = {
  ACTIVE: 0,
  INACTIVE: 1,
} as const;

export const STATUS_CODE = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

// ============================================================================
// Opções de fornecimento (Option Set)
// ============================================================================

export const OPCAO_FORNECIMENTO = {
  PADRAO: 100000000,
  FORNECIDO_CLIENTE: 100000001,
  REMOVIDO_FUTURA: 100000002,
} as const;

export const OPCAO_FORNECIMENTO_LABELS: Record<number, string> = {
  [OPCAO_FORNECIMENTO.PADRAO]: 'Padrão',
  [OPCAO_FORNECIMENTO.FORNECIDO_CLIENTE]: 'Fornecido pelo Cliente',
  [OPCAO_FORNECIMENTO.REMOVIDO_FUTURA]: 'Removido para Compra Futura',
};

// ============================================================================
// Status de orçamento (personalizado para UI)
// ============================================================================

export const ORCAMENTO_STATUS = {
  RASCUNHO: 'rascunho',
  PUBLICADO: 'publicado',
  ARQUIVADO: 'arquivado',
  EXPIRADO: 'expirado',
} as const;

export type OrcamentoStatus =
  (typeof ORCAMENTO_STATUS)[keyof typeof ORCAMENTO_STATUS];

export const ORCAMENTO_STATUS_LABELS: Record<string, string> = {
  [ORCAMENTO_STATUS.RASCUNHO]: 'Rascunho',
  [ORCAMENTO_STATUS.PUBLICADO]: 'Publicado',
  [ORCAMENTO_STATUS.ARQUIVADO]: 'Arquivado',
  [ORCAMENTO_STATUS.EXPIRADO]: 'Expirado',
};

export const ORCAMENTO_STATUS_COLORS: Record<string, string> = {
  [ORCAMENTO_STATUS.RASCUNHO]: 'warning',
  [ORCAMENTO_STATUS.PUBLICADO]: 'success',
  [ORCAMENTO_STATUS.ARQUIVADO]: 'neutral',
  [ORCAMENTO_STATUS.EXPIRADO]: 'danger',
};

// ============================================================================
// Regras de expiração
// ============================================================================

export const EXPIRACAO_REGRAS = {
  ORCAMENTO_DIAS: 20, // Orçamento expira após 20 dias
  ITEM_DIAS: 10, // Item expira se preço desatualizado por 10+ dias
} as const;

// ============================================================================
// Nomes de seções especiais
// ============================================================================

export const SECAO_ESPECIAL = {
  DEVOLUCAO: 'DEVOLUÇÃO',
} as const;

// ============================================================================
// Configurações de paginação e chunking
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 5000,
} as const;

export const QUERY_LIMITS = {
  CHUNK_SIZE: 25, // Para queries com múltiplos IDs
  MAX_EXPAND_DEPTH: 2,
} as const;

// ============================================================================
// Colunas do DataGrid
// ============================================================================

export const PRODUCT_LIST_COLUMNS = {
  STATUS_ICON: { key: 'statusIcon', width: 30, minWidth: 30, maxWidth: 30 },
  AMBIENTE: { key: 'ambiente', width: 100, minWidth: 80, maxWidth: 150 },
  REF: { key: 'ref', width: 80, minWidth: 60, maxWidth: 120 },
  DESCRICAO: { key: 'descricao', width: 300, minWidth: 200, maxWidth: 500 },
  QUANTIDADE: { key: 'quantidade', width: 80, minWidth: 60, maxWidth: 100 },
  VALOR_UNITARIO: {
    key: 'valorUnitario',
    width: 120,
    minWidth: 100,
    maxWidth: 150,
  },
  VALOR_TOTAL: { key: 'valorTotal', width: 120, minWidth: 100, maxWidth: 150 },
} as const;

// ============================================================================
// Layout dimensions (3-column design)
// ============================================================================

export const LAYOUT = {
  TAB_NAVIGATION_WIDTH: 200, // px
  AI_CHAT_WIDTH: 320, // px
  CONTENT_MIN_WIDTH: 400, // px
} as const;

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULTS = {
  SECTION_ORDER_INCREMENT: 10, // Incremento padrão para orderIndex
  DESCONTO_PERCENTUAL: 0,
  NUMERO_PARCELAS: 1,
} as const;

// ============================================================================
// Formatação
// ============================================================================

export const FORMAT = {
  CURRENCY: 'R$ #,##0.00',
  DATE: 'dd/MM/yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  PERCENTAGE: '#,##0.00%',
} as const;

// ============================================================================
// Mensagens
// ============================================================================

export const MESSAGES = {
  EMPTY_STATE: {
    NO_ORCAMENTO: 'Nenhum orçamento selecionado',
    NO_ITEMS: 'Nenhum produto adicionado a este orçamento',
    NO_CREDITOS: 'Nenhum crédito disponível para este cliente',
    NO_PAGAMENTOS: 'Nenhuma opção de pagamento configurada',
  },
  ERRORS: {
    LOAD_ORCAMENTO: 'Erro ao carregar orçamento',
    LOAD_ITEMS: 'Erro ao carregar itens',
    LOAD_CREDITOS: 'Erro ao carregar créditos',
    SAVE_ORCAMENTO: 'Erro ao salvar orçamento',
    DELETE_ITEM: 'Erro ao excluir item',
    INVALID_QUANTITY: 'Quantidade inválida',
    ITEM_EXPIRED: 'Este item está expirado (preço desatualizado)',
  },
  SUCCESS: {
    ORCAMENTO_SAVED: 'Orçamento salvo com sucesso',
    ITEM_ADDED: 'Produto adicionado com sucesso',
    ITEM_DELETED: 'Produto removido com sucesso',
    PAGAMENTO_SAVED: 'Opção de pagamento salva com sucesso',
  },
  WARNINGS: {
    ORCAMENTO_EXPIRING: 'Este orçamento expira em {days} dias',
    ORCAMENTO_EXPIRED: 'Este orçamento está expirado',
    ITEMS_EXPIRED: '{count} itens com preços desatualizados',
  },
} as const;

// ============================================================================
// Icon names (Fluent UI)
// ============================================================================

export const ICONS = {
  STATUS_SELECTED: 'SkypeCircleCheck',
  STATUS_UNSELECTED: 'CircleRing',
  STATUS_PARENT: 'Link',
  STATUS_UNLINK: 'RemoveLink',
  STATUS_AVAILABLE: 'CheckmarkCircle',
  STATUS_PARTIAL: 'Warning',
  STATUS_UNAVAILABLE: 'ErrorCircle',
} as const;
