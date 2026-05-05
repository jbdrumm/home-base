import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Sun, Moon, Cloud, CloudRain, CloudSnow, Wind, Zap, RefreshCw } from 'lucide-react';
import styles from './Header.module.css';

const WEATHER_ICONS = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: Zap,
  default: Wind,
};

export default function Header({ weather, onThemeToggle, theme }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const WeatherIcon = weather
    ? (WEATHER_ICONS[weather.weather?.[0]?.main] || WEATHER_ICONS.default)
    : null;

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.logo}>Home Base</div>
        <div className={styles.greeting}>{greeting}</div>
      </div>

      <div className={styles.center}>
        <div className={styles.time}>{format(now, 'h:mm')}<span className={styles.ampm}>{format(now, 'a')}</span></div>
        <div className={styles.date}>{format(now, 'EEEE, MMMM d')}</div>
      </div>

      <div className={styles.right}>
        {weather && WeatherIcon && (
          <div className={styles.weather}>
            <WeatherIcon size={18} strokeWidth={1.5} />
            <span className={styles.temp}>{Math.round(weather.main.temp)}°</span>
            <span className={styles.weatherDesc}>{weather.weather[0].description}</span>
          </div>
        )}
        <button
          className={styles.themeBtn}
          onClick={onThemeToggle}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
