/*!
 * Serviço manual para a tabela new_cotacaos.
 */
import type { IGetAllOptions, IGetOptions } from '../generated/models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';

export interface NewCotacao {
  new_cotacaoid: string;
  new_name?: string;
  new_nomedofornecedor?: string;
  new_valortotal?: number;
  new_opcaodeentrega?: number;
  new_enderecodeentrega?: string;
  new_observacoes?: string;
  new_datadeaprovacao?: string;
}

export class NewCotacaoService {
  private static readonly dataSourceName = 'new_cotacaos';
  private static readonly client = getClient(dataSourcesInfo);

  public static async create(record: Partial<NewCotacao>): Promise<IOperationResult<NewCotacao>> {
    return await NewCotacaoService.client.createRecordAsync(NewCotacaoService.dataSourceName, record);
  }

  public static async update(id: string, changedFields: Partial<NewCotacao>): Promise<IOperationResult<NewCotacao>> {
    return await NewCotacaoService.client.updateRecordAsync(NewCotacaoService.dataSourceName, id, changedFields);
  }

  public static async get(id: string, options?: IGetOptions): Promise<IOperationResult<NewCotacao>> {
    return await NewCotacaoService.client.retrieveRecordAsync(NewCotacaoService.dataSourceName, id, options);
  }

  public static async getAll(options?: IGetAllOptions): Promise<IOperationResult<NewCotacao[]>> {
    return await NewCotacaoService.client.retrieveMultipleRecordsAsync(NewCotacaoService.dataSourceName, options);
  }
}
