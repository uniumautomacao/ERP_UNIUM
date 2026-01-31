import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Dropdown,
  Input,
  Label,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Radio,
  RadioGroup,
  Text,
  tokens,
} from '@fluentui/react-components';
import { SearchableCombobox } from '../../../components/shared/SearchableCombobox';
import { Cr22fFabricantesFromSharpointListService } from '../../../generated';
import { ParsedExcelData, ColumnMapping, MonetaryColumn } from './importacaoTypes';
import { autoMapColumns, identificarColunasMonetarias } from './importacaoUtils';
import { escapeOData } from '../ajustes/ajustesCadastroProdutosUtils';

interface MappingStepProps {
  excelData: ParsedExcelData;
  columnMapping: ColumnMapping;
  fabricanteId: string;
  fabricanteLabel: string;
  markupSource: 'inferred' | 'calculated';
  defaultMarkup: number;
  defaultDesconto: number;
  onMappingChange: (mapping: ColumnMapping) => void;
  onFabricanteChange: (id: string, label: string) => void;
  onMarkupSourceChange: (source: 'inferred' | 'calculated') => void;
  onMarkupChange: (markup: number) => void;
  onDescontoChange: (desconto: number) => void;
}

export function MappingStep({
  excelData,
  columnMapping,
  fabricanteId,
  fabricanteLabel,
  markupSource,
  defaultMarkup,
  defaultDesconto,
  onMappingChange,
  onFabricanteChange,
  onMarkupSourceChange,
  onMarkupChange,
  onDescontoChange,
}: MappingStepProps) {
  const [monetaryColumns, setMonetaryColumns] = useState<MonetaryColumn[]>([]);
  const [autoMapped, setAutoMapped] = useState(false);

  useEffect(() => {
    // Auto-map columns on first load
    if (!autoMapped && excelData) {
      const mapping = autoMapColumns(excelData.headers);
      onMappingChange(mapping);
      setAutoMapped(true);

      // Identify monetary columns
      const monetaryCols = identificarColunasMonetarias(excelData);
      setMonetaryColumns(monetaryCols);
    }
  }, [excelData, autoMapped, onMappingChange]);

  const searchFabricantes = useCallback(async (term: string) => {
    const normalized = term.trim();
    const filter =
      normalized.length >= 2
        ? `statecode eq 0 and contains(cr22f_title, '${escapeOData(normalized)}')`
        : 'statecode eq 0';

    const result = await Cr22fFabricantesFromSharpointListService.getAll({
      select: ['cr22f_fabricantesfromsharpointlistid', 'cr22f_title', 'cr22f_id'],
      filter,
      orderBy: ['cr22f_title asc'],
      top: 50,
    });

    if (result.success && result.data) {
      return result.data.map((item: any) => ({
        id: item.cr22f_fabricantesfromsharpointlistid,
        label: item.cr22f_title || item.cr22f_id || 'Fabricante',
      }));
    }

    return [];
  }, []);

  const hasRequiredMappings = columnMapping.codigoColumn && columnMapping.precoBaseColumn && fabricanteId;

  return (
    <div className="grid grid-cols-1 desktop:grid-cols-2 gap-6">
      {/* Left Column - Column Mapping */}
      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
          Mapeamento de Colunas
        </Text>

        <div className="grid grid-cols-1 gap-4">
          {/* Código (obrigatório) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="codigo-col" required>
              Coluna de Código do Produto
            </Label>
            <Dropdown
              id="codigo-col"
              placeholder="Selecione a coluna"
              value={columnMapping.codigoColumn || ''}
              onOptionSelect={(_, data) =>
                onMappingChange({ ...columnMapping, codigoColumn: data.optionValue || null })
              }
            >
              {excelData.headers.map((header) => (
                <Option key={header} value={header}>
                  {header}
                </Option>
              ))}
            </Dropdown>
          </div>

          {/* Descrição (opcional) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao-col">Coluna de Descrição</Label>
            <Dropdown
              id="descricao-col"
              placeholder="Selecione a coluna (opcional)"
              value={columnMapping.descricaoColumn || ''}
              onOptionSelect={(_, data) =>
                onMappingChange({ ...columnMapping, descricaoColumn: data.optionValue || null })
              }
            >
              <Option value="">Nenhuma</Option>
              {excelData.headers.map((header) => (
                <Option key={header} value={header}>
                  {header}
                </Option>
              ))}
            </Dropdown>
          </div>

          {/* Preço Base (obrigatório) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="preco-base-col" required>
              Coluna de Preço Base
            </Label>
            <Dropdown
              id="preco-base-col"
              placeholder="Selecione a coluna"
              value={columnMapping.precoBaseColumn || ''}
              onOptionSelect={(_, data) =>
                onMappingChange({ ...columnMapping, precoBaseColumn: data.optionValue || null })
              }
            >
              {monetaryColumns.map((col) => (
                <Option key={col.columnName} value={col.columnName} text={`${col.columnName} (média: R$ ${col.avgValue.toFixed(2)})`}>
                  {col.columnName} (média: R$ {col.avgValue.toFixed(2)})
                </Option>
              ))}
            </Dropdown>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Apenas colunas monetárias detectadas são exibidas
            </Text>
          </div>

          {/* Preço Sugerido (opcional, para cálculo de markup) */}
          {monetaryColumns.length > 1 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="preco-sugerido-col">Coluna de Preço Sugerido (para cálculo de markup)</Label>
              <Dropdown
                id="preco-sugerido-col"
                placeholder="Selecione a coluna (opcional)"
                value={columnMapping.precoSugeridoColumn || ''}
                onOptionSelect={(_, data) =>
                  onMappingChange({ ...columnMapping, precoSugeridoColumn: data.optionValue || null })
                }
              >
                <Option value="" text="Nenhuma">Nenhuma</Option>
                {monetaryColumns.map((col) => (
                  <Option key={col.columnName} value={col.columnName} text={`${col.columnName} (média: R$ ${col.avgValue.toFixed(2)})`}>
                    {col.columnName} (média: R$ {col.avgValue.toFixed(2)})
                  </Option>
                ))}
              </Dropdown>
            </div>
          )}
        </div>
      </Card>

      {/* Right Column - Fabricante & Markup Configuration */}
      <div className="grid grid-cols-1 gap-6">
        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
            Fabricante
          </Text>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fabricante" required>
              Selecione o Fabricante
            </Label>
            <SearchableCombobox
              id="fabricante"
              placeholder="Buscar fabricante"
              value={fabricanteLabel}
              selectedId={fabricanteId}
              onSelect={(id, label) => {
                onFabricanteChange(id || '', label);
              }}
              onSearch={searchFabricantes}
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Todos os produtos do arquivo serão atribuídos a este fabricante
            </Text>
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
            Configuração de Markup e Desconto
          </Text>

          <div className="grid grid-cols-1 gap-4">
            <RadioGroup
              value={markupSource}
              onChange={(_, data) => onMarkupSourceChange(data.value as 'inferred' | 'calculated')}
            >
              <Radio value="inferred" label="Inferir de produtos existentes do fabricante" />
              {columnMapping.precoSugeridoColumn && (
                <Radio
                  value="calculated"
                  label="Calcular a partir de duas colunas do Excel"
                />
              )}
            </RadioGroup>

            {markupSource === 'inferred' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="default-markup">Markup Padrão (multiplicador)</Label>
                  <Input
                    id="default-markup"
                    type="number"
                    value={String(defaultMarkup)}
                    onChange={(_, data) => onMarkupChange(Number(data.value) || 0)}
                  />
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    Ex: 1 = 100%, 2 = 200%
                  </Text>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="default-desconto">Desconto Padrão (%)</Label>
                  <Input
                    id="default-desconto"
                    type="number"
                    value={String(defaultDesconto)}
                    onChange={(_, data) => onDescontoChange(Number(data.value) || 0)}
                  />
                </div>
              </div>
            )}

            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {markupSource === 'inferred'
                ? 'Valores serão inferidos dos produtos existentes. Os valores acima serão usados como fallback.'
                : 'Markup será calculado automaticamente: Preço Sugerido / (Preço Base × (1 - Desconto/100))'}
            </Text>
          </div>
        </Card>
      </div>

      {/* Validation Message */}
      {!hasRequiredMappings && (
        <Card style={{ padding: 20, gridColumn: '1 / -1' }}>
          <MessageBar intent="warning">
            <MessageBarBody>
              <MessageBarTitle>Campos obrigatórios pendentes</MessageBarTitle>
              <div>
                Por favor, mapeie a coluna de Código, Preço Base e selecione o Fabricante antes de prosseguir.
              </div>
            </MessageBarBody>
          </MessageBar>
        </Card>
      )}
    </div>
  );
}
