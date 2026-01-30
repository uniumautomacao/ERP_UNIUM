/*!
 * Service para a tabela new_creditosdocliente e new_utilizacaodecredito
 * Gerencia créditos do cliente e suas utilizações em orçamentos
 */
import type { IGetAllOptions } from '../../generated/models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';
import type { CreditoCliente, UtilizacaoCredito } from '../../features/orcamentos/types';

export class CreditoService {
  private static readonly creditosDataSourceName = 'new_creditosdoclientes';
  private static readonly utilizacoesDataSourceName = 'new_utilizacaodecreditos';
  private static readonly client = getClient(dataSourcesInfo);

  /**
   * Buscar créditos disponíveis do cliente
   * Filtra apenas créditos ativos com valor disponível > 0
   */
  public static async fetchCreditosByCliente(clienteId: string): Promise<CreditoCliente[]> {
    const filter = `_new_cliente_value eq '${clienteId}' and statecode eq 0 and new_valordisponivel gt 0`;

    const options: IGetAllOptions = {
      filter,
      orderBy: ['new_dataexpiracao'],
      select: [
        'new_creditosdoclienteid',
        'new_name',
        'new_valordisponivel',
        'new_valororiginal',
        'new_valorutilizado',
        'new_dataexpiracao',
        'new_observacoes',
      ],
    };

    const result = await CreditoService.client.retrieveMultipleRecordsAsync(
      CreditoService.creditosDataSourceName,
      options
    );

    // A API pode retornar 'success' ou 'isSuccess' dependendo do método
    const success = result.isSuccess ?? (result as any).success;
    const value = result.value ?? (result as any).data;

    if (success && value) {
      return value as CreditoCliente[];
    }

    return [];
  }

  /**
   * Buscar todas utilizações de crédito no orçamento
   */
  public static async fetchUtilizacoesByOrcamento(
    orcamentoId: string
  ): Promise<UtilizacaoCredito[]> {
    const filter = `_new_orcamento_value eq '${orcamentoId}' and statecode eq 0`;

    const options: IGetAllOptions = {
      filter,
      expand: [
        {
          navigationProperty: 'new_creditosdocliente',
          select: ['new_creditosdoclienteid', 'new_name', 'new_valororiginal'],
        },
      ],
    };

    const result = await CreditoService.client.retrieveMultipleRecordsAsync(
      CreditoService.utilizacoesDataSourceName,
      options
    );

    // A API pode retornar 'success' ou 'isSuccess' dependendo do método
    const success = result.isSuccess ?? (result as any).success;
    const value = result.value ?? (result as any).data;

    if (success && value) {
      return value as UtilizacaoCredito[];
    }

    return [];
  }

  /**
   * Aplicar crédito ao orçamento
   * Cria uma utilização de crédito e atualiza o valor disponível
   */
  public static async aplicarCredito(
    orcamentoId: string,
    creditoId: string,
    valor: number
  ): Promise<string> {
    // Buscar crédito para validar valor disponível
    const creditoResult = await CreditoService.client.retrieveRecordAsync(
      CreditoService.creditosDataSourceName,
      creditoId
    );

    if (!creditoResult.isSuccess || !creditoResult.value) {
      throw new Error('Crédito não encontrado');
    }

    const credito = creditoResult.value as CreditoCliente;
    const valorDisponivel = credito.new_valordisponivel || 0;

    if (valor > valorDisponivel) {
      throw new Error('Valor maior que o disponível no crédito');
    }

    // Criar utilização
    const utilizacao: Partial<UtilizacaoCredito> = {
      new_valor: valor,
      new_datautilizacao: new Date().toISOString(),
      new_confirmado: false,
      statecode: 0,
      statuscode: 1,
    };

    const record: any = { ...utilizacao };
    record['new_orcamento@odata.bind'] = `/new_orcamentos(${orcamentoId})`;
    record['new_creditosdocliente@odata.bind'] = `/new_creditosdoclientes(${creditoId})`;

    const utilizacaoResult = await CreditoService.client.createRecordAsync(
      CreditoService.utilizacoesDataSourceName,
      record
    );

    if (!utilizacaoResult.isSuccess || !utilizacaoResult.value) {
      throw new Error('Falha ao criar utilização de crédito');
    }

    // Atualizar valor disponível do crédito
    const novoValorDisponivel = valorDisponivel - valor;
    const novoValorUtilizado = (credito.new_valorutilizado || 0) + valor;

    await CreditoService.client.updateRecordAsync(
      CreditoService.creditosDataSourceName,
      creditoId,
      {
        new_valordisponivel: novoValorDisponivel,
        new_valorutilizado: novoValorUtilizado,
      }
    );

    return utilizacaoResult.value.new_utilizacaodecreditoid;
  }

  /**
   * Remover utilização de crédito
   * Remove a utilização e restitui o valor ao crédito
   */
  public static async removerUtilizacao(utilizacaoId: string): Promise<void> {
    // Buscar utilização para obter valor e crédito
    const utilizacaoResult = await CreditoService.client.retrieveRecordAsync(
      CreditoService.utilizacoesDataSourceName,
      utilizacaoId,
      {
        select: ['new_valor', '_new_creditosdocliente_value'],
      }
    );

    if (!utilizacaoResult.isSuccess || !utilizacaoResult.value) {
      throw new Error('Utilização não encontrada');
    }

    const utilizacao = utilizacaoResult.value as UtilizacaoCredito;
    const valor = utilizacao.new_valor || 0;
    const creditoId = utilizacao.new_creditosdocliente;

    if (!creditoId) {
      throw new Error('Crédito não encontrado na utilização');
    }

    // Buscar crédito
    const creditoResult = await CreditoService.client.retrieveRecordAsync(
      CreditoService.creditosDataSourceName,
      creditoId
    );

    if (!creditoResult.isSuccess || !creditoResult.value) {
      throw new Error('Crédito não encontrado');
    }

    const credito = creditoResult.value as CreditoCliente;

    // Desativar utilização
    await CreditoService.client.updateRecordAsync(
      CreditoService.utilizacoesDataSourceName,
      utilizacaoId,
      {
        statecode: 1, // Inactive
      }
    );

    // Restitui valor ao crédito
    const novoValorDisponivel = (credito.new_valordisponivel || 0) + valor;
    const novoValorUtilizado = (credito.new_valorutilizado || 0) - valor;

    await CreditoService.client.updateRecordAsync(
      CreditoService.creditosDataSourceName,
      creditoId,
      {
        new_valordisponivel: novoValorDisponivel,
        new_valorutilizado: novoValorUtilizado,
      }
    );
  }

  /**
   * Confirmar utilização de crédito
   */
  public static async confirmarUtilizacao(utilizacaoId: string): Promise<void> {
    await CreditoService.client.updateRecordAsync(
      CreditoService.utilizacoesDataSourceName,
      utilizacaoId,
      {
        new_confirmado: true,
      }
    );
  }

  /**
   * Calcular total de créditos disponíveis do cliente
   */
  public static async calcularCreditoDisponivel(clienteId: string): Promise<number> {
    const creditos = await CreditoService.fetchCreditosByCliente(clienteId);
    return creditos.reduce((total, credito) => total + (credito.new_valordisponivel || 0), 0);
  }

  /**
   * Calcular total de créditos utilizados no orçamento
   */
  public static async calcularCreditoUtilizado(orcamentoId: string): Promise<number> {
    const utilizacoes = await CreditoService.fetchUtilizacoesByOrcamento(orcamentoId);
    return utilizacoes.reduce((total, utilizacao) => total + (utilizacao.new_valor || 0), 0);
  }
}
