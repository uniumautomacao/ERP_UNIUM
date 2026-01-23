import { useCallback, useEffect, useState } from 'react';
import { Combobox, Option, Spinner, tokens } from '@fluentui/react-components';

export interface SearchableComboboxOption {
  id: string;
  label: string;
}

export interface SearchableComboboxProps {
  id?: string;
  placeholder?: string;
  value: string;
  selectedId: string | null;
  onSelect: (id: string | null, label: string) => void;
  onSearch: (term: string) => Promise<SearchableComboboxOption[]>;
  disabled?: boolean;
  required?: boolean;
  showAllOnFocus?: boolean;
}

export function SearchableCombobox({
  id,
  placeholder,
  value,
  selectedId,
  onSelect,
  onSearch,
  disabled,
  required,
  showAllOnFocus,
}: SearchableComboboxProps) {
  const [options, setOptions] = useState<SearchableComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [debounceTimer, setDebounceTimer] = useState<any | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const performSearch = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const results = await onSearch(term);
        setOptions(results);
      } catch (error) {
        console.error('[SearchableCombobox] Erro ao buscar:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [onSearch]
  );

  const handleInputChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const term = ev.target.value;
      setInputValue(term);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const normalized = term.trim();
      if (!normalized && !showAllOnFocus) {
        setOptions([]);
        setLoading(false);
        return;
      }

      const timer = setTimeout(() => {
        void performSearch(normalized);
      }, 300);

      setDebounceTimer(timer);
    },
    [debounceTimer, performSearch, showAllOnFocus]
  );

  const handleFocus = useCallback(() => {
    if (showAllOnFocus && inputValue.trim().length === 0) {
      void performSearch('');
    }
  }, [showAllOnFocus, inputValue, performSearch]);

  const handleOptionSelect = useCallback(
    (_: any, data: any) => {
      const optionValue = data.optionValue as string | undefined;
      if (!optionValue) {
        onSelect(null, '');
        setInputValue('');
        return;
      }

      const selectedOption = options.find((opt) => opt.id === optionValue);
      if (selectedOption) {
        onSelect(selectedOption.id, selectedOption.label);
        setInputValue(selectedOption.label);
      }
    },
    [onSelect, options]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <Combobox
      id={id}
      placeholder={placeholder}
      value={inputValue}
      selectedOptions={selectedId ? [selectedId] : []}
      onOptionSelect={handleOptionSelect}
      onChange={handleInputChange}
      onFocus={handleFocus}
      disabled={disabled}
      required={required}
      listbox={{
        style: { maxHeight: '300px', overflowY: 'auto' },
      }}
    >
      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            gap: '8px',
            color: tokens.colorNeutralForeground3,
          }}
        >
          <Spinner size="tiny" />
          <span style={{ fontSize: '14px' }}>Buscando...</span>
        </div>
      )}
      {!loading &&
        options.map((option) => (
          <Option key={option.id} value={option.id}>
            {option.label}
          </Option>
        ))}
      {!loading &&
        inputValue.trim().length === 0 &&
        !showAllOnFocus && (
        <div
          style={{
            padding: '12px',
            textAlign: 'center',
            color: tokens.colorNeutralForeground3,
            fontSize: '14px',
          }}
        >
          Digite para buscar
        </div>
      )}
      {!loading && inputValue.trim().length > 0 && options.length === 0 && (
        <div
          style={{
            padding: '12px',
            textAlign: 'center',
            color: tokens.colorNeutralForeground3,
            fontSize: '14px',
          }}
        >
          Nenhum resultado encontrado
        </div>
      )}
    </Combobox>
  );
}
