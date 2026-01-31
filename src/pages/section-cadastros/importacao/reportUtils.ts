import { ProductoExistente } from './importacaoTypes';

export interface VariacaoPrecoItem {
  codigo: string;
  descricao: string;
  precoAtual: number;
  precoNovo: number;
  variacaoPercentual: number;
  variacaoValor: number;
}

export function calcularVariacaoPercentual(precoAtual: number, precoNovo: number): number {
  if (!precoAtual || precoAtual <= 0) return 0;
  return ((precoNovo - precoAtual) / precoAtual) * 100;
}

export function calcularTicketMedio(valores: number[]): number {
  if (valores.length === 0) return 0;
  const soma = valores.reduce((acc, value) => acc + value, 0);
  return soma / valores.length;
}

export function calcularEstatisticasPreco(toUpdate: ProductoExistente[]) {
  if (toUpdate.length === 0) {
    return {
      variacaoMedia: 0,
      variacaoMin: 0,
      variacaoMax: 0,
      totalAumentos: 0,
      totalReducoes: 0,
      impactoTotalValor: 0,
    };
  }

  const variacoes = toUpdate.map((item) =>
    calcularVariacaoPercentual(item.precoAtual, item.precoBase)
  );

  const impactoTotalValor = toUpdate.reduce(
    (acc, item) => acc + (item.precoBase - item.precoAtual),
    0
  );

  const totalAumentos = variacoes.filter((v) => v > 0).length;
  const totalReducoes = variacoes.filter((v) => v < 0).length;
  const variacaoMedia = variacoes.reduce((acc, v) => acc + v, 0) / variacoes.length;
  const variacaoMin = Math.min(...variacoes);
  const variacaoMax = Math.max(...variacoes);

  return {
    variacaoMedia,
    variacaoMin,
    variacaoMax,
    totalAumentos,
    totalReducoes,
    impactoTotalValor,
  };
}

export function mapVariacoes(toUpdate: ProductoExistente[]): VariacaoPrecoItem[] {
  return toUpdate.map((item) => {
    const variacaoPercentual = calcularVariacaoPercentual(item.precoAtual, item.precoBase);
    return {
      codigo: item.codigo,
      descricao: item.descricao,
      precoAtual: item.precoAtual,
      precoNovo: item.precoBase,
      variacaoPercentual,
      variacaoValor: item.precoBase - item.precoAtual,
    };
  });
}

export function getTopVariacoes(
  toUpdate: ProductoExistente[],
  tipo: 'aumento' | 'reducao',
  limit: number
) {
  const variacoes = mapVariacoes(toUpdate);
  const filtrado = variacoes.filter((item) =>
    tipo === 'aumento' ? item.variacaoPercentual > 0 : item.variacaoPercentual < 0
  );

  const ordenado = filtrado.sort((a, b) => {
    if (tipo === 'aumento') {
      return b.variacaoPercentual - a.variacaoPercentual;
    }
    return a.variacaoPercentual - b.variacaoPercentual;
  });

  return ordenado.slice(0, limit);
}

export function getAlertasVariacaoExtrema(
  toUpdate: ProductoExistente[],
  threshold: number
) {
  const variacoes = mapVariacoes(toUpdate);
  return variacoes
    .filter((item) => Math.abs(item.variacaoPercentual) >= threshold)
    .sort((a, b) => Math.abs(b.variacaoPercentual) - Math.abs(a.variacaoPercentual));
}
