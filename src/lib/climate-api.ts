// Open-Meteo ERA5 Archive API for climate normals + Nominatim geocoding
// Sources: ERA5 reanalysis (ECMWF/Copernicus), OpenStreetMap Nominatim

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

export interface ClimateData {
  annualRainfall: number;
  monthlyRain: number[];
  monthlyETP: number[];
  waterBalance: number[];
  deficitMonths: number;
  wetMonths: number;
  annualTemp: number;
  correctedTemp: number;
  coldestMonthTemp: number;
  hottestMonthTemp: number;
  annualHumidity: number;
  annualSolarRadiation: number;
  altitude: number;
  monthlyTemp: number[];
  isFallback: boolean;
}

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  distanceToCoast: number;
  currency: string;
  currencySymbol: string;
  currencyRate: number;
}

const CURRENCY_MAP: Record<string, { currency: string; symbol: string; rate: number }> = {
  // Afrique de l'Ouest — Zone FCFA (BCEAO) — Taux fixe 1 USD ≈ 655 FCFA (parité EUR)
  SN: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  ML: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  NE: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  BF: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  TG: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  BJ: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  CI: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  GW: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  // Afrique Centrale — Zone FCFA (BEAC)
  CM: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  TD: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  CF: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  GA: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  CG: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  GQ: { currency: 'FCFA', symbol: 'FCFA', rate: 655 },
  // Afrique de l'Ouest — Monnaies propres
  GH: { currency: 'GHS', symbol: 'GH₵', rate: 15.5 },
  NG: { currency: 'NGN', symbol: '₦', rate: 1600 },
  GN: { currency: 'GNF', symbol: 'GNF', rate: 8600 },
  SL: { currency: 'SLE', symbol: 'Le', rate: 22.5 },
  LR: { currency: 'LRD', symbol: 'L$', rate: 192 },
  GM: { currency: 'GMD', symbol: 'D', rate: 68 },
  CV: { currency: 'CVE', symbol: '$', rate: 110 },
  // Afrique du Nord
  MA: { currency: 'MAD', symbol: 'MAD', rate: 10.2 },
  DZ: { currency: 'DZD', symbol: 'DA', rate: 135 },
  TN: { currency: 'TND', symbol: 'DT', rate: 3.15 },
  EG: { currency: 'EGP', symbol: 'E£', rate: 50 },
  LY: { currency: 'LYD', symbol: 'LD', rate: 4.85 },
  // Afrique de l'Est
  KE: { currency: 'KES', symbol: 'KSh', rate: 155 },
  TZ: { currency: 'TZS', symbol: 'TSh', rate: 2650 },
  UG: { currency: 'UGX', symbol: 'USh', rate: 3800 },
  ET: { currency: 'ETB', symbol: 'Br', rate: 57 },
  RW: { currency: 'RWF', symbol: 'RF', rate: 1300 },
  BI: { currency: 'BIF', symbol: 'FBu', rate: 2850 },
  // Afrique Australe
  ZA: { currency: 'ZAR', symbol: 'R', rate: 18.5 },
  MZ: { currency: 'MZN', symbol: 'MT', rate: 63 },
  ZM: { currency: 'ZMW', symbol: 'ZK', rate: 27 },
  MW: { currency: 'MWK', symbol: 'MK', rate: 1700 },
  ZW: { currency: 'ZWL', symbol: 'Z$', rate: 14000 },
  // Autres
  MR: { currency: 'MRU', symbol: 'MRU', rate: 40 },
  MG: { currency: 'MGA', symbol: 'Ar', rate: 4550 },
  CD: { currency: 'CDF', symbol: 'FC', rate: 2750 },
  AO: { currency: 'AOA', symbol: 'Kz', rate: 830 },
  // Europe (pour les utilisateurs européens)
  FR: { currency: 'EUR', symbol: '€', rate: 0.92 },
  BE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  DE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  ES: { currency: 'EUR', symbol: '€', rate: 0.92 },
  PT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  IT: { currency: 'EUR', symbol: '€', rate: 0.92 },
};

const COAST_POINTS = [
  { lat: 14.7, lng: -17.5 }, { lat: 12.5, lng: -16.6 }, { lat: 11.8, lng: -15.6 },
  { lat: 9.5, lng: -13.7 }, { lat: 8.5, lng: -13.2 }, { lat: 6.3, lng: -10.8 },
  { lat: 5.3, lng: -4.0 }, { lat: 5.2, lng: -1.8 }, { lat: 5.6, lng: -0.2 },
  { lat: 6.1, lng: 1.2 }, { lat: 6.4, lng: 2.6 }, { lat: 6.4, lng: 3.4 },
  { lat: 4.0, lng: 9.2 }, { lat: 33.6, lng: -7.6 }, { lat: 35.8, lng: -5.8 },
  { lat: 34.0, lng: -6.8 }, { lat: 32.3, lng: -9.2 }, { lat: 30.4, lng: -9.6 },
];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateCoastDistance(lat: number, lon: number): number {
  return Math.min(...COAST_POINTS.map(p => haversineKm(lat, lon, p.lat, p.lng)));
}

