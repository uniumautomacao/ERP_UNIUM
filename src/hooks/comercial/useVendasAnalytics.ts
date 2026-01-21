import { useState, useEffect, useMemo } from 'react';
import { NewRegistrodevendaService } from '../../generated';
import type { NewRegistrodevenda } from '../../generated/models/NewRegistrodevendaModel';
import { ChartDataPoint } from '../../types';

interface DonutChartData {
  name: string;
  value: number;
}

interface TopProduto {
  descricao: string;
  modelo: string;
  fabricante: string;
  quantidadeVendida: number;
  valorTotal: number;
}

interface TopCliente {
  nome: string;
  qtdCompras: number;
  valorTotal: number;
  lucro: number;
}

interface UseVendasAnalyticsOptions {
  dataInicio?: Date;
  dataFim?: Date;
  categoria?: string;
  fabricante?: string;
  vendedor?: string;
  arquiteto?: string;
  busca?: string;
}

interface VendasAnalyticsData {
  kpis: {
    faturamentoTotal: number;
    lucroBrutoTotal: number;
    margemMedia: number;
    ticketMedio: number;
    totalVendas: number;
  };
  evolucaoVendas: ChartDataPoint[];
  vendasPorCategoria: DonutChartData[];
  topFabricantes: ChartDataPoint[];
  topVendedores: ChartDataPoint[];
  topArquitetos: ChartDataPoint[];
  produtoVsServico: DonutChartData[];
  margemPorCategoria: ChartDataPoint[];
  topProdutos: TopProduto[];
  topClientes: TopCliente[];
}

