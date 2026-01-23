export interface GuiaProjeto {
  cr22f_projetoid: string;
  cr22f_apelido?: string | null;
  cr22f_ano?: string | null;
  new_datadeconclusaodoguiadeconexoes?: string | null;
}

export interface GuiaDeviceIO {
  new_deviceioid: string;
  new_name?: string | null;
  new_localizacao?: string | null;
  new_serainstaladobase?: boolean | null;
  new_serainstalado?: boolean | null;
  new_externalid?: string | null;
  _new_modelodeproduto_value?: string | null;
  _new_produto_value?: string | null;
  _new_projeto_value?: string | null;
}

export interface GuiaDeviceIOConnection {
  new_deviceioconnectionid: string;
  new_name?: string | null;
  new_displayname?: string | null;
  new_direcao?: number | null;
  new_direcaorawtext?: string | null;
  new_tipodeconexao?: number | null;
  new_tipodeconexaorawtext?: string | null;
  new_tipodesistema?: string | null;
  new_localizacao?: string | null;
  new_templatejson?: string | null;
  new_connectedtomanual?: string | null;
  _new_device_value?: string | null;
  _new_connectedto_value?: string | null;
  _new_projeto_value?: string | null;
}

export interface GuiaProdutoServico {
  new_produtoservicoid: string;
  new_name?: string | null;
  new_localizacao?: string | null;
  new_quantidade?: number | null;
  new_disponivelparavinculo?: boolean | null;
  new_tipodesistemacontabilizadoos?: number | null;
  _new_modelodeprodutooriginal_value?: string | null;
  _new_produto_value?: string | null;
  _new_projeto_value?: string | null;
}

export interface GuiaModeloProduto {
  cr22f_modelosdeprodutofromsharepointlistid: string;
  cr22f_title?: string | null;
  new_deviceiotemplatejson?: string | null;
  new_tipodesistemapadrao?: number | null;
  new_omitirdoguiadeconexoes?: boolean | null;
  new_controlaetiqueta?: boolean | null;
  new_controlasn?: boolean | null;
  new_nomedofabricante?: string | null;
}

export interface GuiaConexoesData {
  devices: GuiaDeviceIO[];
  connections: GuiaDeviceIOConnection[];
  produtos: GuiaProdutoServico[];
  modelos: GuiaModeloProduto[];
}
