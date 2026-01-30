import { useCallback, useEffect, useState } from 'react';
import { getContext } from '@microsoft/power-apps/app';
import { SystemusersService } from '../generated';

interface CurrentSystemUserState {
  systemUserId?: string;
  fullName?: string;
  email?: string;
  loading: boolean;
  error?: string;
}

export function useCurrentSystemUser() {
  const [state, setState] = useState<CurrentSystemUserState>({
    loading: true,
  });

  const loadUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const context = await getContext();
      const aadObjectId = context.user.objectId;
      if (!aadObjectId) {
        throw new Error('AAD Object ID não encontrado no contexto.');
      }

      const result = await SystemusersService.getAll({
        filter: `azureactivedirectoryobjectid eq '${aadObjectId}'`,
      select: ['systemuserid', 'fullname', 'internalemailaddress'],
      });

      if (!result.data || result.data.length === 0) {
        throw new Error('Usuário não encontrado no Dataverse (não provisionado).');
      }

      const user = result.data[0];

      setState({
        systemUserId: user.systemuserid,
        fullName: user.fullname,
      email: user.internalemailaddress,
        loading: false,
      });
    } catch (err: any) {
      console.error('[useCurrentSystemUser] erro:', err);
      setState({
        loading: false,
        error: err.message || 'Erro ao carregar usuário atual.',
      });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return { ...state, refresh: loadUser };
}
