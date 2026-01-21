import type { MercadoriaLida } from '../../types';

/**
 * Define se uma mercadoria é considerada ativa seguindo a regra:
 * Status (statecode) deve ser 0 (Ativo) E a Tag deve estar confirmada.
 */
export const isMercadoriaAtiva = (item: MercadoriaLida): boolean => {
  return item.status === 0 && !!item.tagConfirmadaBool;
};

/**
 * Retorna o texto da situação da mercadoria.
 */
export const getMercadoriaSituacaoTexto = (item: MercadoriaLida): string => {
  if (isMercadoriaAtiva(item)) {
    return item.situacao ?? 'Ativo';
  }
  return 'Inativo';
};
