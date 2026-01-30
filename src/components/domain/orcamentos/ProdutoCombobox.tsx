/**
 * Combobox para selecionar Produto (via Preço de Produto)
 * Busca na tabela new_precodeproduto com filtro de pesquisa
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Combobox,
  ComboboxProps,
  Option,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { NewPrecodeProdutoService } from '../../../generated/services/NewPrecodeProdutoService';
import type { NewPrecodeProduto } from '../../../generated/models/NewPrecodeProdutoModel';
import type { IGetAllOptions } from '../../../generated/models/CommonModels';

const useStyles = makeStyles({
  option: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  optionTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  optionSubtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface ProdutoComboboxProps extends Omit<ComboboxProps, 'value' | 'onChange'> {
  value?: string | null;
  onChange?: (value: string | null, item: NewPrecodeProduto | null) => void;
  disabled?: boolean;
}

export function ProdutoCombobox({
  value,
  onChange,
  disabled,
  ...comboboxProps
}: ProdutoComboboxProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<NewPrecodeProduto[]>([]);
  const [selectedItem, setSelectedItem] = useState<NewPrecodeProduto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Carregar item selecionado ao receber value
  useEffect(() => {
    console.log('[ProdutoCombobox] Value changed:', value);
    
    if (!value) {
      setSelectedItem(null);
      return;
    }

    if (selectedItem?.new_precodeprodutoid === value) {
      console.log('[PrecoProdutoCombobox] Já está selecionado:', value);
      return;
    }

    console.log('[PrecoProdutoCombobox] Buscando preço:', value);
    NewPrecodeProdutoService.get(value)
      .then((result) => {
        const success = (result as any).success ?? (result as any).isSuccess;
        const data = (result as any).data ?? (result as any).value;
        if (success && data) {
          setSelectedItem(data);
          setItems([data]);
        }
      })
      .catch((err) => console.error('Erro ao carregar produto:', err));
  }, [value, selectedItem?.new_precodeprodutoid]);

  // Buscar itens com base na query de pesquisa
  const fetchItems = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      // Construir filtro de pesquisa
      const searchTerms = query.trim();
      const escapedTerms = searchTerms.replace(/'/g, "''");
      let filter = 'statecode eq 0';

      if (searchTerms) {
        const searchConditions = [
          `contains(new_name, '${escapedTerms}')`,
          `contains(new_descricao, '${escapedTerms}')`,
          `contains(new_referenciadoproduto, '${escapedTerms}')`,
          `contains(new_nomedoproduto, '${escapedTerms}')`,
        ].join(' or ');
        filter += ` and (${searchConditions})`;
      }

      const options: IGetAllOptions = {
        filter,
        orderBy: ['new_name'],
        top: 50, // Limitar resultados
      };

      const result = await NewPrecodeProdutoService.getAll(options);
      const success = (result as any).success ?? (result as any).isSuccess;
      const data = (result as any).data ?? (result as any).value;

      if (success && data) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Erro ao buscar preços de produtos:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchItems]);

  // Buscar ao abrir o combobox se não houver itens
  const handleOpenChange = useCallback((open: boolean) => {
    if (open && items.length === 0 && !isLoading) {
      fetchItems('');
    }
  }, [items.length, isLoading, fetchItems]);

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
  };

  const handleOptionSelect = (_: any, data: any) => {
    const selectedId = data.optionValue;
    const selected = items.find((item) => item.new_precodeprodutoid === selectedId);
    
    if (selected) {
      setSelectedItem(selected);
      onChange?.(selected.new_precodeprodutoid, selected);
    } else if (selectedId === '' || selectedId === null) {
      setSelectedItem(null);
      onChange?.(null, null);
    }
  };

  // Valor exibido no input
  const displayValue = useMemo(() => {
    if (selectedItem) {
      return selectedItem.new_name || selectedItem.new_referenciadoproduto || selectedItem.new_precodeprodutoid;
    }
    return searchQuery;
  }, [selectedItem, searchQuery]);

  return (
    <Combobox
      {...comboboxProps}
      value={displayValue}
      onInput={(e) => handleInputChange(e.currentTarget.value)}
      onOptionSelect={handleOptionSelect}
      onOpenChange={(_, data) => handleOpenChange(data.open)}
      selectedOptions={selectedItem ? [selectedItem.new_precodeprodutoid] : []}
      placeholder="Buscar produto..."
      disabled={disabled}
      freeform
    >
      {isLoading && (
        <Option value="__loading__" disabled text="Buscando">
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <Spinner size="tiny" />
            <span>Buscando...</span>
          </div>
        </Option>
      )}
      {!isLoading && items.length === 0 && (
        <Option
          value="__empty__"
          disabled
          text={searchQuery ? 'Nenhum resultado encontrado' : 'Digite para buscar'}
        >
          {searchQuery ? 'Nenhum resultado encontrado' : 'Digite para buscar'}
        </Option>
      )}
      {!isLoading && items.map((item) => (
        <Option
          key={item.new_precodeprodutoid}
          value={item.new_precodeprodutoid}
          text={[
            item.new_name,
            item.new_referenciadoproduto,
            item.new_descricao,
            item.new_nomedoproduto,
          ]
            .filter(Boolean)
            .join(' - ')}
        >
          <div className={styles.option}>
            <div className={styles.optionTitle}>
              {item.new_name || item.new_referenciadoproduto || 'Sem nome'}
            </div>
            {(item.new_descricao || item.new_nomedoproduto) && (
              <div className={styles.optionSubtitle}>
                {item.new_descricao || item.new_nomedoproduto}
              </div>
            )}
            {item.new_precodevenda && (
              <div className={styles.optionSubtitle}>
                R$ {item.new_precodevenda.toFixed(2)}
              </div>
            )}
          </div>
        </Option>
      ))}
    </Combobox>
  );
}
