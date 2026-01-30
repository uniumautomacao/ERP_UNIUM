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

    // Construir filtro OData
    const filter = referencias
      .map(ref => `new_referenciadoproduto eq '${ref}'`)
      .join(' or ');

    const result = await NewPrecodeProdutoService.getAll({
      filter: `statecode eq 0 and (${filter})`,
      select: ['new_precodeprodutoid', 'new_referenciadoproduto']
    });

    // A API pode retornar 'value' ou 'data' dependendo do método
    const valores = (result as any).value ?? result.data;

    // Criar mapa de referência para ID
    const map = new Map<string, string>();
    valores?.forEach((preco: any) => {
      if (preco.new_referenciadoproduto && preco.new_precodeprodutoid) {
        map.set(preco.new_referenciadoproduto, preco.new_precodeprodutoid);
      }
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

    // Construir filtro OData
    const filter = precoProdutoIds
      .map(id => `_new_precodeproduto_value eq '${id}'`)
      .join(' or ');

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

    // A API pode retornar 'value' ou 'data' dependendo do método
    const valores = (result as any).value ?? result.data;

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

    return map;
  }
}
