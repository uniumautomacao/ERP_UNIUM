import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  Card,
  makeStyles,
  tokens,
  Spinner,
  Input,
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  createTableColumn,
  TableColumnDefinition,
  Badge,
} from '@fluentui/react-components';
import { 
  PeopleSettings24Regular, 
  Search24Regular,
  Person24Regular,
  ShieldLock24Regular
} from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { 
  SystemusersService, 
  SystemuserrolescollectionService, 
  RolesService 
} from '../../generated';
import type { Systemusers } from '../../generated/models/SystemusersModel';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  resultsLayout: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: tokens.spacingHorizontalL,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    }
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '600px',
    overflowY: 'auto',
    padding: '4px',
  },
  userItem: {
    cursor: 'pointer',
    padding: tokens.spacingVerticalS,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  userItemSelected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    borderLeft: `4px solid ${tokens.colorCompoundBrandStroke}`,
  },
  detailsCard: {
    height: 'fit-content',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  roleBadge: {
    fontFamily: 'monospace',
    fontSize: '10px',
  }
});

interface UserRoleInfo {
  roleId: string;
  name: string;
}

export function SuperAdminUserRolesPage() {
  const styles = useStyles();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<Systemusers[]>([]);
  const [selectedUser, setSelectedUser] = useState<Systemusers | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const searchUsers = useCallback(async (term: string) => {
    setLoadingUsers(true);
    try {
      const filter = term 
        ? `isdisabled eq false and (contains(fullname, '${term}') or contains(internalemailaddress, '${term}'))`
        : 'isdisabled eq false';
        
      const result = await SystemusersService.getAll({
        filter,
        select: ['fullname', 'internalemailaddress', 'systemuserid', 'azureactivedirectoryobjectid'],
        orderBy: ['fullname asc'],
        top: 20
      });
      setUsers(result.data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchUserRoles = async (userId: string) => {
    setLoadingRoles(true);
    setUserRoles([]);
    try {
      // 1. Buscar IDs das roles do usuário
      const userRolesResult = await SystemuserrolescollectionService.getAll({
        filter: `systemuserid eq '${userId}'`,
        select: ['roleid']
      });

      if (!userRolesResult.data || userRolesResult.data.length === 0) {
        setUserRoles([]);
        return;
      }

      const roleIds = userRolesResult.data.map(ur => ur.roleid);
      
      // 2. Buscar nomes das roles
      // Divide em lotes de 10 para evitar URLs muito longas no filtro OData
      const batchSize = 10;
      const allRoleDetails: UserRoleInfo[] = [];

      for (let i = 0; i < roleIds.length; i += batchSize) {
        const batch = roleIds.slice(i, i + batchSize);
        const filter = batch.map(id => `roleid eq '${id}'`).join(' or ');
        const result = await RolesService.getAll({
          filter,
          select: ['roleid', 'name']
        });
        if (result.data) {
          allRoleDetails.push(...result.data.map(r => ({ roleId: r.roleid, name: r.name })));
        }
      }

      allRoleDetails.sort((a, b) => a.name.localeCompare(b.name));
      setUserRoles(allRoleDetails);
    } catch (error) {
      console.error('Erro ao buscar roles do usuário:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    searchUsers('');
  }, [searchUsers]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm === '') {
        searchUsers(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchUsers]);

  const handleUserSelect = (user: Systemusers) => {
    setSelectedUser(user);
    fetchUserRoles(user.systemuserid);
  };

  const roleColumns: TableColumnDefinition<UserRoleInfo>[] = [
    createTableColumn<UserRoleInfo>({
      columnId: 'name',
      renderHeaderCell: () => 'Nome da Role',
      renderCell: (role) => <Text weight="semibold">{role.name}</Text>,
    }),
    createTableColumn<UserRoleInfo>({
      columnId: 'id',
      renderHeaderCell: () => 'GUID',
      renderCell: (role) => (
        <Text font="monospace" size={100} color={tokens.colorNeutralForeground4}>
          {role.roleId}
        </Text>
      ),
    }),
  ];

  return (
    <>
      <CommandBar primaryActions={[]} />
      <PageHeader
        title="Roles por Usuário"
        subtitle="Visualize quais Security Roles estão atribuídas a cada usuário no Dataverse"
      />
      <PageContainer>
        <div className={styles.container}>
          <div className={styles.resultsLayout}>
            {/* Coluna da Esquerda: Busca e Lista de Usuários */}
            <Card>
              <div className={styles.searchSection}>
                <Text weight="semibold">Buscar Usuário</Text>
                <Input
                  contentBefore={<Search24Regular />}
                  placeholder="Nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loadingUsers ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="small" label="Buscando usuários..." />
                </div>
              ) : (
                <div className={styles.userList}>
                  {users.map(user => (
                    <div 
                      key={user.systemuserid} 
                      className={`${styles.userItem} ${selectedUser?.systemuserid === user.systemuserid ? styles.userItemSelected : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-2">
                        <Person24Regular />
                        <div className="flex flex-col">
                          <Text weight="semibold">{user.fullname}</Text>
                          <Text size={200} color={tokens.colorNeutralForeground4}>{user.internalemailaddress}</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && !loadingUsers && (
                    <div className="p-4 text-center">
                      <Text italic color={tokens.colorNeutralForeground4}>Nenhum usuário encontrado.</Text>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Coluna da Direita: Detalhes e Roles */}
            <Card className={styles.detailsCard}>
              {selectedUser ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b pb-4 mb-2">
                    <div className="flex items-center gap-3">
                      <div style={{ padding: '8px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '50%' }}>
                        <Person24Regular fontSize={32} />
                      </div>
                      <div className="flex flex-col">
                        <Text size={500} weight="bold">{selectedUser.fullname}</Text>
                        <Text size={300}>{selectedUser.internalemailaddress}</Text>
                      </div>
                    </div>
                    <Badge appearance="outline" color="brand">
                      ID: {selectedUser.systemuserid.substring(0, 8)}...
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldLock24Regular />
                      <Text weight="semibold">Security Roles Atribuídas</Text>
                    </div>

                    {loadingRoles ? (
                      <div className={styles.loadingContainer}>
                        <Spinner label="Carregando roles do usuário..." />
                      </div>
                    ) : userRoles.length > 0 ? (
                      <DataGrid
                        items={userRoles}
                        columns={roleColumns}
                        getRowId={(item) => item.roleId}
                      >
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (
                              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                            )}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<UserRoleInfo>>
                          {({ item, rowId }) => (
                            <DataGridRow key={rowId}>
                              {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                              )}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    ) : (
                      <div className="p-8 text-center border-dashed border-2 rounded-lg">
                        <Text italic color={tokens.colorNeutralForeground4}>
                          Este usuário não possui nenhuma role atribuída diretamente no Dataverse.
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-30">
                  <PeopleSettings24Regular style={{ fontSize: '64px' }} />
                  <Text size={400} align="center">
                    Selecione um usuário na lista ao lado para ver suas security roles.
                  </Text>
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
};
