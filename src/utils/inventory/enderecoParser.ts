import type { EnderecoParseResult } from '../../types';

const CENTRO_DISTRIBUICAO_MAP: Record<string, number> = {
  U1: 100000000,
};

const DEPOSITO_MAP: Record<string, number> = {
  A: 100000000,
  B: 100000001,
  C: 100000002,
  D: 100000003,
  E: 100000004,
  F: 100000005,
  G: 100000006,
  H: 100000007,
  I: 100000008,
};

const RUA_MAP: Record<string, number> = {
  '01': 100000000,
  '02': 100000001,
  '03': 100000002,
  '04': 100000003,
  '05': 100000004,
  '06': 100000005,
  '07': 100000006,
  '08': 100000007,
  '09': 100000008,
  '10': 100000009,
};

const ESTANTE_MAP: Record<string, number> = {
  E0: 100000000,
  E1: 100000001,
  E2: 100000002,
  E3: 100000003,
  E4: 100000004,
  E5: 100000005,
  E6: 100000006,
  E7: 100000007,
  E8: 100000008,
  E9: 100000009,
  E10: 100000010,
};

const PRATELEIRA_MAP: Record<string, number> = {
  P0: 100000000,
  P1: 100000001,
  P2: 100000002,
  P3: 100000003,
  P4: 100000004,
  P5: 100000005,
  P6: 100000006,
  P7: 100000007,
  P8: 100000008,
  P9: 100000009,
  P10: 100000010,
};

export const parseEnderecoCodigo = (raw: string): EnderecoParseResult => {
  const codigo = raw.trim();
  if (!codigo) {
    return { valido: false, erro: 'Endereço vazio.' };
  }

  const parts = codigo.split('-').map((part) => part.trim());
  if (parts.length !== 5) {
    return { valido: false, erro: 'Formato inválido. Use CD-DEP-RUA-EST-PRAT.' };
  }

  const [centro, deposito, rua, estante, prateleira] = parts;
  const endereco = {
    centroDistribuicao: CENTRO_DISTRIBUICAO_MAP[centro],
    deposito: DEPOSITO_MAP[deposito],
    rua: RUA_MAP[rua],
    estante: ESTANTE_MAP[estante],
    prateleira: PRATELEIRA_MAP[prateleira],
  };

  if (Object.values(endereco).some((value) => value === undefined)) {
    return { valido: false, erro: 'Endereço não corresponde às opções válidas.' };
  }

  const reconstruido = `${centro}-${deposito}-${rua}-${estante}-${prateleira}`;
  if (reconstruido !== codigo) {
    return { valido: false, erro: 'Código divergente do endereço montado.' };
  }

  return { valido: true, codigo: reconstruido, endereco };
};
