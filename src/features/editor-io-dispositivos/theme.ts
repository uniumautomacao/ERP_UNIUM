import { createLightTheme, type BrandVariants } from '@fluentui/react-components';

// PowerApps Model-Driven App brand colors
const powerAppsBrand: BrandVariants = {
  10: '#060F1F',
  20: '#0C1E3D',
  30: '#132C5A',
  40: '#193B78',
  50: '#1F4A96',
  60: '#0078D4', // Primary Microsoft Blue
  70: '#2B88D8',
  80: '#4A9FDD',
  90: '#69B6E3',
  100: '#88CEE9',
  110: '#A7E5EF',
  120: '#C6FDF5',
  130: '#E5FFFA',
  140: '#F0FFFD',
  150: '#F8FFFE',
  160: '#FCFFFF',
};

export const powerAppsTheme = createLightTheme(powerAppsBrand);

// Additional tokens to match PowerApps Model-Driven design
export const customTokens = {
  colorBrandBackground: '#0078D4',
  colorBrandBackgroundHover: '#106EBE',
  colorBrandBackgroundPressed: '#005A9E',
  colorNeutralBackground1: '#FFFFFF',
  colorNeutralBackground2: '#F3F2F1',
  colorNeutralBackground3: '#EDEBE9',
  colorNeutralForeground1: '#323130',
  colorNeutralForeground2: '#605E5C',
  colorNeutralForeground3: '#797673',
  colorNeutralStroke1: '#EDEBE9',
  colorNeutralStroke2: '#E1DFDD',
  colorStatusSuccessForeground1: '#107C10',
  colorStatusWarningForeground1: '#797673',
  colorStatusDangerForeground1: '#D13438',
};

// Merge custom tokens into the theme
export const theme = {
  ...powerAppsTheme,
  ...customTokens,
};
