import { useCallback, useState } from 'react';
import {
  Button,
  Card,
  Dropdown,
  Label,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Text,
  tokens,
} from '@fluentui/react-components';
import { CloudArrowUp24Regular, DocumentTable24Regular } from '@fluentui/react-icons';
import { DataGrid, createTableColumn } from '../../../components/shared/DataGrid';
import { LoadingState } from '../../../components/shared/LoadingState';
import { EmptyState } from '../../../components/shared/EmptyState';
import { ParsedExcelData, ParsedExcelRow } from './importacaoTypes';
import { parseExcel } from './importacaoUtils';

interface UploadStepProps {
  excelData: ParsedExcelData | null;
  onDataParsed: (data: ParsedExcelData) => void;
}

export function UploadStep({ excelData, onDataParsed }: UploadStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [rawFileData, setRawFileData] = useState<File | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError(null);
      setFileName(file.name);
      setRawFileData(file);

      try {
        // Validar tipo de arquivo
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
          throw new Error('Arquivo deve ser .xlsx ou .xls');
        }

        // Parse Excel
        const parsedData = await parseExcel(file);

        // Validar dados mínimos
        if (parsedData.rows.length === 0) {
          throw new Error('Arquivo vazio ou sem dados válidos.');
        }

        if (parsedData.headers.length === 0) {
          throw new Error('Não foi possível identificar o cabeçalho.');
        }

        onDataParsed(parsedData);
        // Reset visible columns to show first 10
        setVisibleColumns(parsedData.headers.slice(0, 10));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
        // Reset input
        event.target.value = '';
      }
    },
    [onDataParsed]
  );

  const handleHeaderRowChange = useCallback(
    async (newHeaderRowIndex: number) => {
      if (!rawFileData) return;

      setLoading(true);
      try {
        // Re-parse Excel with custom header row
        const arrayBuffer = await rawFileData.arrayBuffer();
        const workbook = await import('xlsx').then((XLSX) => XLSX.read(arrayBuffer, { type: 'array' }));
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawData = await import('xlsx').then((XLSX) =>
          XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
          })
        ) as any[][];

        const headers = rawData[newHeaderRowIndex].map((h: any) => String(h || '').trim());
        const dataRows = rawData
          .slice(newHeaderRowIndex + 1)
          .filter((row: any) => row.some((cell: any) => cell !== ''))
          .map((row: any) => {
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index];
            });
            return obj;
          });

        onDataParsed({
          headers,
          rows: dataRows,
          headerRowIndex: newHeaderRowIndex,
          rawData, // Pass raw data for dropdown filtering
        });
        // Reset visible columns to show first 10 of new headers
        setVisibleColumns(headers.slice(0, 10));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [rawFileData, onDataParsed]
  );

  // Get non-empty row indices for dropdown
  const getNonEmptyRowIndices = (): number[] => {
    if (!excelData?.rawData) return [];

    return (excelData.rawData as any[][])
      .map((row: any[], index: number) => {
        const hasContent = row.some((cell: any) => {
          const value = String(cell || '').trim();
          return value !== '';
        });
        return hasContent ? index : -1;
      })
      .filter((index: number) => index !== -1)
      .slice(0, 200); // Limit to first 200 non-empty rows
  };

  const nonEmptyRowIndices = getNonEmptyRowIndices();

  const previewColumns = excelData && visibleColumns.length > 0
    ? visibleColumns.map((header, index) => {
        const headerIndex = excelData.headers.indexOf(header);
        return createTableColumn({
          columnId: `col-${headerIndex}`,
          renderHeaderCell: () => header || `Coluna ${headerIndex + 1}`,
          renderCell: (item: any) => String(item[header] || '-'),
        });
      })
    : [];

  const previewData = excelData ? excelData.rows.slice(0, 10) : [];

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card style={{ padding: 20 }}>
        <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
          Upload de Arquivo Excel
        </Text>

        {error && (
          <div className="mb-4">
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Erro ao processar arquivo</MessageBarTitle>
                <div>{error}</div>
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {!excelData && !loading && (
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: tokens.colorNeutralStroke1 }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <CloudArrowUp24Regular style={{ fontSize: 48, color: tokens.colorBrandForeground1 }} />
              <div>
                <Text size={400} weight="semibold" block>
                  Clique para selecionar ou arraste o arquivo aqui
                </Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                  Arquivos suportados: .xlsx, .xls
                </Text>
              </div>
              <Button appearance="primary" icon={<DocumentTable24Regular />}>
                Escolher Arquivo
              </Button>
            </div>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        )}

        {loading && <LoadingState label="Processando arquivo Excel..." />}

        {excelData && !loading && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DocumentTable24Regular style={{ fontSize: 24, color: tokens.colorPaletteGreenForeground1 }} />
                <div>
                  <Text size={400} weight="semibold" block>
                    {fileName}
                  </Text>
                  <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                    {excelData.rows.length} linhas • {excelData.headers.length} colunas
                  </Text>
                </div>
              </div>
              <Button
                appearance="secondary"
                onClick={() => {
                  document.getElementById('file-input')?.click();
                }}
              >
                Trocar arquivo
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="header-row">Linha de Cabeçalho (detectada automaticamente)</Label>
              <Dropdown
                id="header-row"
                value={`Linha ${excelData.headerRowIndex + 1}`}
                onOptionSelect={(_, data) => {
                  const newRow = parseInt(data.optionValue || '0') - 1;
                  handleHeaderRowChange(newRow);
                }}
              >
                {nonEmptyRowIndices.map((rowIndex) => (
                  <Option key={rowIndex} value={String(rowIndex + 1)} text={`Linha ${rowIndex + 1}`}>
                    Linha {rowIndex + 1}
                  </Option>
                ))}
              </Dropdown>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {excelData.headerRowIndex > 0
                  ? `Cabeçalho detectado na linha ${excelData.headerRowIndex + 1}. Se estiver incorreto, selecione a linha correta acima.`
                  : 'Cabeçalho detectado na primeira linha. Se estiver incorreto, selecione a linha correta acima.'}
              </Text>
            </div>
          </div>
        )}
      </Card>

      {excelData && !loading && (
        <Card style={{ padding: 20 }}>
          <Text size={500} weight="semibold" block style={{ marginBottom: 20 }}>
            Preview dos Dados (10 primeiras linhas)
          </Text>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="visible-columns">Selecione as colunas para visualizar</Label>
              <Dropdown
                id="visible-columns"
                multiselect
                placeholder="Selecione as colunas"
                selectedOptions={visibleColumns}
                onOptionSelect={(_, data) => {
                  setVisibleColumns(data.selectedOptions);
                }}
                value={
                  visibleColumns.length === 0
                    ? 'Nenhuma coluna selecionada'
                    : `${visibleColumns.length} coluna${visibleColumns.length > 1 ? 's' : ''} selecionada${visibleColumns.length > 1 ? 's' : ''}`
                }
              >
                {excelData.headers.map((header, index) => (
                  <Option key={header} value={header} text={header || `Coluna ${index + 1}`}>
                    {header || `Coluna ${index + 1}`}
                  </Option>
                ))}
              </Dropdown>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Total de {excelData.headers.length} colunas disponíveis
              </Text>
            </div>

            {previewData.length > 0 && visibleColumns.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <DataGrid
                  items={previewData}
                  columns={previewColumns}
                  getRowId={(_item: ParsedExcelRow, index?: number) => `preview-${index ?? 0}`}
                />
              </div>
            ) : visibleColumns.length === 0 ? (
              <MessageBar intent="info">
                <MessageBarBody>
                  <MessageBarTitle>Selecione colunas para visualizar</MessageBarTitle>
                  <div>Escolha as colunas que deseja visualizar no preview acima.</div>
                </MessageBarBody>
              </MessageBar>
            ) : (
              <EmptyState title="Sem dados para exibir" description="O arquivo não contém dados válidos." />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
