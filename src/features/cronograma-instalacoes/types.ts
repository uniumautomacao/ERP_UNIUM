export type TipoServicoFiltro = 'todos' | 'cabeamento' | 'instalacao';

export type StatusProgramacao =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

export type TipoComentario = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CronogramaOS {
  id: string;
  name: string;
  projetoapelido: string;
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

export interface UsuarioBasico {
  id: string;
  nome: string;
  email: string;
}

export interface FiltrosCronograma {
  ano: number;
  tipoServico: TipoServicoFiltro;
  searchTerm: string;
}

