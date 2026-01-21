import { useMemo } from 'react';
import { parseEnderecoCodigo } from '../../utils/inventory/enderecoParser';

export const useEnderecoValidation = (endereco: string) => {
  return useMemo(() => {
    if (!endereco) return null;
    return parseEnderecoCodigo(endereco);
  }, [endereco]);
};
