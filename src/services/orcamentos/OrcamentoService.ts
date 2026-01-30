/*!
 * Service para a tabela new_orcamento
 * Gerencia operações CRUD de orçamentos
 */
import type { IGetAllOptions, IGetOptions } from '../../generated/models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';
import type { Orcamento } from '../../features/orcamentos/types';

export class OrcamentoService {
  private static readonly dataSourceName = 'new_orcamentos';
  private static readonly client = getClient(dataSourcesInfo);

  /**
   * Buscar orçamentos do cliente
   */
  public static async fetchOrcamentosByCliente(
    clienteId: string,
    includeInactive: boolean = false
  ): Promise<Orcamento[]> {
    const filter = includeInactive
      ? `_new_cliente_value eq '${clienteId}'`
      : `_new_cliente_value eq '${clienteId}' and statecode eq 0`;

    const options: IGetAllOptions = {
      filter,
      orderBy: 'createdon desc',
      select: [
        'new_orcamentoid',
        'new_name',
        'new_valortotal',
        'new_creditoutilizado',
        'createdon',
        'new_datapublicacao',
        'statecode',
        'statuscode',
        'new_publicado',
        'new_arquivado',
      ],
    };

    const result = await OrcamentoService.client.retrieveMultipleRecordsAsync(
      OrcamentoService.dataSourceName,
      options
    );

    if (result.isSuccess && result.value) {
      return result.value as Orcamento[];
    }

    return [];
  }

  /**
   * Buscar orçamento por ID com relacionamentos expandidos
   */
  public static async fetchOrcamentoById(orcamentoId: string): Promise<Orcamento | null> {
    console.log('[OrcamentoService.fetchOrcamentoById] Buscando orçamento:', orcamentoId);

    const options: IGetOptions = {
      expand: [
        {
          navigationProperty: 'new_cliente',
          select: ['contactid', 'fullname'],
        },
        {
          navigationProperty: 'new_consultor',
          select: ['systemuserid', 'fullname'],
        },
      ],
    };

    console.log('[OrcamentoService.fetchOrcamentoById] Options:', options);

    const result = await OrcamentoService.client.retrieveRecordAsync(
      OrcamentoService.dataSourceName,
      orcamentoId,
      options
    );

    console.log('[OrcamentoService.fetchOrcamentoById] Resultado:', {
      isSuccess: result.isSuccess,
      success: (result as any).success,
      hasValue: !!result.value,
      hasData: !!(result as any).data,
      error: result.error,
      value: result.value,
      data: (result as any).data,
    });

    // A API pode retornar 'success' ou 'isSuccess' dependendo do método
    const success = result.isSuccess ?? (result as any).success;
    const value = result.value ?? (result as any).data;

    if (success && value) {
      return value as Orcamento;
    }

    return null;
  }

  /**
   * Criar novo orçamento
   */
  public static async createOrcamento(data: Partial<Orcamento>): Promise<string> {
    const recordData: Partial<Orcamento> = {
      ...data,
      statecode: 0, // Active
      statuscode: 1,
      new_publicado: false,
      new_arquivado: false,
    };

    // Converter relacionamentos para formato OData bind
    const record: any = { ...recordData };
    if (data.new_cliente) {
      record['new_cliente@odata.bind'] = `/contacts(${data.new_cliente})`;
      delete record.new_cliente;
    }
    if (data.new_consultor) {
      record['new_consultor@odata.bind'] = `/systemusers(${data.new_consultor})`;
      delete record.new_consultor;
    }

    const result = await OrcamentoService.client.createRecordAsync(
      OrcamentoService.dataSourceName,
      record
    );

    if (result.isSuccess && result.value) {
      return result.value.new_orcamentoid;
    }

    throw new Error('Falha ao criar orçamento');
  }

  /**
   * Atualizar orçamento
   */
  public static async updateOrcamento(
    orcamentoId: string,
    data: Partial<Orcamento>
  ): Promise<void> {
    const changedFields: any = { ...data };

    // Converter relacionamentos para formato OData bind
    if (data.new_cliente) {
      changedFields['new_cliente@odata.bind'] = `/contacts(${data.new_cliente})`;
      delete changedFields.new_cliente;
    }
    if (data.new_consultor) {
      changedFields['new_consultor@odata.bind'] = `/systemusers(${data.new_consultor})`;
      delete changedFields.new_consultor;
    }

    const result = await OrcamentoService.client.updateRecordAsync(
      OrcamentoService.dataSourceName,
      orcamentoId,
      changedFields
    );

    if (!result.isSuccess) {
      throw new Error('Falha ao atualizar orçamento');
    }
  }

  /**
   * Duplicar orçamento
   * Cria uma cópia do orçamento sem os itens (serão copiados separadamente)
   */
  public static async duplicateOrcamento(orcamentoId: string): Promise<string> {
    // Buscar orçamento original
    const original = await OrcamentoService.fetchOrcamentoById(orcamentoId);
    if (!original) {
      throw new Error('Orçamento não encontrado');
    }

    // Criar cópia
    const novoDado: Partial<Orcamento> = {
      new_name: `${original.new_name} (Cópia)`,
      new_cliente: original.new_cliente,
      new_consultor: original.new_consultor,
      new_projeto: original.new_projeto,
      new_descontopercentual: original.new_descontopercentual,
      new_seminstalacao: original.new_seminstalacao,
      new_anotacao: original.new_anotacao,
      new_descricaodepagamento: original.new_descricaodepagamento,
    };

    return await OrcamentoService.createOrcamento(novoDado);
  }

  /**
   * Deletar orçamento (desativar)
   */
  public static async deleteOrcamento(orcamentoId: string): Promise<void> {
    await OrcamentoService.updateOrcamento(orcamentoId, {
      statecode: 1, // Inactive
    });
  }

  /**
   * Arquivar orçamento
   */
  public static async arquivarOrcamento(orcamentoId: string): Promise<void> {
    await OrcamentoService.updateOrcamento(orcamentoId, {
      new_arquivado: true,
    });
  }

  /**
   * Publicar orçamento
   */
  public static async publicarOrcamento(orcamentoId: string): Promise<void> {
    await OrcamentoService.updateOrcamento(orcamentoId, {
      new_publicado: true,
      new_datapublicacao: new Date().toISOString(),
    });
  }

  /**
   * Buscar todos os orçamentos com filtros opcionais
   */
  public static async fetchAll(options?: IGetAllOptions): Promise<Orcamento[]> {
    const result = await OrcamentoService.client.retrieveMultipleRecordsAsync(
      OrcamentoService.dataSourceName,
      options
    );

    if (result.success && result.data) {
      return result.data as Orcamento[];
    }

    if (result.error) {
      console.error('[OrcamentoService.fetchAll] erro na query', {
        error: result.error,
        options,
      });
    }

    return [];
  }
}
