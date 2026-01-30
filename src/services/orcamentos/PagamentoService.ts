/*!
 * Service para as tabelas new_opcaodepagamento e new_parcelaopcaodepagamento
 * Gerencia opções de pagamento e parcelas de orçamentos
 */
import type { IGetAllOptions } from '../../generated/models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';
import type { OpcaoPagamento, ParcelaPagamento } from '../../features/orcamentos/types';

export class PagamentoService {
  private static readonly opcoesDataSourceName = 'new_opcaodepagamentos';
  private static readonly parcelasDataSourceName = 'new_parcelaopcaodepagamentos';
  private static readonly client = getClient(dataSourcesInfo);

  /**
   * Buscar opções de pagamento do orçamento
   */
  public static async fetchOpcoesByOrcamento(orcamentoId: string): Promise<OpcaoPagamento[]> {
    const filter = `_new_orcamento_value eq '${orcamentoId}' and statecode eq 0`;

    const options: IGetAllOptions = {
      filter,
      orderBy: 'createdon',
    };

    const result = await PagamentoService.client.retrieveMultipleRecordsAsync(
      PagamentoService.opcoesDataSourceName,
      options
    );

    if (result.isSuccess && result.value) {
      return result.value as OpcaoPagamento[];
    }

    return [];
  }

  /**
   * Buscar parcelas de uma opção de pagamento
   */
  public static async fetchParcelasByOpcao(opcaoId: string): Promise<ParcelaPagamento[]> {
    const filter = `_new_opcaodepagamento_value eq '${opcaoId}' and statecode eq 0`;

    const options: IGetAllOptions = {
      filter,
      orderBy: 'new_numero',
    };

    const result = await PagamentoService.client.retrieveMultipleRecordsAsync(
      PagamentoService.parcelasDataSourceName,
      options
    );

    if (result.isSuccess && result.value) {
      return result.value as ParcelaPagamento[];
    }

    return [];
  }

  /**
   * Criar opção de pagamento
   */
  public static async createOpcao(opcao: Partial<OpcaoPagamento>): Promise<string> {
    const recordData: Partial<OpcaoPagamento> = {
      ...opcao,
      statecode: 0,
      statuscode: 1,
      new_confirmado: false,
    };

    const record: any = { ...recordData };
    if (opcao.new_orcamento) {
      record['new_orcamento@odata.bind'] = `/new_orcamentos(${opcao.new_orcamento})`;
      delete record.new_orcamento;
    }

    const result = await PagamentoService.client.createRecordAsync(
      PagamentoService.opcoesDataSourceName,
      record
    );

    if (result.isSuccess && result.value) {
      return result.value.new_opcaodepagamentoid;
    }

    throw new Error('Falha ao criar opção de pagamento');
  }

  /**
   * Atualizar opção de pagamento
   */
  public static async updateOpcao(
    opcaoId: string,
    data: Partial<OpcaoPagamento>
  ): Promise<void> {
    const result = await PagamentoService.client.updateRecordAsync(
      PagamentoService.opcoesDataSourceName,
      opcaoId,
      data
    );

    if (!result.isSuccess) {
      throw new Error('Falha ao atualizar opção de pagamento');
    }
  }

  /**
   * Deletar opção e suas parcelas
   */
  public static async deleteOpcao(opcaoId: string): Promise<void> {
    // Buscar e desativar todas as parcelas
    const parcelas = await PagamentoService.fetchParcelasByOpcao(opcaoId);

    for (const parcela of parcelas) {
      await PagamentoService.client.updateRecordAsync(
        PagamentoService.parcelasDataSourceName,
        parcela.new_parcelaopcaodepagamentoid,
        { statecode: 1 }
      );
    }

    // Desativar opção
    await PagamentoService.updateOpcao(opcaoId, { statecode: 1 });
  }

  /**
   * Criar parcela
   */
  public static async createParcela(parcela: Partial<ParcelaPagamento>): Promise<string> {
    const recordData: Partial<ParcelaPagamento> = {
      ...parcela,
      statecode: 0,
      statuscode: 1,
    };

    const record: any = { ...recordData };
    if (parcela.new_opcaodepagamento) {
      record['new_opcaodepagamento@odata.bind'] = `/new_opcaodepagamentos(${parcela.new_opcaodepagamento})`;
      delete record.new_opcaodepagamento;
    }

    const result = await PagamentoService.client.createRecordAsync(
      PagamentoService.parcelasDataSourceName,
      record
    );

    if (result.isSuccess && result.value) {
      return result.value.new_parcelaopcaodepagamentoid;
    }

    throw new Error('Falha ao criar parcela');
  }

  /**
   * Atualizar parcela
   */
  public static async updateParcela(
    parcelaId: string,
    data: Partial<ParcelaPagamento>
  ): Promise<void> {
    const result = await PagamentoService.client.updateRecordAsync(
      PagamentoService.parcelasDataSourceName,
      parcelaId,
      data
    );

    if (!result.isSuccess) {
      throw new Error('Falha ao atualizar parcela');
    }
  }

  /**
   * Deletar parcela
   */
  public static async deleteParcela(parcelaId: string): Promise<void> {
    await PagamentoService.client.updateRecordAsync(
      PagamentoService.parcelasDataSourceName,
      parcelaId,
      { statecode: 1 }
    );
  }

  /**
   * Criar opção de pagamento com parcelas
   */
  public static async createOpcaoComParcelas(
    opcao: Partial<OpcaoPagamento>,
    parcelas: Partial<ParcelaPagamento>[]
  ): Promise<string> {
    // Criar opção
    const opcaoId = await PagamentoService.createOpcao(opcao);

    // Criar parcelas
    for (const parcela of parcelas) {
      await PagamentoService.createParcela({
        ...parcela,
        new_opcaodepagamento: opcaoId,
      });
    }

    return opcaoId;
  }

  /**
   * Gerar parcelas automáticas
   * Divide o valor total em N parcelas iguais
   */
  public static async gerarParcelas(
    opcaoId: string,
    valorTotal: number,
    numeroParcelas: number,
    dataInicial: Date
  ): Promise<void> {
    const valorParcela = valorTotal / numeroParcelas;

    for (let i = 0; i < numeroParcelas; i++) {
      const dataVencimento = new Date(dataInicial);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);

      await PagamentoService.createParcela({
        new_opcaodepagamento: opcaoId,
        new_numero: i + 1,
        new_valor: valorParcela,
        new_datavencimento: dataVencimento.toISOString(),
        new_descricao: `Parcela ${i + 1}/${numeroParcelas}`,
      });
    }
  }

  /**
   * Confirmar opção de pagamento
   */
  public static async confirmarOpcao(opcaoId: string): Promise<void> {
    await PagamentoService.updateOpcao(opcaoId, {
      new_confirmado: true,
    });
  }

  /**
   * Recalcular total da opção com base nas parcelas
   */
  public static async recalcularTotalOpcao(opcaoId: string): Promise<void> {
    const parcelas = await PagamentoService.fetchParcelasByOpcao(opcaoId);
    const total = parcelas.reduce((sum, p) => sum + (p.new_valor || 0), 0);

    await PagamentoService.updateOpcao(opcaoId, {
      new_valortotal: total,
      new_numerodeparcelas: parcelas.length,
    });
  }
}
