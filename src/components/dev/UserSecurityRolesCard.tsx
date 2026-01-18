import { 
  Card, 
  CardHeader, 
  Text, 
  makeStyles, 
  tokens, 
  Button, 
  Spinner,
  Badge
} from '@fluentui/react-components';
import { 
  ShieldLock24Regular, 
  ArrowSync24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular
} from '@fluentui/react-icons';
import { useUserRoles } from '../../hooks/useUserRoles';

const useStyles = makeStyles({
  card: {
    width: '100%',
    maxWidth: '500px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
  },
  roleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '4px',
  },
  roleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':last-child': {
      borderBottom: 'none',
    },
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    color: tokens.colorPaletteRedForeground1,
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
  }
});

export const UserSecurityRolesCard: React.FC = () => {
  const styles = useStyles();
  const { roles, loading, error, refresh } = useUserRoles();

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<ShieldLock24Regular />}
        header={<Text weight="semibold">Security Roles do Usuário</Text>}
        description={<Text size={200}>Roles atribuídas no Dataverse</Text>}
        action={
          <Button 
            appearance="transparent" 
            icon={<ArrowSync24Regular />} 
            onClick={refresh}
            disabled={loading}
            aria-label="Atualizar roles"
          />
        }
      />

      <div className={styles.content}>
        {loading ? (
          <div className={styles.emptyContainer}>
            <Spinner label="Carregando roles..." />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <Warning24Regular fontSize={32} />
            <Text align="center">{error}</Text>
            <Button size="small" onClick={refresh}>Tentar novamente</Button>
          </div>
        ) : roles.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Text>Nenhuma role encontrada para este usuário.</Text>
          </div>
        ) : (
          <div className={styles.roleList}>
            {roles.map((role) => (
              <div key={role.roleId} className={styles.roleItem}>
                <CheckmarkCircle24Regular color={tokens.colorPaletteGreenForeground1} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text weight="medium">{role.name}</Text>
                  <Text size={100} font="monospace" color={tokens.colorNeutralForeground4}>
                    {role.roleId}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && !error && roles.length > 0 && (
        <div className={styles.footer}>
          <Badge appearance="ghost" color="informative">
            {roles.length} {roles.length === 1 ? 'role' : 'roles'} encontrada(s)
          </Badge>
        </div>
      )}
    </Card>
  );
};
