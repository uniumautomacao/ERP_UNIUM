export interface RmaCardData {
  id: string;
  codigo?: string | null;
  stageValue?: number;
  position?: number | null;
  descricao?: string | null;
  observacoes?: string | null;
  lembreteExpirado?: boolean;
  sinalizar?: boolean;
  dataLembrete?: string | null;
  clienteInformado?: boolean;
  ultimoEstagioInformado?: number | null;
  nomeClienteFx?: string | null;
  projetoApelidoFx?: string | null;
  assistenciaTecnica?: string | null;
  codigoRastreio?: string | null;
  tipoRma?: number | null;
}
