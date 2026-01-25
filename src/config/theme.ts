import {
  BrandVariants,
  createLightTheme,
  createDarkTheme,
  Theme,
} from '@fluentui/react-components';

// Customização da cor primária para match com Power Apps
export const powerAppsBrand: BrandVariants = {
  10: '#020305',
  20: '#101823',
  30: '#16263D',
  40: '#1A3352',
  50: '#1D4168',
  60: '#1F4F7E',
  70: '#215E95',
  80: '#0078D4',  // Cor principal Power Apps
  90: '#2899F5',
  100: '#4BA6F7',
  110: '#6AB4F8',
  120: '#88C2FA',
  130: '#A5D0FB',
  140: '#C2DDFC',
  150: '#DFEBFD',
  160: '#F5F9FE',
};

// Criar temas customizados
export const lightTheme: Theme = {
  ...createLightTheme(powerAppsBrand),
};

export const darkTheme: Theme = {
  ...createDarkTheme(powerAppsBrand),
};

// Ajustes específicos para parecer com Power Apps
lightTheme.colorNeutralBackground1 = '#FFFFFF';
lightTheme.colorNeutralBackground2 = '#F3F2F1';
lightTheme.colorNeutralBackground3 = '#EDEBE9';

darkTheme.colorNeutralBackground1 = '#292827';
darkTheme.colorNeutralBackground2 = '#1B1A19';
darkTheme.colorNeutralBackground3 = '#323130';

// Constantes de layout
export const LAYOUT = {
  sidebar: {
    expandedWidth: 280,
    collapsedWidth: 48,
  },
  header: {
    height: 36,
  },
  commandBar: {
    height: 40,
  },
  pageHeader: {
    height: 60,
  },
} as const;

// Breakpoints
export const BREAKPOINTS = {
  mobile: 0,      // 0-767px
  tablet: 768,    // 768-1023px
  desktop: 1024,  // 1024-1279px
  wide: 1280,     // 1280px+
} as const;
