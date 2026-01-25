import { useEffect, useId, useState } from 'react';
import { Input, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  input: {
    minWidth: '120px',
    maxWidth: '180px',
  },
  datalist: {
    color: tokens.colorNeutralForeground3,
  },
});

interface LocationEditorProps {
  value?: string | null;
  options: string[];
  placeholder?: string;
  onCommit: (value: string) => void;
}

export function LocationEditor({
  value,
  options,
  placeholder = 'Localização',
  onCommit,
}: LocationEditorProps) {
  const styles = useStyles();
  const listId = useId();
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const commitValue = () => {
    const next = draft.trim();
    if ((value ?? '') !== next) {
      onCommit(next);
    }
  };

  return (
    <div>
      <Input
        className={styles.input}
        value={draft}
        onChange={(_, data) => setDraft(data.value)}
        onBlur={commitValue}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitValue();
          }
        }}
        placeholder={placeholder}
        list={listId}
      />
      <datalist id={listId} className={styles.datalist}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}