export function useVendasAnalytics(options: UseVendasAnalyticsOptions = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendas, setVendas] = useState<NewRegistrodevenda[]>([]);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construir filtro OData
        const filters: string[] = ['statecode eq 0'];

        if (options.dataInicio) {
          const dataInicioISO = options.dataInicio.toISOString();
          filters.push(`new_datadavenda ge '${dataInicioISO}'`);
        }

        if (options.dataFim) {
          const dataFimISO = options.dataFim.toISOString();
          filters.push(`new_datadavenda le '${dataFimISO}'`);
        }

        // Função para escapar strings OData
        const escapeODataString = (value: string) => value.replace(/'/g, "''");

        if (options.categoria) {
          filters.push(`new_categoriadoproduto eq '${escapeODataString(options.categoria)}'`);
        }

        if (options.fabricante) {
          filters.push(`new_nomedofabricante eq '${escapeODataString(options.fabricante)}'`);
        }

        if (options.vendedor) {
          filters.push(`new_nomedovendedor eq '${escapeODataString(options.vendedor)}'`);
        }

        if (options.arquiteto) {
          filters.push(`new_nomedoarquiteto eq '${escapeODataString(options.arquiteto)}'`);
        }

        if (options.busca && options.busca.trim()) {
          const searchTerm = options.busca.trim();
          // Busca delegável em múltiplos campos usando contains
          const searchFilters = [
            `contains(new_nomedocliente, '${searchTerm}')`,
            `contains(new_descricaodoproduto, '${searchTerm}')`,
            `contains(new_categoriadoproduto, '${searchTerm}')`,
            `contains(new_nomedofabricante, '${searchTerm}')`,
            `contains(new_referenciadoprodutomodelo, '${searchTerm}')`,
            `contains(new_nomedovendedor, '${searchTerm}')`,
            `contains(new_nomedoarquiteto, '${searchTerm}')`,
            `contains(new_id, '${searchTerm}')`,
          ];
          filters.push(`(${searchFilters.join(' or ')})`);
        }

        const filterString = filters.join(' and ');

        console.log('[useVendasAnalytics] Filtro OData:', filterString);

        const result = await NewRegistrodevendaService.getAll({
          filter: filterString,
          select: [
            'new_registrodevendaid',
            'new_datadavenda',
            'new_categoriadoproduto',
            'new_nomedofabricante',
            'new_nomedovendedor',
            'new_nomedoarquiteto',
            'new_nomedocliente',
            'new_descricaodoproduto',
            'new_referenciadoprodutomodelo',
            'new_quantidade',
            'new_valortotal',
            'new_valordeprodutototal',
            'new_valordeservicototal',
            'new_lucrobrutototal',
            'new_custodecompratotal'
          ],
          orderBy: ['new_datadavenda desc']
        });

        console.log('[useVendasAnalytics] Resultado da query:', result);

        const vendas = result.data ?? [];
        console.log('[useVendasAnalytics] Vendas carregadas:', vendas.length, 'registros');
        setVendas(vendas);
      } catch (err) {
        console.error('[useVendasAnalytics] Exceção ao buscar vendas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados de vendas');
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, [options.dataInicio, options.dataFim, options.categoria, options.fabricante, options.vendedor, options.arquiteto, options.busca]);

  const analyticsData: VendasAnalyticsData = useMemo(() => {
    if (vendas.length === 0) {
      return {
        kpis: {
          faturamentoTotal: 0,
          lucroBrutoTotal: 0,
          margemMedia: 0,
          ticketMedio: 0,
          totalVendas: 0
        },
        evolucaoVendas: [],
        vendasPorCategoria: [],
        topFabricantes: [],
        topVendedores: [],
        topArquitetos: [],
        produtoVsServico: [],
        margemPorCategoria: [],
        topProdutos: [],
        topClientes: []
      };
    }

    // Calcular KPIs
    const faturamentoTotal = vendas.reduce((sum, v) => sum + (v.new_valortotal || 0), 0);
    const lucroBrutoTotal = vendas.reduce((sum, v) => sum + (v.new_lucrobrutototal || 0), 0);
    const margemMedia = faturamentoTotal > 0 ? (lucroBrutoTotal / faturamentoTotal) * 100 : 0;
    const ticketMedio = vendas.length > 0 ? faturamentoTotal / vendas.length : 0;
    const totalVendas = vendas.length;

    // Evolução de vendas por mês
    const vendasPorMes = new Map<string, { valor: number; lucro: number }>();
    vendas.forEach(v => {
      if (v.new_datadavenda) {
        const data = new Date(v.new_datadavenda);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        const current = vendasPorMes.get(mesAno) || { valor: 0, lucro: 0 };
        vendasPorMes.set(mesAno, {
          valor: current.valor + (v.new_valortotal || 0),
          lucro: current.lucro + (v.new_lucrobrutototal || 0)
        });
      }
    });

    const evolucaoVendas: ChartDataPoint[] = Array.from(vendasPorMes.entries())
      .sort((a, b) => {
        const [mesA, anoA] = a[0].split('/').map(Number);
        const [mesB, anoB] = b[0].split('/').map(Number);
        return anoA !== anoB ? anoA - anoB : mesA - mesB;
      })
      .map(([mesAno, dados]) => ({
        date: mesAno,
        value: dados.valor,
        lucro: dados.lucro
      }));

    // Vendas por categoria
    const vendasPorCategoriaMap = new Map<string, number>();
    vendas.forEach(v => {
      const categoria = v.new_categoriadoproduto || 'Sem categoria';
      vendasPorCategoriaMap.set(categoria, (vendasPorCategoriaMap.get(categoria) || 0) + (v.new_valortotal || 0));
    });

    const vendasPorCategoria: DonutChartData[] = Array.from(vendasPorCategoriaMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top 10 Fabricantes
    const fabricantesMap = new Map<string, number>();
    vendas.forEach(v => {
      const fabricante = v.new_nomedofabricante || 'Sem fabricante';
      fabricantesMap.set(fabricante, (fabricantesMap.get(fabricante) || 0) + (v.new_valortotal || 0));
    });

    const topFabricantes: ChartDataPoint[] = Array.from(fabricantesMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Top Vendedores
    const vendedoresMap = new Map<string, number>();
    vendas.forEach(v => {
      const vendedor = v.new_nomedovendedor || 'Sem vendedor';
      vendedoresMap.set(vendedor, (vendedoresMap.get(vendedor) || 0) + (v.new_valortotal || 0));
    });

    const topVendedores: ChartDataPoint[] = Array.from(vendedoresMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Top Arquitetos
    const arquitetosMap = new Map<string, number>();
    vendas.forEach(v => {
      if (v.new_nomedoarquiteto) {
        arquitetosMap.set(v.new_nomedoarquiteto, (arquitetosMap.get(v.new_nomedoarquiteto) || 0) + (v.new_valortotal || 0));
      }
    });

    const topArquitetos: ChartDataPoint[] = Array.from(arquitetosMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Produto vs Serviço
    const totalProduto = vendas.reduce((sum, v) => sum + (v.new_valordeprodutototal || 0), 0);
    const totalServico = vendas.reduce((sum, v) => sum + (v.new_valordeservicototal || 0), 0);

    const produtoVsServico: DonutChartData[] = [
      { name: 'Produtos', value: totalProduto },
      { name: 'Serviços', value: totalServico }
    ].filter(item => item.value > 0);

    // Margem por Categoria
    const margemPorCategoriaMap = new Map<string, { valor: number; lucro: number }>();
    vendas.forEach(v => {
      const categoria = v.new_categoriadoproduto || 'Sem categoria';
      const current = margemPorCategoriaMap.get(categoria) || { valor: 0, lucro: 0 };
      margemPorCategoriaMap.set(categoria, {
        valor: current.valor + (v.new_valortotal || 0),
        lucro: current.lucro + (v.new_lucrobrutototal || 0)
      });
    });

    const margemPorCategoria: ChartDataPoint[] = Array.from(margemPorCategoriaMap.entries())
      .map(([date, dados]) => ({
        date,
        value: dados.valor > 0 ? (dados.lucro / dados.valor) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Top 10 Produtos
    const produtosMap = new Map<string, { quantidade: number; valor: number; modelo: string; fabricante: string }>();
    vendas.forEach(v => {
      const descricao = v.new_descricaodoproduto || 'Sem descrição';
      const current = produtosMap.get(descricao) || {
        quantidade: 0,
        valor: 0,
        modelo: v.new_referenciadoprodutomodelo || '',
        fabricante: v.new_nomedofabricante || ''
      };
      produtosMap.set(descricao, {
        quantidade: current.quantidade + (v.new_quantidade || 0),
        valor: current.valor + (v.new_valortotal || 0),
        modelo: current.modelo || v.new_referenciadoprodutomodelo || '',
        fabricante: current.fabricante || v.new_nomedofabricante || ''
      });
    });

    const topProdutos: TopProduto[] = Array.from(produtosMap.entries())
      .map(([descricao, dados]) => ({
        descricao,
        modelo: dados.modelo,
        fabricante: dados.fabricante,
        quantidadeVendida: dados.quantidade,
        valorTotal: dados.valor
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 10);

    // Top 10 Clientes
    const clientesMap = new Map<string, { qtd: number; valor: number; lucro: number }>();
    vendas.forEach(v => {
      const cliente = v.new_nomedocliente || 'Sem cliente';
      const current = clientesMap.get(cliente) || { qtd: 0, valor: 0, lucro: 0 };
      clientesMap.set(cliente, {
        qtd: current.qtd + 1,
        valor: current.valor + (v.new_valortotal || 0),
        lucro: current.lucro + (v.new_lucrobrutototal || 0)
      });
    });

    const topClientes: TopCliente[] = Array.from(clientesMap.entries())
      .map(([nome, dados]) => ({
        nome,
        qtdCompras: dados.qtd,
        valorTotal: dados.valor,
        lucro: dados.lucro
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 10);

    return {
      kpis: {
        faturamentoTotal,
        lucroBrutoTotal,
        margemMedia,
        ticketMedio,
        totalVendas
      },
      evolucaoVendas,
      vendasPorCategoria,
      topFabricantes,
      topVendedores,
      topArquitetos,
      produtoVsServico,
      margemPorCategoria,
      topProdutos,
      topClientes
    };
  }, [vendas]);

  return {
    loading,
    error,
    data: analyticsData,
    vendas // Retornar vendas para uso em tabelas detalhadas
  };
}
