/*!
 * Service para buscar tipos de serviço associados a produtos
 * Gerencia o relacionamento PreçodeProduto ↔ TipoServiço-PreçodeProdutos
 */
import { NewTiposervicoprecodeprodutoService, NewPrecodeProdutoService } from '../../generated';

export interface TipoServicoPreco {
  descricaoDoServico: string;
  taxaPercentual: number;
  taxaFixa: number;
  remocaoPermitida: boolean;
  tipoDeServicoId: string;
  precodeProdutoId: string;
}

export class ServicoService {
  /**
   * Busca os preços de produto por referência
   * @param referencias - Array de referências de produtos (new_ref)
   * @returns Map de referência → precodeprodutoid
   */
  static async fetchPrecosPorReferencias(
    referencias: string[]
  ): Promise<Map<string, string>> {
    if (referencias.length === 0) return new Map();

    console.log('[ServicoService.fetchPrecosPorReferencias] Buscando preços para referências:', referencias);

    // Construir filtro OData
    const filter = referencias
      .map(ref => `new_referenciadoproduto eq '${ref}'`)
      .join(' or ');

    console.log('[ServicoService.fetchPrecosPorReferencias] Filtro OData:', `statecode eq 0 and (${filter})`);

    const result = await NewPrecodeProdutoService.getAll({
      filter: `statecode eq 0 and (${filter})`,
      select: ['new_precodeprodutoid', 'new_referenciadoproduto']
    });

    console.log('[ServicoService.fetchPrecosPorReferencias] Resultado completo:', result);
    console.log('[ServicoService.fetchPrecosPorReferencias] Resultado:', {
      success: result.success,
      isSuccess: (result as any).isSuccess,
      valueLength: result.value?.length || 0,
      dataLength: (result as any).data?.length || 0,
      value: result.value,
      data: (result as any).data,
    });

    // A API pode retornar 'value' ou 'data' dependendo do método
    const valores = result.value ?? (result as any).data;

    // Criar mapa de referência para ID
    const map = new Map<string, string>();
    valores?.forEach((preco: any) => {
      if (preco.new_referenciadoproduto && preco.new_precodeprodutoid) {
        map.set(preco.new_referenciadoproduto, preco.new_precodeprodutoid);
      }
    });

    console.log('[ServicoService.fetchPrecosPorReferencias] Map criado:', {
      size: map.size,
      entries: Array.from(map.entries()),
    });

    return map;
  }

  /**
   * Busca os tipos de serviço por IDs de preço de produto
   * @param precoProdutoIds - Array de IDs de preço de produto
   * @returns Map de precodeprodutoid → array de tipos de serviço
   */
  static async fetchTiposServicoPorPrecos(
    precoProdutoIds: string[]
  ): Promise<Map<string, TipoServicoPreco[]>> {
    if (precoProdutoIds.length === 0) return new Map();

    console.log('[ServicoService.fetchTiposServicoPorPrecos] Buscando tipos de serviço para preços:', precoProdutoIds);

    // Construir filtro OData
    const filter = precoProdutoIds
      .map(id => `_new_precodeproduto_value eq '${id}'`)
      .join(' or ');

    console.log('[ServicoService.fetchTiposServicoPorPrecos] Filtro OData:', `statecode eq 0 and (${filter})`);

    const result = await NewTiposervicoprecodeprodutoService.getAll({
      filter: `statecode eq 0 and (${filter})`,
      select: [
        'new_descricaodoservico',
        'new_taxapercentualemcimadoservicofx',
        'new_taxafixafx',
        'new_remocaopermitida',
        '_new_tipodeservico_value',
        '_new_precodeproduto_value'
      ]
    });

    console.log('[ServicoService.fetchTiposServicoPorPrecos] Resultado completo:', result);
    console.log('[ServicoService.fetchTiposServicoPorPrecos] Resultado:', {
      success: result.success,
      isSuccess: (result as any).isSuccess,
      valueLength: result.value?.length || 0,
      dataLength: (result as any).data?.length || 0,
      value: result.value,
      data: (result as any).data,
    });

    // A API pode retornar 'value' ou 'data' dependendo do método
    const valores = result.value ?? (result as any).data;

    // Agrupar por precodeproduto
    const map = new Map<string, TipoServicoPreco[]>();
    valores?.forEach((item: any) => {
      const precoId = item._new_precodeproduto_value;
      if (!precoId) return;

      if (!map.has(precoId)) {
        map.set(precoId, []);
      }

      map.get(precoId)!.push({
        descricaoDoServico: item.new_descricaodoservico || 'Serviço',
        taxaPercentual: item.new_taxapercentualemcimadoservicofx || 0,
        taxaFixa: item.new_taxafixafx || 0,
        remocaoPermitida: item.new_remocaopermitida || false,
        tipoDeServicoId: item._new_tipodeservico_value || '',
        precodeProdutoId: precoId
      });
    });

    console.log('[ServicoService.fetchTiposServicoPorPrecos] Map criado:', {
      size: map.size,
      entries: Array.from(map.entries()),
    });

    return map;
  }
}
