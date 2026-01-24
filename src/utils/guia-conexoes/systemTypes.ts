export const SISTEMA_TIPO_OPTIONS = [
  { value: 100000000, label: 'Automação' },
  { value: 100000001, label: 'Áudio' },
  { value: 100000002, label: 'Vídeo' },
  { value: 100000003, label: 'Aspiração Central' },
  { value: 100000004, label: 'Redes' },
  { value: 100000005, label: 'CFTV' },
  { value: 100000006, label: 'Acústica' },
  { value: 100000007, label: 'Cabos' },
  { value: 100000008, label: 'Controle de Acesso' },
  { value: 100000009, label: 'Acabamentos Elétricos' },
  { value: 100000010, label: 'Eletrodomésticos' },
  { value: 100000011, label: 'Infraestrutura' },
];

export const SISTEMA_TIPO_LABELS = new Map(
  SISTEMA_TIPO_OPTIONS.map((option) => [option.value, option.label])
);

export const SISTEMA_TIPOS_EXCLUIDOS_PENDENCIA = [
  100000007,
  100000009,
  100000010,
];
