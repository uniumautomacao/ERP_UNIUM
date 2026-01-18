import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Title3,
  Field,
  Input,
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
  field: {
    maxWidth: '400px',
  },
});

const RackCategorySelect: React.FC = () => {
  const styles = useStyles();
  const { template, setRackCategory } = useEditorContext();

  if (!template) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <Title3 className={styles.header}>Categoria do Rack</Title3>
      <Field label="Categoria" className={styles.field}>
        <Input
          value={template.RackCategory}
          onChange={(_, data) => setRackCategory(data.value)}
          placeholder="Ex: Server, Network, Storage..."
        />
      </Field>
    </section>
  );
};

export default RackCategorySelect;
