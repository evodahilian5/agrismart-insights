const API_KEY = '0c93ef236152ff403b47b5cd5b1d7a0c';
const BASE = 'https://api.openweathermap.org/data/2.5';

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  description: string;
  icon: string;
  rain_1h: number;
  visibility: number;
  uvi: number;
}

export interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  humidity: number;
  rain: number;
  wind_speed: number;
  description: string;
  icon: string;
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const resp = await fetch(`${BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`);
  if (!resp.ok) throw new Error(`Weather API error: ${resp.status}`);
  const d = await resp.json();
  return {
    temp: d.main.temp,
    feels_like: d.main.feels_like,
    humidity: d.main.humidity,
    pressure: d.main.pressure,
    wind_speed: d.wind.speed,
    wind_deg: d.wind.deg,
    clouds: d.clouds.all,
    description: d.weather[0].description,
    icon: d.weather[0].icon,
    rain_1h: d.rain?.['1h'] ?? 0,
    visibility: d.visibility / 1000,
    uvi: 0,
  };
}

export async function fetchForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  const resp = await fetch(`${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`);
  if (!resp.ok) throw new Error(`Forecast API error: ${resp.status}`);
  const d = await resp.json();

  const grouped: Record<string, any[]> = {};
  d.list.forEach((item: any) => {
    const date = item.dt_txt.split(' ')[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });

  return Object.entries(grouped).slice(0, 7).map(([date, items]) => ({
    date,
    temp_min: Math.round(Math.min(...items.map((i: any) => i.main.temp_min)) * 10) / 10,
    temp_max: Math.round(Math.max(...items.map((i: any) => i.main.temp_max)) * 10) / 10,
    humidity: Math.round(items.reduce((s: number, i: any) => s + i.main.humidity, 0) / items.length),
    rain: Math.round(items.reduce((s: number, i: any) => s + (i.rain?.['3h'] ?? 0), 0) * 10) / 10,
    wind_speed: Math.round(items.reduce((s: number, i: any) => s + i.wind.speed, 0) / items.length * 10) / 10,
    description: items[Math.floor(items.length / 2)].weather[0].description,
    icon: items[Math.floor(items.length / 2)].weather[0].icon,
  }));
}

export function estimateAnnualRainfall(forecastDays: ForecastDay[]): number {
  const avgDaily = forecastDays.reduce((s, d) => s + d.rain, 0) / forecastDays.length;
  return Math.round(avgDaily * 365);
}
