import { useState, useEffect, useCallback } from 'react';
import { getContext } from '@microsoft/power-apps/app';
import { 
  SystemusersService, 
  RolesService, 
  SystemuserrolescollectionService 
} from '../generated';

export interface UserRole {
  roleId: string;
  name: string;
}

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obter contexto do usuário logado
      const context = await getContext();
      const aadObjectId = context.user.objectId;

      if (!aadObjectId) {
        throw new Error('AAD Object ID não encontrado no contexto.');
      }

      // 2. Buscar o systemuserid no Dataverse
      const userResult = await SystemusersService.getAll({
        filter: `azureactivedirectoryobjectid eq '${aadObjectId}'`,
        select: ['systemuserid']
      });

      if (!userResult.data || userResult.data.length === 0) {
        throw new Error('Usuário não encontrado no Dataverse (não provisionado).');
      }

      const systemUserId = userResult.data[0].systemuserid;

      // 3. Buscar os vínculos usuário <-> role
      const userRolesResult = await SystemuserrolescollectionService.getAll({
        filter: `systemuserid eq '${systemUserId}'`,
        select: ['roleid']
      });

      if (!userRolesResult || !userRolesResult.data || userRolesResult.data.length === 0) {
        
        // Tentar buscar via RolesService se houver algum campo de lookup invertido (improvável em M2M)
        // Mas vamos apenas logar por enquanto.
        setRoles([]);
        setLoading(false);
        return;
      }

      const roleIds = userRolesResult.data.map(ur => ur.roleid);

      // 4. Buscar detalhes das roles (nomes)
      const rolesFilter = roleIds.map(id => `roleid eq '${id}'`).join(' or ');

      const rolesDetailsResult = await RolesService.getAll({
        filter: rolesFilter,
        select: ['roleid', 'name']
      });

      if (rolesDetailsResult.data) {
        const mappedRoles = rolesDetailsResult.data.map(r => ({
          roleId: r.roleid,
          name: r.name
        }));
        // Ordenar por nome
        mappedRoles.sort((a, b) => a.name.localeCompare(b.name));
        setRoles(mappedRoles);
      } else {
        setRoles([]);
      }

    } catch (err: any) {
      console.error('Erro ao buscar roles do usuário:', err);
      setError(err.message || 'Erro desconhecido ao carregar roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, error, refresh: fetchRoles };
}
