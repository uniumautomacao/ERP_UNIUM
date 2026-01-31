import { useCallback, useState, useEffect } from 'react';
import {
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Text,
  tokens,
} from '@fluentui/react-components';
import { CheckmarkCircle24Regular, DismissCircle24Regular, Play24Regular } from '@fluentui/react-icons';
import { ComparisonResults, ExecutionResults } from './importacaoTypes';
import {
  Cr22fModelosdeProdutoFromSharepointListService,
  NewPrecodeProdutoService,
  NewTiposervicoprecodeprodutoService,
} from '../../../generated';

interface ExecutionStepProps {
  comparisonResults: ComparisonResults;
  fabricanteId: string;
  onExecutionComplete: (results: ExecutionResults) => void;
}

export function ExecutionStep({ comparisonResults, fabricanteId, onExecutionComplete }: ExecutionStepProps) {
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResults | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const executeOperations = useCallback(async () => {
    setExecuting(true);
    setProgress(0);
    setLog([]);

    const executionResults: ExecutionResults = {
      created: 0,
      updated: 0,
      deactivated: 0,
      failed: 0,
      errors: [],
    };

    const totalOperations =
      comparisonResults.toCreate.length + comparisonResults.toUpdate.length + comparisonResults.toDeactivate.length;
    let completedOperations = 0;

    try {
      // 1. Criar novos produtos (modelo + preço + serviços)
      addLog(`Iniciando criação de ${comparisonResults.toCreate.length} novos produtos...`);
      setCurrentOperation('Criando novos produtos...');

      for (const item of comparisonResults.toCreate) {
        if (item.action !== 'create') {
          completedOperations++;
          continue;
        }

        try {
          // Criar modelo
          const modeloPayload: any = {
            cr22f_id: crypto.randomUUID(),
            cr22f_title: item.codigo,
            new_descricao: item.descricao,
            cr22f_querycategoria: item.categoria,
            new_tipodesistemapadrao: item.tipoSistema,
            new_controlasn: item.controlaSN,
            new_controlaetiqueta: item.controlaEtiqueta,
            new_requerconfiguracao: item.requerConfiguracao,
            new_requercabeamento: item.requerCabeamento,
            new_requerengraving: item.omitirGuia,
            cr22f_horasagregadas: item.horasAgregadas,
            'new_Fabricante@odata.bind': `/cr22f_fabricantesfromsharpointlists(${fabricanteId})`,
          };

          const modeloResult = await Cr22fModelosdeProdutoFromSharepointListService.create(modeloPayload);

          if (!modeloResult.success || !modeloResult.data) {
            throw new Error('Falha ao criar modelo');
          }

          const novoModeloId = (modeloResult.data as any).cr22f_modelosdeprodutofromsharepointlistid;

          // Criar preço
          const precoPayload: any = {
            new_referenciadoproduto: item.codigo,
            new_descricao: item.descricaoPreco,
            new_precobase: item.precoBase,
            new_descontopercentualdecompra: item.desconto,
            new_markup: item.markup,
            new_requerinstalacao: item.requerInstalacao,
            'new_ModelodeProduto@odata.bind': `/cr22f_modelosdeprodutofromsharepointlists(${novoModeloId})`,
          };

          if (item.fornecedorId) {
            precoPayload['new_Fornecedor@odata.bind'] = `/cr22f_fornecedoresfromsharepointlists(${item.fornecedorId})`;
          }

          const precoResult = await NewPrecodeProdutoService.create(precoPayload);

          if (!precoResult.success || !precoResult.data) {
            throw new Error('Falha ao criar preço');
          }

          const novoPrecoId = (precoResult.data as any).new_precodeprodutoid;

          // Criar vínculos de serviços
          if (item.servicosIds && item.servicosIds.length > 0) {
            await Promise.all(
              item.servicosIds.map((servicoId) =>
                NewTiposervicoprecodeprodutoService.create({
                  'new_TipodeServico@odata.bind': `/new_tipodeservicos(${servicoId})`,
                  'new_PrecodeProduto@odata.bind': `/new_precodeprodutos(${novoPrecoId})`,
                })
              )
            );
          }

          executionResults.created++;
          addLog(`✓ Criado: ${item.codigo}`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          executionResults.failed++;
          executionResults.errors.push({ codigo: item.codigo, error: errorMessage });
          addLog(`✗ Erro ao criar ${item.codigo}: ${errorMessage}`);
        }

        completedOperations++;
        setProgress((completedOperations / totalOperations) * 100);
      }

      // 2. Atualizar produtos existentes
      addLog(`Iniciando atualização de ${comparisonResults.toUpdate.length} produtos...`);
      setCurrentOperation('Atualizando produtos existentes...');

      for (const item of comparisonResults.toUpdate) {
        if (item.action !== 'update') {
          completedOperations++;
          continue;
        }

        try {
          if (item.existingPrices.length > 0) {
            // Atualizar primeiro preço encontrado
            const precoId = item.existingPrices[0].new_precodeprodutoid;
            const precoPayload: any = {
              new_precobase: item.precoBase,
              new_descontopercentualdecompra: item.desconto,
              new_markup: item.markup,
            };

            const result = await NewPrecodeProdutoService.update(precoId, precoPayload);

            if (!result.success) {
              throw result.error || new Error('Falha ao atualizar preço');
            }

            executionResults.updated++;
            addLog(`✓ Atualizado: ${item.codigo}`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          executionResults.failed++;
          executionResults.errors.push({ codigo: item.codigo, error: errorMessage });
          addLog(`✗ Erro ao atualizar ${item.codigo}: ${errorMessage}`);
        }

        completedOperations++;
        setProgress((completedOperations / totalOperations) * 100);
      }

      // 3. Desativar produtos descontinuados
      addLog(`Processando ${comparisonResults.toDeactivate.length} produtos descontinuados...`);
      setCurrentOperation('Desativando produtos descontinuados...');

      for (const item of comparisonResults.toDeactivate) {
        if (item.action !== 'deactivate') {
          completedOperations++;
          continue;
        }

        try {
          // Buscar todos os preços do modelo
          const precosResult = await NewPrecodeProdutoService.getAll({
            filter: `_new_modelodeproduto_value eq '${item.modeloId}' and statecode eq 0`,
          });

          if (precosResult.success && precosResult.data) {
            for (const preco of precosResult.data) {
              await NewPrecodeProdutoService.update((preco as any).new_precodeprodutoid, {
                statecode: 1,
                statuscode: 2,
              });
            }
          }

          executionResults.deactivated++;
          addLog(`✓ Desativado: ${item.codigo}`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          executionResults.failed++;
          executionResults.errors.push({ codigo: item.codigo, error: errorMessage });
          addLog(`✗ Erro ao desativar ${item.codigo}: ${errorMessage}`);
        }

        completedOperations++;
        setProgress((completedOperations / totalOperations) * 100);
      }

      addLog('Importação concluída!');
      setCurrentOperation('Concluído');
      setResults(executionResults);
      onExecutionComplete(executionResults);
    } catch (error) {
      console.error('Erro durante execução:', error);
      addLog(`Erro fatal: ${error}`);
    } finally {
      setExecuting(false);
      setProgress(100);
    }
  }, [comparisonResults, fabricanteId, addLog, onExecutionComplete]);

  const summary = {
    toCreate: comparisonResults.toCreate.filter((i) => i.action === 'create').length,
    toUpdate: comparisonResults.toUpdate.filter((i) => i.action === 'update').length,
    toDeactivate: comparisonResults.toDeactivate.filter((i) => i.action === 'deactivate').length,
  };

  const hasOperations = summary.toCreate + summary.toUpdate + summary.toDeactivate > 0;

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
          Resumo da Importação
        </Text>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <Text size={600} weight="bold" block>
              {summary.toCreate}
            </Text>
            <Text size={300}>Criar</Text>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <Text size={600} weight="bold" block>
              {summary.toUpdate}
            </Text>
            <Text size={300}>Atualizar</Text>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <Text size={600} weight="bold" block>
              {summary.toDeactivate}
            </Text>
            <Text size={300}>Desativar</Text>
          </div>
        </div>

        {!executing && !results && hasOperations && (
          <Button
            appearance="primary"
            size="large"
            icon={<Play24Regular />}
            onClick={executeOperations}
            style={{ width: '100%' }}
          >
            Executar Importação
          </Button>
        )}

        {!hasOperations && (
          <MessageBar intent="warning">
            <MessageBarBody>
              <MessageBarTitle>Nenhuma operação selecionada</MessageBarTitle>
              <div>Não há operações para executar. Volte e selecione as ações desejadas.</div>
            </MessageBarBody>
          </MessageBar>
        )}
      </Card>

      {(executing || results) && (
        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
            Progresso
          </Text>

          <div className="mb-4">
            <ProgressBar value={progress / 100} />
            <Text size={300} block style={{ marginTop: 8, color: tokens.colorNeutralForeground3 }}>
              {currentOperation}
            </Text>
          </div>

          <div
            className="p-4 bg-gray-50 rounded font-mono text-sm overflow-auto"
            style={{ maxHeight: 300, fontSize: 12 }}
          >
            {log.map((entry, index) => (
              <div key={index}>{entry}</div>
            ))}
          </div>
        </Card>
      )}

      {results && (
        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
            Resultados
          </Text>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
              <div>
                <Text size={400} weight="semibold">
                  {results.created + results.updated + results.deactivated} Sucesso
                </Text>
                <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                  {results.created} criados, {results.updated} atualizados, {results.deactivated} desativados
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DismissCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
              <div>
                <Text size={400} weight="semibold">
                  {results.failed} Falhas
                </Text>
                {results.failed > 0 && (
                  <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                    Ver detalhes abaixo
                  </Text>
                )}
              </div>
            </div>
          </div>

          {results.errors.length > 0 && (
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Erros durante a importação</MessageBarTitle>
                <div className="mt-2">
                  {results.errors.map((err, index) => (
                    <div key={index} className="text-sm">
                      • {err.codigo}: {err.error}
                    </div>
                  ))}
                </div>
              </MessageBarBody>
            </MessageBar>
          )}
        </Card>
      )}
    </div>
  );
}
