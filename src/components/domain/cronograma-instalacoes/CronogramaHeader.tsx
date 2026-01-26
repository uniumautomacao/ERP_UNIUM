import { Dropdown, Option, SearchBox, tokens } from '@fluentui/react-components';
import type { TipoServicoFiltro } from '../../../features/cronograma-instalacoes/types';

interface CronogramaHeaderProps {
  anos: number[];
  anoSelecionado: number;
  onAnoChange: (value: number) => void;
  tipoServico: TipoServicoFiltro;
  onTipoServicoChange: (value: TipoServicoFiltro) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

export function CronogramaHeader({
  anos,
  anoSelecionado,
  onAnoChange,
  tipoServico,
  onTipoServicoChange,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
}: CronogramaHeaderProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3"
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: tokens.colorNeutralBackground1,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
      }}
    >
      <Dropdown
        placeholder="Ano"
        value={String(anoSelecionado)}
        selectedOptions={[String(anoSelecionado)]}
        onOptionSelect={(_, data) => onAnoChange(Number(data.optionValue))}
        style={{ width: '120px' }}
      >
        {anos.map((ano) => (
          <Option key={ano} value={String(ano)} text={String(ano)}>
            {ano}
          </Option>
        ))}
      </Dropdown>

      <Dropdown
        placeholder="Tipo de serviço"
        value={tipoServico === 'todos' ? 'Todos' : tipoServico === 'instalacao' ? 'Instalação' : 'Cabeamento'}
        selectedOptions={[tipoServico]}
        onOptionSelect={(_, data) => onTipoServicoChange(data.optionValue as TipoServicoFiltro)}
        style={{ width: '150px' }}
      >
        <Option value="todos">Todos</Option>
        <Option value="cabeamento">Cabeamento</Option>
        <Option value="instalacao">Instalação</Option>
      </Dropdown>

      <div className="flex-1 min-w-[240px]">
        <SearchBox
          placeholder={searchPlaceholder ?? 'Buscar projeto ou cliente...'}
          value={searchTerm}
          onChange={(_, data) => onSearchChange(data.value)}
        />
      </div>
    </div>
  );
}

