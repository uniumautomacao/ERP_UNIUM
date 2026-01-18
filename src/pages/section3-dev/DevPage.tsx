import { useState, useEffect } from 'react';
import { Text, Card, CardHeader, makeStyles, tokens } from '@fluentui/react-components';
import { DeveloperBoard24Regular, Person24Regular } from '@fluentui/react-icons';
import { getContext } from '@microsoft/power-apps/app';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    alignItems: 'center',
    paddingTop: tokens.spacingVerticalXXL,
  },
  card: {
    width: '100%',
    maxWidth: '500px',
  },
  userInfoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  label: {
    color: tokens.colorNeutralForeground3,
  }
});

export function DevPage() {
  const styles = useStyles();
  const [userInfo, setUserInfo] = useState<{ objectId: string; fullName: string; userPrincipalName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const context = await getContext();
        setUserInfo(context.user);
      } catch (error) {
        console.error('Erro ao obter contexto do usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, []);

  return (
    <>
      <CommandBar primaryActions={[]} />
      <PageHeader
        title="Área do Desenvolvedor"
        subtitle="Página para novas implementações e informações de sistema"
      />
      <PageContainer>
        <div className={styles.container}>
          <div 
            className="flex flex-col items-center justify-center" 
            style={{ opacity: 0.5, marginBottom: tokens.spacingVerticalXL }}
          >
            <DeveloperBoard24Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
            <Text size={500} weight="semibold">
              Página de Desenvolvimento
            </Text>
            <Text size={300}>
              Recursos de depuração e testes.
            </Text>
          </div>

          <Card className={styles.card}>
            <CardHeader
              image={<Person24Regular />}
              header={<Text weight="semibold">Contexto do Usuário Microsoft</Text>}
              description={<Text size={200}>Informações de autenticação do AAD</Text>}
            />
            
            <div className={styles.userInfoSection}>
              {loading ? (
                <Text>Carregando informações do usuário...</Text>
              ) : userInfo ? (
                <>
                  <div className={styles.infoRow}>
                    <Text size={200} weight="semibold" className={styles.label}>Nome Completo</Text>
                    <Text>{userInfo.fullName}</Text>
                  </div>
                  <div className={styles.infoRow}>
                    <Text size={200} weight="semibold" className={styles.label}>User Principal Name (UPN)</Text>
                    <Text>{userInfo.userPrincipalName}</Text>
                  </div>
                  <div className={styles.infoRow}>
                    <Text size={200} weight="semibold" className={styles.label}>AAD Object Id</Text>
                    <Text font="monospace" style={{ backgroundColor: tokens.colorNeutralBackground3, padding: '4px', borderRadius: '4px' }}>
                      {userInfo.objectId}
                    </Text>
                  </div>
                </>
              ) : (
                <Text color="red">Não foi possível recuperar as informações do usuário. Verifique se o app está rodando no contexto do Power Apps.</Text>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