export async function fetchClimateNormals(lat: number, lon: number): Promise<ClimateData> {
  // ERA5 archive: fetch 1991-2020 for proper 30-year climate normals
  // Split into two requests since the API may limit large ranges
  try {
    const fetchRange = async (start: string, end: string) => {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        start_date: start,
        end_date: end,
        daily: 'precipitation_sum,temperature_2m_mean,temperature_2m_min,temperature_2m_max,et0_fao_evapotranspiration,shortwave_radiation_sum',
        timezone: 'auto',
      });
      const resp = await fetch(`${ARCHIVE_URL}?${params}`);
      if (!resp.ok) throw new Error(`Archive API error: ${resp.status}`);
      return resp.json();
    };

    // Try 1991-2020 first; if it fails, fall back to 2000-2023
    let data: any;
    let yearsSpan: number;
    try {
      const [d1, d2] = await Promise.all([
        fetchRange('1991-01-01', '2005-12-31'),
        fetchRange('2006-01-01', '2020-12-31'),
      ]);
      // Merge daily arrays
      data = {
        ...d1,
        daily: {
          time: [...d1.daily.time, ...d2.daily.time],
          precipitation_sum: [...d1.daily.precipitation_sum, ...d2.daily.precipitation_sum],
          temperature_2m_mean: [...d1.daily.temperature_2m_mean, ...d2.daily.temperature_2m_mean],
          temperature_2m_min: [...d1.daily.temperature_2m_min, ...d2.daily.temperature_2m_min],
          temperature_2m_max: [...d1.daily.temperature_2m_max, ...d2.daily.temperature_2m_max],
          et0_fao_evapotranspiration: [...d1.daily.et0_fao_evapotranspiration, ...d2.daily.et0_fao_evapotranspiration],
          shortwave_radiation_sum: [...d1.daily.shortwave_radiation_sum, ...d2.daily.shortwave_radiation_sum],
        },
      };
      yearsSpan = 30;
    } catch {
      // Fallback to smaller range
      data = await fetchRange('2014-01-01', '2023-12-31');
      yearsSpan = 10;
    }

    const daily = data.daily;
    const dates = daily.time as string[];
    const precip = daily.precipitation_sum as (number | null)[];
    const tempMean = daily.temperature_2m_mean as (number | null)[];
    const et0 = daily.et0_fao_evapotranspiration as (number | null)[];
    const solar = daily.shortwave_radiation_sum as (number | null)[];

    const monthlyRainSum = new Array(12).fill(0);
    const monthlyETPSum = new Array(12).fill(0);
    const monthlyTempSum = new Array(12).fill(0);
    const monthlyTempCount = new Array(12).fill(0);
    const monthlySolarSum = new Array(12).fill(0);
    const monthlySolarCount = new Array(12).fill(0);
    // Track humidity proxy from temperature range (dew point approximation)
    let humidityEstimate = 65;

    for (let i = 0; i < dates.length; i++) {
      const month = parseInt(dates[i].substring(5, 7)) - 1;
      if (precip[i] != null) monthlyRainSum[month] += precip[i]!;
      if (et0[i] != null) monthlyETPSum[month] += et0[i]!;
      if (tempMean[i] != null) {
        monthlyTempSum[month] += tempMean[i]!;
        monthlyTempCount[month]++;
      }
      if (solar[i] != null) {
        monthlySolarSum[month] += solar[i]!;
        monthlySolarCount[month]++;
      }
    }

    const monthlyRain = monthlyRainSum.map(t => Math.round(t / yearsSpan));
    const monthlyETP = monthlyETPSum.map(t => Math.round(t / yearsSpan));
    const monthlyTemp = monthlyTempSum.map((t, i) => monthlyTempCount[i] > 0 ? Math.round(t / monthlyTempCount[i] * 10) / 10 : 25);
    const waterBalance = monthlyRain.map((r, i) => r - monthlyETP[i]);
    const deficitMonths = waterBalance.filter(b => b < 0).length;
    const wetMonths = waterBalance.filter(b => b >= 0).length;

    const altitude = data.elevation ?? 0;
    const annualTemp = monthlyTemp.reduce((s, t) => s + t, 0) / 12;
    const correctedTemp = annualTemp - (altitude * 6.5 / 1000);
    const annualRainfall = monthlyRain.reduce((s, r) => s + r, 0);
    const annualSolarRadiation = monthlySolarCount[0] > 0
      ? Math.round(monthlySolarSum.reduce((s, t) => s + t, 0) / dates.length * 100) / 100
      : 18;

    // Estimate humidity from rainfall pattern and zone
    if (annualRainfall > 1500) humidityEstimate = 82;
    else if (annualRainfall > 1000) humidityEstimate = 72;
    else if (annualRainfall > 600) humidityEstimate = 62;
    else if (annualRainfall > 300) humidityEstimate = 48;
    else humidityEstimate = 38;

    return {
      annualRainfall,
      monthlyRain,
      monthlyETP,
      waterBalance,
      deficitMonths,
      wetMonths,
      annualTemp: Math.round(annualTemp * 10) / 10,
      correctedTemp: Math.round(correctedTemp * 10) / 10,
      coldestMonthTemp: Math.min(...monthlyTemp),
      hottestMonthTemp: Math.max(...monthlyTemp),
      annualHumidity: humidityEstimate,
      annualSolarRadiation,
      altitude,
      monthlyTemp,
      isFallback: false,
    };
  } catch (err) {
    console.error('Climate API failed, using fallback:', err);
    return getFallbackClimate(lat, lon);
  }
}

