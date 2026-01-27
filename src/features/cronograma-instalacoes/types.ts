export type TipoServicoFiltro = 'todos' | 'cabeamento' | 'instalacao';

export type StatusProgramacao =
  | 100000000
  | 100000001
  | 100000002
  | 100000003
  | 100000004
  | 100000005
  | 100000006
  | 100000007
  | 100000008
  | 100000009;

export type TipoComentario =
  | 100000000
  | 100000001
  | 100000002
  | 100000003
  | 100000004
  | 100000005
  | 100000006
  | 100000007;

export interface CronogramaOS {
  id: string;
  name: string;
  projetoapelido: string | null;
  cliente: string;
  tipodeservico: 'Instalação' | 'Cabeamento';
  tiposdesistematexto?: string | null;
  datadaproximaatividade: string | null;
  statusdaprogramacao: StatusProgramacao;
  dataCriacao?: string;
  datadaultimaconfirmacao?: string | null;
  confirmacao60d?: boolean;
  confirmacao30d?: boolean;
  confirmacao15d?: boolean;
  datadaultimatentativadecontato?: string | null;
  contagemtentativascontato?: number;
  ultimaPrevisaoConhecida?: string | null;
}

export interface ComentarioOS {
  id: string;
  ordemdeservico: string;
  tipodecomentario: TipoComentario;
  comentario: string;
  usuario: string;
  datetime: string;
}

export interface ComentarioHistorico extends ComentarioOS {
  osLabel?: string;
  createdOn?: string;
}

export interface UsuarioBasico {
  id: string;
  nome: string;
  email: string;
}

export interface MonthStats {
  total: number;
  porTipo: {
    instalacao: number;
    cabeamento: number;
  };
  porStatus: {
    pendentes: number;
    confirmadas: number;
    semResposta: number;
  };
}

export interface FiltrosCronograma {
  ano: number;
  tipoServico: TipoServicoFiltro;
  searchTerm: string;
}

