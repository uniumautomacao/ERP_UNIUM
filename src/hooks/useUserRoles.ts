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
      console.log('[useUserRoles] Contexto obtido:', { 
        fullName: context.user.fullName, 
        aadObjectId 
      });

      if (!aadObjectId) {
        throw new Error('AAD Object ID não encontrado no contexto.');
      }

      // 2. Buscar o systemuserid no Dataverse
      console.log(`[useUserRoles] Buscando systemuserid para AAD Object ID: ${aadObjectId}...`);
      const userResult = await SystemusersService.getAll({
        filter: `azureactivedirectoryobjectid eq '${aadObjectId}'`,
        select: ['systemuserid']
      });

      if (!userResult.data || userResult.data.length === 0) {
        console.warn('[useUserRoles] Nenhum usuário encontrado para este AAD Object ID.');
        throw new Error('Usuário não encontrado no Dataverse (não provisionado).');
      }

      const systemUserId = userResult.data[0].systemuserid;
      console.log(`[useUserRoles] systemuserid encontrado: ${systemUserId}`);

      // 3. Buscar os vínculos usuário <-> role
      console.log(`[useUserRoles] Buscando vínculos em systemuserrolescollection para systemuserid: ${systemUserId}...`);
      const userRolesResult = await SystemuserrolescollectionService.getAll({
        filter: `systemuserid eq '${systemUserId}'`,
        select: ['roleid']
      });

      console.log(`[useUserRoles] Resultado completo de systemuserrolescollection:`, userRolesResult);

      if (!userRolesResult || !userRolesResult.data || userRolesResult.data.length === 0) {
        console.info('[useUserRoles] O usuário não possui nenhuma role vinculada na tabela systemuserrolescollection.');
        
        // Tentar buscar via RolesService se houver algum campo de lookup invertido (improvável em M2M)
        // Mas vamos apenas logar por enquanto.
        setRoles([]);
        setLoading(false);
        return;
      }

      const roleIds = userRolesResult.data.map(ur => ur.roleid);
      console.log(`[useUserRoles] IDs de roles encontrados:`, roleIds);

      // 4. Buscar detalhes das roles (nomes)
      const rolesFilter = roleIds.map(id => `roleid eq '${id}'`).join(' or ');
      console.log(`[useUserRoles] Buscando detalhes das roles com filtro: ${rolesFilter}`);
      
      const rolesDetailsResult = await RolesService.getAll({
        filter: rolesFilter,
        select: ['roleid', 'name']
      });

      console.log(`[useUserRoles] Detalhes das roles obtidos:`, rolesDetailsResult.data);

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