function getFallbackClimate(lat: number, lon: number): ClimateData {
  let rainfall = 900, deficit = 4, temp = 27;

  if (lat > 33) { rainfall = 430; deficit = 7; temp = 17; }
  else if (lat > 30) { rainfall = 280; deficit = 9; temp = 22; }
  else if (lat > 15) { rainfall = 350; deficit = 9; temp = 28; }
  else if (lat > 13) { rainfall = 500; deficit = 8; temp = 28; }
  else if (lat > 9) {
    if (lon > -5 && lon < 2) { rainfall = 900; deficit = 4; temp = 27; }
    else { rainfall = 540; deficit = 7; temp = 25; }
  } else if (lat > 7) { rainfall = 1100; deficit = 4; temp = 26; }
  else if (lat < 7 && lon > -8 && lon < -3) { rainfall = 1400; deficit = 2; temp = 26; }

  const wet = 12 - deficit;
  const monthlyRain = Array.from({ length: 12 }, (_, i) => {
    if (i >= (6 - Math.floor(wet / 2)) && i < (6 + Math.ceil(wet / 2))) return Math.round(rainfall / wet);
    return Math.round(rainfall * 0.02);
  });
  const monthlyETP = new Array(12).fill(Math.round(rainfall / wet * 0.8 + 30));
  const waterBalance = monthlyRain.map((r, i) => r - monthlyETP[i]);
  const monthlyTemp = new Array(12).fill(temp);

  return {
    annualRainfall: rainfall,
    monthlyRain,
    monthlyETP,
    waterBalance,
    deficitMonths: deficit,
    wetMonths: wet,
    annualTemp: temp,
    correctedTemp: temp,
    coldestMonthTemp: temp - 3,
    hottestMonthTemp: temp + 5,
    annualHumidity: deficit > 6 ? 40 : deficit > 4 ? 60 : 75,
    annualSolarRadiation: 18,
    altitude: 0,
    monthlyTemp,
    isFallback: true,
  };
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  try {
    const resp = await fetch(`${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lon}&accept-language=fr`, {
      headers: { 'User-Agent': 'AgriSmartConnect/1.0' },
    });
    if (!resp.ok) throw new Error(`Nominatim error: ${resp.status}`);
    const data = await resp.json();

    const countryCode = (data.address?.country_code || '').toUpperCase();
    const country = data.address?.country || 'Inconnu';
    const region = data.address?.state || data.address?.region || '';
    const distanceToCoast = estimateCoastDistance(lat, lon);
    const curr = CURRENCY_MAP[countryCode] || { currency: 'USD', symbol: '$', rate: 1 };

    return {
      country,
      countryCode,
      region,
      distanceToCoast,
      currency: curr.currency,
      currencySymbol: curr.symbol,
      currencyRate: curr.rate,
    };
  } catch (err) {
    console.error('Nominatim failed:', err);
    const distanceToCoast = estimateCoastDistance(lat, lon);
    let cc = 'XX', country = 'Inconnu';
    if (lat > 27 && lon > -15 && lon < 0) { cc = 'MA'; country = 'Maroc'; }
    else if (lat > 12 && lat < 17 && lon > -18 && lon < -11) { cc = 'SN'; country = 'Sénégal'; }
    else if (lat > 6 && lat < 11 && lon > -1 && lon < 2) { cc = 'TG'; country = 'Togo'; }
    else if (lat > 6 && lat < 12 && lon > 0 && lon < 4) { cc = 'BJ'; country = 'Bénin'; }
    else if (lat > 4 && lat < 11 && lon > -4 && lon < 1) { cc = 'GH'; country = 'Ghana'; }
    else if (lat > 4 && lat < 11 && lon > -9 && lon < -2) { cc = 'CI'; country = "Côte d'Ivoire"; }
    else if (lat > 11 && lat < 17 && lon > 0 && lon < 16) { cc = 'NE'; country = 'Niger'; }
    else if (lat > 10 && lat < 25 && lon > -12 && lon < 5) { cc = 'ML'; country = 'Mali'; }
    const curr = CURRENCY_MAP[cc] || { currency: 'USD', symbol: '$', rate: 1 };
    return { country, countryCode: cc, region: '', distanceToCoast, currency: curr.currency, currencySymbol: curr.symbol, currencyRate: curr.rate };
  }
}
