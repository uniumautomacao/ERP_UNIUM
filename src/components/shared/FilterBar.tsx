import { SearchBox, Dropdown, Option, Button, tokens } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

interface FilterOption {
  key: string;
  text: string;
}

interface ActiveFilter {
  id: string;
  label: string;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  isInline?: boolean;
  filters?: {
    id: string;
    label: string;
    options: FilterOption[];
    selectedKey?: string;
    onChange: (key: string) => void;
  }[];
  activeFilters?: ActiveFilter[];
  onClearFilter?: (id: string) => void;
  onClearAll?: () => void;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  isInline = false,
  filters = [],
  activeFilters = [],
  onClearFilter,
  onClearAll,
}: FilterBarProps) {
  const controlsClassName = isInline
    ? 'flex items-center gap-3'
    : 'flex items-center gap-3 mb-3';

  return (
    <div className={isInline ? 'contents' : ''}>
      {/* Filter Controls */}
      <div className={controlsClassName}>
        {/* Search */}
        {onSearchChange && (
          <SearchBox
            placeholder="Search..."
            value={searchValue}
            onChange={(_, data) => onSearchChange(data.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearchSubmit?.(searchValue ?? '');
              }
            }}
            style={{ flexGrow: 1, maxWidth: '400px' }}
          />
        )}

        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <Dropdown
            key={filter.id}
            placeholder={filter.label}
            value={filter.selectedKey ? filter.options.find(o => o.key === filter.selectedKey)?.text : ''}
            onOptionSelect={(_, data) => filter.onChange(data.optionValue as string)}
            style={{ minWidth: '150px' }}
          >
            {filter.options.map((option) => (
              <Option key={option.key} value={option.key}>
                {option.text}
              </Option>
            ))}
          </Dropdown>
        ))}

        {/* Clear All */}
        {activeFilters.length > 0 && onClearAll && (
          <Button appearance="subtle" onClick={onClearAll}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: tokens.colorNeutralForeground3, fontSize: '14px' }}>Active:</span>
          {activeFilters.map((filter) => (
            <Button
              key={filter.id}
              appearance="subtle"
              size="small"
              icon={<Dismiss24Regular />}
              iconPosition="after"
              onClick={() => onClearFilter?.(filter.id)}
              style={{
                backgroundColor: tokens.colorNeutralBackground3,
                borderRadius: '16px',
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
