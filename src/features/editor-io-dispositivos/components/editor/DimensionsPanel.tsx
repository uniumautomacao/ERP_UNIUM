import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Title3,
  Field,
  SpinButton,
} from '@fluentui/react-components';
import { useEditorContext } from '../../context/EditorContext';

const useStyles = makeStyles({
  panel: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  header: {
    marginBottom: '8px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
});

const DimensionsPanel: React.FC = () => {
  const styles = useStyles();
  const { template, setDimensions } = useEditorContext();

  if (!template) {
    return null;
  }

  const { Width, H, Depth } = template.Dimensions;

  const handleChange = (field: 'Width' | 'H' | 'Depth', value: number | null) => {
    const next = {
      ...template.Dimensions,
      [field]: value ?? 0,
    };
    setDimensions(next);
  };

  return (
    <section className={styles.panel}>
      <Title3 className={styles.header}>Dimensões</Title3>
      <div className={styles.formRow}>
        <Field label="Largura (mm)" required>
          <SpinButton
            value={Width}
            onChange={(_, data) => handleChange('Width', data.value ?? 0)}
            min={0}
            step={1}
          />
        </Field>
        <Field label="Altura (U)" required>
          <SpinButton
            value={H}
            onChange={(_, data) => handleChange('H', data.value ?? 0)}
            min={0}
            step={1}
          />
        </Field>
        <Field label="Profundidade (mm)" required>
          <SpinButton
            value={Depth}
            onChange={(_, data) => handleChange('Depth', data.value ?? 0)}
            min={0}
            step={1}
          />
        </Field>
      </div>
    </section>
  );
};

export default DimensionsPanel;
