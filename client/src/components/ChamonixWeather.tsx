// Compact live weather widget for Chamonix-Mont-Blanc
// Uses Open-Meteo free API (no key required)
import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer } from "lucide-react";
import { useUnits } from "@/contexts/UnitContext";

interface WeatherData {
  tempC: number;
  feelsLikeC: number;
  windKph: number;
  humidity: number;
  weatherCode: number;
  isDay: boolean;
}

// WMO weather codes → icon + label
function getWeatherInfo(code: number, isDay: boolean): { icon: React.ReactNode; label: string } {
  const iconClass = "w-5 h-5";
  if (code === 0) return { icon: <Sun className={`${iconClass} text-amber-400`} />, label: "Clear" };
  if (code <= 3) return { icon: <Cloud className={`${iconClass} text-gray-400`} />, label: code === 1 ? "Mostly Clear" : code === 2 ? "Partly Cloudy" : "Overcast" };
  if (code <= 49) return { icon: <Cloud className={`${iconClass} text-gray-500`} />, label: "Foggy" };
  if (code <= 59) return { icon: <CloudRain className={`${iconClass} text-blue-400`} />, label: "Drizzle" };
  if (code <= 69) return { icon: <CloudRain className={`${iconClass} text-blue-500`} />, label: "Rain" };
  if (code <= 79) return { icon: <CloudSnow className={`${iconClass} text-blue-200`} />, label: "Snow" };
  if (code <= 84) return { icon: <CloudRain className={`${iconClass} text-blue-600`} />, label: "Rain Showers" };
  if (code <= 86) return { icon: <CloudSnow className={`${iconClass} text-blue-300`} />, label: "Snow Showers" };
  if (code <= 99) return { icon: <CloudLightning className={`${iconClass} text-amber-400`} />, label: "Thunderstorm" };
  return { icon: <Cloud className={`${iconClass} text-gray-400`} />, label: "Unknown" };
}

export default function ChamonixWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);
  const u = useUnits();

  useEffect(() => {
    const controller = new AbortController();
    // Chamonix-Mont-Blanc: 45.9237° N, 6.8694° E
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=45.9237&longitude=6.8694&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=Europe/Paris",
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current) {
          setWeather({
            tempC: data.current.temperature_2m,
            feelsLikeC: data.current.apparent_temperature,
            windKph: data.current.wind_speed_10m,
            humidity: data.current.relative_humidity_2m,
            weatherCode: data.current.weather_code,
            isDay: data.current.is_day === 1,
          });
        }
      })
      .catch(() => setError(true));
    return () => controller.abort();
  }, []);

  if (error || !weather) {
    // Fallback: show static average
    return (
      <div className="border border-border p-3 bg-card flex items-center gap-3">
        <Sun className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-mono">Chamonix</div>
          <div className="text-xs font-mono text-[var(--muted-foreground)]">
            {error ? "Offline" : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  const { icon, label } = getWeatherInfo(weather.weatherCode, weather.isDay);
  const tempF = Math.round(weather.tempC * 9 / 5 + 32);
  const feelsF = Math.round(weather.feelsLikeC * 9 / 5 + 32);
  const windMph = Math.round(weather.windKph * 0.621371);

  return (
    <div className="border border-border p-3 bg-card">
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)] font-mono">Chamonix Now</span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-lg font-bold text-foreground leading-none">
              {u.isMetric ? `${Math.round(weather.tempC)}°C` : `${tempF}°F`}
            </span>
            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{label}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <Thermometer className="w-3 h-3" />
          Feels {u.isMetric ? `${Math.round(weather.feelsLikeC)}°C` : `${feelsF}°F`}
        </span>
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          {u.isMetric ? `${Math.round(weather.windKph)} km/h` : `${windMph} mph`}
        </span>
        <span className="flex items-center gap-1">
          <Droplets className="w-3 h-3" />
          {weather.humidity}%
        </span>
      </div>
    </div>
  );
}
