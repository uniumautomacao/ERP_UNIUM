/*!
 * Service para a tabela new_itemdeorcamento
 * Gerencia operações CRUD de itens de orçamento
 */
import type { IGetAllOptions } from '../../generated/models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';
import type { ItemOrcamento } from '../../features/orcamentos/types';

// Constante de chunking para operações em lote
const ITEM_CHUNK_SIZE = 25;

export class ItemOrcamentoService {
  private static readonly dataSourceName = 'new_itemdeorcamentos';
  private static readonly client = getClient(dataSourcesInfo);

  /**
   * Buscar itens do orçamento
   */
  public static async fetchItemsByOrcamento(
    orcamentoId: string,
    includeInactive: boolean = false
  ): Promise<ItemOrcamento[]> {
    const filter = includeInactive
      ? `_new_orcamento_value eq '${orcamentoId}'`
      : `_new_orcamento_value eq '${orcamentoId}' and statecode eq 0`;

    const options: IGetAllOptions = {
      filter,
      orderBy: 'new_sectionorderindex,new_position',
    };

    const result = await ItemOrcamentoService.client.retrieveMultipleRecordsAsync(
      ItemOrcamentoService.dataSourceName,
      options
    );

    if (result.isSuccess && result.value) {
      return result.value as ItemOrcamento[];
    }

    return [];
  }

  /**
   * Buscar itens por seção específica
   */
  public static async fetchItemsBySection(
    orcamentoId: string,
    section: string
  ): Promise<ItemOrcamento[]> {
    const filter = `_new_orcamento_value eq '${orcamentoId}' and new_section eq '${section}' and statecode eq 0`;

    const options: IGetAllOptions = {
      filter,
      orderBy: 'new_position',
    };

    const result = await ItemOrcamentoService.client.retrieveMultipleRecordsAsync(
      ItemOrcamentoService.dataSourceName,
      options
    );

    if (result.isSuccess && result.value) {
      return result.value as ItemOrcamento[];
    }

    return [];
  }

  /**
   * Criar item
   */
  public static async createItem(item: Partial<ItemOrcamento>): Promise<string> {
    const recordData: Partial<ItemOrcamento> = {
      ...item,
      statecode: 0, // Active
      statuscode: 1,
      new_removido: false,
    };

    // Converter relacionamentos para formato OData bind
    const record: any = { ...recordData };
    if (item.new_orcamento) {
      record['new_orcamento@odata.bind'] = `/new_orcamentos(${item.new_orcamento})`;
      delete record.new_orcamento;
    }
    if (item.new_produto) {
      record['new_produto@odata.bind'] = `/new_produtos(${item.new_produto})`;
      delete record.new_produto;
    }
    if (item.new_parent) {
      record['new_parent@odata.bind'] = `/new_itemdeorcamentos(${item.new_parent})`;
      delete record.new_parent;
    }

    const result = await ItemOrcamentoService.client.createRecordAsync(
      ItemOrcamentoService.dataSourceName,
      record
    );

    if (result.isSuccess && result.value) {
      return result.value.new_itemdeorcamentoid;
    }

    throw new Error('Falha ao criar item de orçamento');
  }

  /**
   * Atualizar item
   */
  public static async updateItem(
    itemId: string,
    data: Partial<ItemOrcamento>
  ): Promise<void> {
    const changedFields: any = { ...data };

    // Converter relacionamentos para formato OData bind
    if (data.new_orcamento) {
      changedFields['new_orcamento@odata.bind'] = `/new_orcamentos(${data.new_orcamento})`;
      delete changedFields.new_orcamento;
    }
    if (data.new_produto) {
      changedFields['new_produto@odata.bind'] = `/new_produtos(${data.new_produto})`;
      delete changedFields.new_produto;
    }
    if (data.new_parent) {
      changedFields['new_parent@odata.bind'] = `/new_itemdeorcamentos(${data.new_parent})`;
      delete changedFields.new_parent;
    }

    const result = await ItemOrcamentoService.client.updateRecordAsync(
      ItemOrcamentoService.dataSourceName,
      itemId,
      changedFields
    );

    if (!result.isSuccess) {
      throw new Error('Falha ao atualizar item de orçamento');
    }
  }

