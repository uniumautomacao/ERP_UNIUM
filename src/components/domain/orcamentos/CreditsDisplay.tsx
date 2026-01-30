/**
 * Display de créditos do cliente
 */

import { tokens, Card, makeStyles } from '@fluentui/react-components';
import { Money24Regular } from '@fluentui/react-icons';
import { formatarMoeda } from '../../../features/orcamentos/utils';

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  creditItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} 0`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: '14px',
  },
  label: {
    color: tokens.colorNeutralForeground2,
  },
  value: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  available: {
    color: tokens.colorPaletteGreenForeground1,
  },
  used: {
    color: tokens.colorPaletteRedForeground1,
  },
});

interface CreditsDisplayProps {
  availableCredits?: number;
  usedCredits?: number;
}

export function CreditsDisplay({
  availableCredits = 0,
  usedCredits = 0,
}: CreditsDisplayProps) {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Money24Regular />
        <h4 className={styles.title}>Créditos do Cliente</h4>
      </div>

      <div>
        <div className={styles.creditItem}>
          <span className={styles.label}>Disponível:</span>
          <span className={`${styles.value} ${styles.available}`}>
            {formatarMoeda(availableCredits)}
          </span>
        </div>

        <div className={styles.creditItem}>
          <span className={styles.label}>Utilizado:</span>
          <span className={`${styles.value} ${styles.used}`}>
            {formatarMoeda(usedCredits)}
          </span>
        </div>

        <div className={styles.creditItem} style={{ borderBottom: 'none', paddingTop: tokens.spacingVerticalM }}>
          <span className={styles.label}>Saldo:</span>
          <span className={styles.value} style={{ fontSize: '16px' }}>
            {formatarMoeda(availableCredits - usedCredits)}
          </span>
        </div>
      </div>
    </Card>
  );
}
