import { Switch, tokens } from '@fluentui/react-components';
import { WeatherMoon24Regular, WeatherSunny24Regular } from '@fluentui/react-icons';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <WeatherSunny24Regular style={{ color: tokens.colorNeutralForeground3 }} />
      <Switch
        checked={isDark}
        onChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
      <WeatherMoon24Regular style={{ color: tokens.colorNeutralForeground3 }} />
    </div>
  );
}
