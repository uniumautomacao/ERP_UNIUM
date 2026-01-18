import type {
  DeviceIOConnectionDirectionOption,
  DeviceIOConnectionTypeOption,
} from '../../types';

export const connectionTypeOptions: DeviceIOConnectionTypeOption[] = [
  { value: 100000000, label: 'HDMI' },
  { value: 100000001, label: 'Audio Analogico' },
  { value: 100000002, label: 'Toslink' },
  { value: 100000003, label: 'Trigger 12V' },
  { value: 100000004, label: 'Speaker' },
  { value: 100000005, label: 'Ethernet' },
  { value: 100000006, label: 'IR' },
  { value: 100000007, label: 'Serial' },
  { value: 100000008, label: 'RF' },
  { value: 100000009, label: 'RNET' },
  { value: 100000010, label: 'ACNET' },
  { value: 100000011, label: 'PNET' },
  { value: 100000012, label: 'Luz ON/OFF' },
  { value: 100000013, label: 'Luz Triac Dimmer' },
  { value: 100000014, label: 'Luz PWM Dimmer' },
  { value: 100000015, label: 'Motor' },
  { value: 100000016, label: 'GPIO' },
  { value: 100000017, label: 'Power 110V' },
  { value: 100000018, label: 'Power 220V' },
  { value: 100000019, label: 'Aspiracao' },
  { value: 100000020, label: 'Controle de Acesso' },
];

export const connectionDirectionOptions: DeviceIOConnectionDirectionOption[] = [
  { value: 100000000, label: 'Input' },
  { value: 100000001, label: 'Output' },
  { value: 100000002, label: 'Bidirectional' },
  { value: 100000003, label: 'Bus' },
];
