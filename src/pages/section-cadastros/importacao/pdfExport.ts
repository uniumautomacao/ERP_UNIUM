import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ComparisonResults, ReportInsights } from './importacaoTypes';
import { getAlertasVariacaoExtrema, getTopVariacoes } from './reportUtils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const formatPercentSigned = (value: number) => `${value >= 0 ? '+' : ''}${formatPercent(value)}`;

const getNextY = (doc: jsPDF, fallback: number) =>
  ((doc as any).lastAutoTable?.finalY as number | undefined) ?? fallback;

export async function exportarRelatorioPDF(
  comparisonResults: ComparisonResults,
  fabricanteLabel: string,
  insights: ReportInsights
): Promise<void> {
  const doc = new jsPDF();
  let cursorY = 16;

  doc.setFontSize(16);
  doc.text('Relatório de Importação - Tabela de Preços', 14, cursorY);
  cursorY += 8;

  doc.setFontSize(11);
  doc.text(`Fabricante: ${fabricanteLabel || 'N/A'}`, 14, cursorY);
  cursorY += 6;
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, cursorY);
  cursorY += 6;

  const updates = comparisonResults.toUpdate.filter((item) => item.action === 'update');
  const creates = comparisonResults.toCreate.filter((item) => item.action === 'create');
  const deactivates = comparisonResults.toDeactivate.filter((item) => item.action === 'deactivate');

  autoTable(doc, {
    startY: cursorY + 4,
    head: [['Resumo Executivo', 'Valor']],
    body: [
      ['Novos', String(creates.length)],
      ['Atualizar', String(updates.length)],
      ['Descontinuar', String(deactivates.length)],
      ['Sem Alteração', String(comparisonResults.unchanged.length)],
    ],
    theme: 'striped',
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: getNextY(doc, cursorY) + 6,
    head: [['Insights de Preço', 'Valor']],
    body: [
      ['Variação Média', formatPercentSigned(insights.variacaoMedia)],
      ['Ticket Médio (antes)', formatCurrency(insights.ticketMedioAntes)],
      ['Ticket Médio (depois)', formatCurrency(insights.ticketMedioDepois)],
      ['Variação Ticket Médio', formatPercentSigned(insights.variacaoTicketMedio)],
      ['Impacto Total em Valor', formatCurrency(insights.impactoTotalValor)],
      ['Distribuição', `${insights.totalAumentos} aumentos | ${insights.totalReducoes} reduções`],
      ['Faixa de Variação', `${formatPercentSigned(insights.variacaoMin)} a ${formatPercentSigned(insights.variacaoMax)}`],
    ],
    theme: 'striped',
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: getNextY(doc, cursorY) + 6,
    head: [['Saúde do Catálogo', 'Valor']],
    body: [
      ['Taxa de Renovação', formatPercent(insights.taxaRenovacao)],
      ['Taxa de Descontinuação', formatPercent(insights.taxaDescontinuacao)],
      ['Estabilidade', formatPercent(insights.taxaEstabilidade)],
    ],
    theme: 'striped',
    styles: { fontSize: 9 },
  });

  const topAumentos = getTopVariacoes(updates, 'aumento', 10);
  const topReducoes = getTopVariacoes(updates, 'reducao', 10);
  const alertas = getAlertasVariacaoExtrema(updates, 30);

  autoTable(doc, {
    startY: getNextY(doc, cursorY) + 6,
    head: [['Top 10 Maiores Aumentos', '', '', '', '']],
    body: [
      ['Código', 'Descrição', 'Preço Atual', 'Preço Novo', 'Variação'],
      ...topAumentos.map((item) => [
        item.codigo,
        item.descricao || '-',
        formatCurrency(item.precoAtual),
        formatCurrency(item.precoNovo),
        formatPercentSigned(item.variacaoPercentual),
      ]),
    ],
    theme: 'striped',
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    startY: getNextY(doc, cursorY) + 6,
    head: [['Top 10 Maiores Reduções', '', '', '', '']],
    body: [
      ['Código', 'Descrição', 'Preço Atual', 'Preço Novo', 'Variação'],
      ...topReducoes.map((item) => [
        item.codigo,
        item.descricao || '-',
        formatCurrency(item.precoAtual),
        formatCurrency(item.precoNovo),
        formatPercentSigned(item.variacaoPercentual),
      ]),
    ],
    theme: 'striped',
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    startY: getNextY(doc, cursorY) + 6,
    head: [['Alertas de Variação Extrema (±30%)', '', '', '', '']],
    body: [
      ['Código', 'Descrição', 'Preço Atual', 'Preço Novo', 'Variação'],
      ...alertas.map((item) => [
        item.codigo,
        item.descricao || '-',
        formatCurrency(item.precoAtual),
        formatCurrency(item.precoNovo),
        formatPercentSigned(item.variacaoPercentual),
      ]),
    ],
    theme: 'striped',
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    startY: getNextY(doc, cursorY) + 6,
    head: [['Produtos Novos', '', '']],
    body: [
      ['Código', 'Descrição', 'Preço Base'],
      ...creates.map((item) => [
        item.codigo,
        item.descricao || '-',
        formatCurrency(item.precoBase),
      ]),
    ],
    theme: 'striped',
    styles: { fontSize: 8 },
  });

  autoTable(doc, {
    startY: getNextY(doc, cursorY) + 6,
    head: [['Produtos Descontinuados', '']],
    body: [
      ['Código', 'Descrição'],
      ...deactivates.map((item) => [item.codigo, item.descricao || '-']),
    ],
    theme: 'striped',
    styles: { fontSize: 8 },
  });

  doc.save(`relatorio-importacao-${new Date().toISOString().slice(0, 10)}.pdf`);
}
