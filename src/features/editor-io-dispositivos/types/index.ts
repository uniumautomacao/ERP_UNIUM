export interface DeviceIOTemplate {
  Dimensions: Dimensions;
  RackCategory: string;
  Connections: Connection[];
}

export interface Dimensions {
  Width: number;
  H: number;
  Depth: number;
}

export interface Connection {
  Name: string;
  Type: string;
  Direction: string;
}

export interface ConnectionTypeOption {
  value: number;
  label: string;
}

export interface ConnectionDirectionOption {
  value: number;
  label: string;
}

export interface Product {
  cr22f_modelosdeprodutofromsharepointlistid: string;
  cr22f_title: string;
  cr22f_queryfabricante: string;
  new_deviceiotemplatejson: string | null;
  new_nomedofabricante?: string;
}

export interface Manufacturer {
  cr22f_fabricantesfromsharpointlistid: string;
  cr22f_title: string;
}

export interface EditorState {
  selectedManufacturer: string | null;
  selectedProduct: Product | null;
  template: DeviceIOTemplate | null;
  isDirty: boolean;
  editingConnectionIndex: number | null;
}
