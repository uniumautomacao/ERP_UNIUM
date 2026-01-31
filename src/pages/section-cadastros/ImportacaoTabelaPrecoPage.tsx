import { useState, useMemo } from 'react';
import { Button } from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  ArrowSync24Regular,
  DocumentTable24Regular,
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { UploadStep } from './importacao/UploadStep';
import { MappingStep } from './importacao/MappingStep';
import { ComparisonStep } from './importacao/ComparisonStep';
import { ReportStep } from './importacao/ReportStep';
import { ExecutionStep } from './importacao/ExecutionStep';
import { ImportacaoState, WizardStep, ParsedExcelData, ColumnMapping, ComparisonResults, ExecutionResults } from './importacao/importacaoTypes';

const initialState: ImportacaoState = {
  currentStep: 1,
  excelData: null,
  columnMapping: {
    codigoColumn: null,
    descricaoColumn: null,
    precoBaseColumn: null,
    precoSugeridoColumn: null,
  },
  fabricanteId: '',
  fabricanteLabel: '',
  comparisonResults: null,
  executionResults: null,
  valoresInferidos: null,
  markupSource: 'inferred',
  markupBaseColumn: null,
  markupSugeridoColumn: null,
};

export function ImportacaoTabelaPrecoPage() {
  const [state, setState] = useState<ImportacaoState>(initialState);
  const [defaultMarkup, setDefaultMarkup] = useState(0);
  const [defaultDesconto, setDefaultDesconto] = useState(0);

  const handleReset = () => {
    setState(initialState);
    setDefaultMarkup(0);
    setDefaultDesconto(0);
  };

  const handleDataParsed = (data: ParsedExcelData) => {
    setState((prev) => ({ ...prev, excelData: data }));
  };

  const handleMappingChange = (mapping: ColumnMapping) => {
    setState((prev) => ({ ...prev, columnMapping: mapping }));
  };

  const handleFabricanteChange = (id: string, label: string) => {
    setState((prev) => ({ ...prev, fabricanteId: id, fabricanteLabel: label }));
  };

  const handleMarkupSourceChange = (source: 'inferred' | 'calculated') => {
    setState((prev) => ({ ...prev, markupSource: source }));
  };

  const handleComparisonComplete = (results: ComparisonResults) => {
    setState((prev) => ({ ...prev, comparisonResults: results }));
  };

  const handleExecutionComplete = (results: ExecutionResults) => {
    setState((prev) => ({ ...prev, executionResults: results }));
  };

  const canGoNext = useMemo(() => {
    switch (state.currentStep) {
      case 1:
        return state.excelData !== null;
      case 2:
        return (
          state.columnMapping.codigoColumn !== null &&
          state.columnMapping.precoBaseColumn !== null &&
          state.fabricanteId !== ''
        );
      case 3:
        return state.comparisonResults !== null;
      case 4:
        return state.comparisonResults !== null;
      case 5:
        return false; // No next from execution step
      default:
        return false;
    }
  }, [state]);

  const handleNext = () => {
    if (canGoNext && state.currentStep < 5) {
      setState((prev) => ({ ...prev, currentStep: (prev.currentStep + 1) as WizardStep }));
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      setState((prev) => ({ ...prev, currentStep: (prev.currentStep - 1) as WizardStep }));
    }
  };

  const stepTitles: Record<WizardStep, string> = {
    1: 'Upload de Arquivo',
    2: 'Mapeamento de Colunas',
    3: 'Comparação e Revisão',
    4: 'Relatório de Análise',
    5: 'Execução',
  };

  const primaryActions = useMemo(
    () => [
      {
        id: 'reset',
        label: 'Reiniciar',
        icon: <ArrowSync24Regular />,
        onClick: handleReset,
      },
    ],
    []
  );

  return (
    <>
      <CommandBar primaryActions={primaryActions} />
      <PageHeader
        title="Importação de Tabela de Preços"
        subtitle="Importe e compare produtos de tabelas Excel com o sistema"
      />
      <PageContainer>
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step === state.currentStep
                      ? 'bg-blue-600 text-white'
                      : step < state.currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <div className="flex-1">
                  {step < 5 && (
                    <div
                      className={`h-1 ${
                        step < state.currentStep ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{stepTitles[state.currentStep as WizardStep]}</p>
          </div>
        </div>

        {/* Step Content */}
        {state.currentStep === 1 && (
          <UploadStep excelData={state.excelData} onDataParsed={handleDataParsed} />
        )}

        {state.currentStep === 2 && state.excelData && (
          <MappingStep
            excelData={state.excelData}
            columnMapping={state.columnMapping}
            fabricanteId={state.fabricanteId}
            fabricanteLabel={state.fabricanteLabel}
            markupSource={state.markupSource}
            defaultMarkup={defaultMarkup}
            defaultDesconto={defaultDesconto}
            onMappingChange={handleMappingChange}
            onFabricanteChange={handleFabricanteChange}
            onMarkupSourceChange={handleMarkupSourceChange}
            onMarkupChange={setDefaultMarkup}
            onDescontoChange={setDefaultDesconto}
          />
        )}

        {state.currentStep === 3 && state.excelData && (
          <ComparisonStep
            excelData={state.excelData}
            columnMapping={state.columnMapping}
            fabricanteId={state.fabricanteId}
            markupSource={state.markupSource}
            defaultMarkup={defaultMarkup}
            defaultDesconto={defaultDesconto}
            onComparisonComplete={handleComparisonComplete}
          />
        )}

        {state.currentStep === 4 && state.comparisonResults && (
          <ReportStep
            comparisonResults={state.comparisonResults}
            fabricanteLabel={state.fabricanteLabel}
          />
        )}

        {state.currentStep === 5 && state.comparisonResults && (
          <ExecutionStep
            comparisonResults={state.comparisonResults}
            fabricanteId={state.fabricanteId}
            onExecutionComplete={handleExecutionComplete}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            appearance="secondary"
            icon={<ArrowLeft24Regular />}
            onClick={handleBack}
            disabled={state.currentStep === 1}
          >
            Voltar
          </Button>
          {state.currentStep < 5 && (
            <Button
              appearance="primary"
              icon={<ArrowRight24Regular />}
              iconPosition="after"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              Próximo
            </Button>
          )}
          {state.currentStep === 5 && state.executionResults && (
            <Button
              appearance="primary"
              icon={<DocumentTable24Regular />}
              onClick={handleReset}
            >
              Nova Importação
            </Button>
          )}
        </div>
      </PageContainer>
    </>
  );
}
