import { useState, useEffect, useMemo } from 'react';
import { NewRegistrodevendaService } from '../../generated';
import type { NewRegistrodevenda } from '../../generated/models/NewRegistrodevendaModel';

export interface ABCItem {
  descricao: string;
  modelo: string;
  fabricante: string;
  quantidade: number;
  valor: number;           // faturamento ou lucro
  percentual: number;      // % do total
  percentualAcumulado: number;
  classificacao: 'A' | 'B' | 'C';
}

interface UseAnaliseABCOptions {
  dataInicio?: Date;
  dataFim?: Date;
  tipo: 'faturamento' | 'lucro';
}

interface AnaliseABCData {
  items: ABCItem[];
  totais: {
    valorTotal: number;
    qtdA: number;
    qtdB: number;
    qtdC: number;
    valorA: number;
    valorB: number;
    valorC: number;
  };
}

export function useAnaliseABC(options: UseAnaliseABCOptions) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendas, setVendas] = useState<NewRegistrodevenda[]>([]);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construir filtro OData delegável
        const filters: string[] = ['statecode eq 0'];

        if (options.dataInicio) {
          const dataInicioISO = options.dataInicio.toISOString();
          filters.push(`new_datadavenda ge '${dataInicioISO}'`);
        }

        if (options.dataFim) {
          const dataFimISO = options.dataFim.toISOString();
          filters.push(`new_datadavenda le '${dataFimISO}'`);
        }

        const filterString = filters.join(' and ');

        console.log('[useAnaliseABC] Filtro OData:', filterString);

        // Query delegável ao Dataverse
        const result = await NewRegistrodevendaService.getAll({
          filter: filterString,
          select: [
            'new_descricaodoproduto',
            'new_referenciadoprodutomodelo',
            'new_nomedofabricante',
            'new_quantidade',
            'new_valortotal',
            'new_lucrobrutototal'
          ],
          orderBy: options.tipo === 'faturamento' 
            ? ['new_valortotal desc'] 
            : ['new_lucrobrutototal desc']
        });

        console.log('[useAnaliseABC] Resultado da query:', result);

        const vendas = result.data ?? [];
        console.log('[useAnaliseABC] Vendas carregadas:', vendas.length, 'registros');
        setVendas(vendas);
      } catch (err) {
        console.error('[useAnaliseABC] Exceção ao buscar vendas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados de vendas');
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, [options.dataInicio, options.dataFim, options.tipo]);

  const analiseABC: AnaliseABCData = useMemo(() => {
    if (vendas.length === 0) {
      return {
        items: [],
        totais: {
          valorTotal: 0,
          qtdA: 0,
          qtdB: 0,
          qtdC: 0,
          valorA: 0,
          valorB: 0,
          valorC: 0
        }
      };
    }

    // 1. Agrupar por modelo do produto (referência)
    const produtosMap = new Map<string, {
      descricao: string;
      modelo: string;
      fabricante: string;
      quantidade: number;
      valor: number;
    }>();

    vendas.forEach(v => {
      const modelo = v.new_referenciadoprodutomodelo || 'Sem referência';
      const descricao = v.new_descricaodoproduto || 'Sem descrição';
      const valor = options.tipo === 'faturamento' 
        ? (v.new_valortotal || 0) 
        : (v.new_lucrobrutototal || 0);
      
      const current = produtosMap.get(modelo) || {
        descricao,
        modelo,
        fabricante: v.new_nomedofabricante || '',
        quantidade: 0,
        valor: 0
      };

      produtosMap.set(modelo, {
        descricao: current.descricao || descricao,
        modelo: current.modelo || modelo,
        fabricante: current.fabricante || v.new_nomedofabricante || '',
        quantidade: current.quantidade + (v.new_quantidade || 0),
        valor: current.valor + valor
      });
    });

    // 2. Converter para array e ordenar por valor desc
    const produtosOrdenados = Array.from(produtosMap.entries())
      .map(([modelo, dados]) => ({
        ...dados,
        modelo: dados.modelo ?? modelo
      }))
      .sort((a, b) => b.valor - a.valor);

    // 3. Calcular total
    const valorTotal = produtosOrdenados.reduce((sum, p) => sum + p.valor, 0);

    // 4. Calcular percentuais e classificar
    let acumulado = 0;
    const items: ABCItem[] = produtosOrdenados.map(p => {
      const percentual = valorTotal > 0 ? (p.valor / valorTotal) * 100 : 0;
      acumulado += percentual;
      
      const classificacao: 'A' | 'B' | 'C' = 
        acumulado <= 80 ? 'A' : 
        acumulado <= 95 ? 'B' : 
        'C';

      return {
        descricao: p.descricao,
        modelo: p.modelo,
        fabricante: p.fabricante,
        quantidade: p.quantidade,
        valor: p.valor,
        percentual,
        percentualAcumulado: acumulado,
        classificacao
      };
    });

    // 5. Calcular totais por categoria
    const totais = items.reduce((acc, item) => {
      if (item.classificacao === 'A') {
        acc.qtdA++;
        acc.valorA += item.valor;
      } else if (item.classificacao === 'B') {
        acc.qtdB++;
        acc.valorB += item.valor;
      } else {
        acc.qtdC++;
        acc.valorC += item.valor;
      }
      return acc;
    }, {
      valorTotal,
      qtdA: 0,
      qtdB: 0,
      qtdC: 0,
      valorA: 0,
      valorB: 0,
      valorC: 0
    });

    return {
      items,
      totais
    };
  }, [vendas, options.tipo]);

  return {
    loading,
    error,
    data: analiseABC
  };
}