  /**
   * Atualizar itens em lote usando chunking
   * Divide em chunks de ITEM_CHUNK_SIZE para evitar timeouts
   */
  public static async updateItemsBatch(items: ItemOrcamento[]): Promise<void> {
    const updatePromises: Promise<void>[] = [];

    // Processar em chunks
    for (let i = 0; i < items.length; i += ITEM_CHUNK_SIZE) {
      const chunk = items.slice(i, i + ITEM_CHUNK_SIZE);

      // Processar chunk em paralelo
      const chunkPromises = chunk.map(item => {
        const { new_itemdeorcamentoid, ...data } = item;
        return ItemOrcamentoService.updateItem(new_itemdeorcamentoid, data);
      });

      updatePromises.push(...chunkPromises);

      // Aguardar chunk completar antes de processar próximo
      await Promise.all(chunkPromises);
    }
  }

  /**
   * Deletar item (desativar)
   */
  public static async deleteItem(itemId: string): Promise<void> {
    await ItemOrcamentoService.updateItem(itemId, {
      statecode: 1, // Inactive
      new_removido: true,
    });
  }

  /**
   * Deletar múltiplos itens em lote
   */
  public static async deleteItemsBatch(itemIds: string[]): Promise<void> {
    // Processar em chunks
    for (let i = 0; i < itemIds.length; i += ITEM_CHUNK_SIZE) {
      const chunk = itemIds.slice(i, i + ITEM_CHUNK_SIZE);

      const chunkPromises = chunk.map(id => ItemOrcamentoService.deleteItem(id));
      await Promise.all(chunkPromises);
    }
  }

  /**
   * Mover item para outra seção
   */
  public static async moveItemToSection(
    itemId: string,
    newSection: string,
    newOrderIndex?: number
  ): Promise<void> {
    const data: Partial<ItemOrcamento> = {
      new_section: newSection,
    };

    if (newOrderIndex !== undefined) {
      data.new_sectionorderindex = newOrderIndex;
    }

    await ItemOrcamentoService.updateItem(itemId, data);
  }

  /**
   * Duplicar item
   */
  public static async duplicateItem(itemId: string): Promise<string> {
    // Buscar item original
    const result = await ItemOrcamentoService.client.retrieveRecordAsync(
      ItemOrcamentoService.dataSourceName,
      itemId
    );

    if (!result.isSuccess || !result.value) {
      throw new Error('Item não encontrado');
    }

    const original = result.value as ItemOrcamento;

    // Criar cópia
    const novoDado: Partial<ItemOrcamento> = {
      new_orcamento: original.new_orcamento,
      new_produto: original.new_produto,
      new_section: original.new_section,
      new_ambiente: original.new_ambiente,
      new_ref: original.new_ref,
      new_descricao: original.new_descricao,
      new_descricaopersonalizada: original.new_descricaopersonalizada,
      new_quantidade: original.new_quantidade,
      new_valordeproduto: original.new_valordeproduto,
      new_valordeservico: original.new_valordeservico,
      new_valortotal: original.new_valortotal,
      new_kit: original.new_kit,
      new_opcaodefornecimento: original.new_opcaodefornecimento,
      new_tipodeorcamento: original.new_tipodeorcamento,
    };

    return await ItemOrcamentoService.createItem(novoDado);
  }

  /**
   * Reordenar itens dentro de uma seção
   */
  public static async reorderItems(items: { id: string; position: number }[]): Promise<void> {
    // Processar em chunks
    for (let i = 0; i < items.length; i += ITEM_CHUNK_SIZE) {
      const chunk = items.slice(i, i + ITEM_CHUNK_SIZE);

      const chunkPromises = chunk.map(({ id, position }) =>
        ItemOrcamentoService.updateItem(id, { new_position: position })
      );

      await Promise.all(chunkPromises);
    }
  }

  /**
   * Calcular totais da seção
   */
  public static calcularTotaisSecao(items: ItemOrcamento[]): {
    totalProdutos: number;
    totalServicos: number;
    totalGeral: number;
    itemCount: number;
  } {
    const totals = items.reduce(
      (acc, item) => {
        const valorProduto = item.new_valordeproduto || 0;
        const valorServico = item.new_valordeservico || 0;
        const quantidade = item.new_quantidade || 0;

        acc.totalProdutos += valorProduto * quantidade;
        acc.totalServicos += valorServico * quantidade;
        acc.totalGeral += (item.new_valortotal || 0);

        return acc;
      },
      { totalProdutos: 0, totalServicos: 0, totalGeral: 0, itemCount: items.length }
    );

    return totals;
  }
}
