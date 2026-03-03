import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchSoilData, SoilData } from '@/lib/soilgrids';
import { fetchCurrentWeather, fetchForecast, CurrentWeather, ForecastDay, estimateAnnualRainfall } from '@/lib/weather';
import { crops, calculateCompatibility, getTopCompatibleCrops, CropRequirement } from '@/lib/ecocrop';
import GlassCard from '@/components/GlassCard';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { Search, Download, Save, Loader2, Droplets, Thermometer, Wind, CloudRain, Leaf, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'leaflet/dist/leaflet.css';

interface LatLngPoint {
  lat: number;
  lng: number;
}

function LeafletMap({ positions, setPositions, center }: { positions: LatLngPoint[]; setPositions: (p: LatLngPoint[]) => void; center: [number, number] }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(center, 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    mapRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPos = [...positionsRef.current, { lat: e.latlng.lat, lng: e.latlng.lng }];
      setPositions(newPos);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null; }
    positions.forEach(p => {
      const marker = L.circleMarker([p.lat, p.lng], { radius: 5, color: '#2FA36B', fillColor: '#2FA36B', fillOpacity: 0.8 }).addTo(map);
      markersRef.current.push(marker);
    });
    if (positions.length >= 3) {
      polygonRef.current = L.polygon(positions.map(p => [p.lat, p.lng] as [number, number]), {
        color: '#2FA36B', fillColor: '#2FA36B', fillOpacity: 0.3
      }).addTo(map);
    }
  }, [positions]);

  return <div ref={containerRef} className="w-full h-full rounded-xl" />;
}

function calculateArea(positions: LatLngPoint[]): number {
  if (positions.length < 3) return 0;
  let area = 0;
  const n = positions.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = positions[i].lat * Math.PI / 180;
    const lat2 = positions[j].lat * Math.PI / 180;
    const dlng = (positions[j].lng - positions[i].lng) * Math.PI / 180;
    area += dlng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs(area * 6371000 * 6371000 / 2);
  return Math.round(area / 10000 * 100) / 100; // hectares
}

const CHART_COLORS = ['#2FA36B', '#0E3B2E', '#4ADE80', '#16A34A', '#15803D', '#166534', '#BBF7D0', '#86EFAC'];

export default function SoilAnalysis() {
  const { t, addParcel, lang } = useApp();
  const [positions, setPositions] = useState<LatLngPoint[]>([]);
  const [parcelName, setParcelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [cropQuery, setCropQuery] = useState('');
  const [compatibility, setCompatibility] = useState<any>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropRequirement | null>(null);
  const [topCrops, setTopCrops] = useState<any[]>([]);
  const [step, setStep] = useState<'draw' | 'results' | 'crop'>('draw');
  const resultsRef = useRef<HTMLDivElement>(null);

  const area = calculateArea(positions);
  const center: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p.lat, 0) / positions.length, positions.reduce((s, p) => s + p.lng, 0) / positions.length]
    : [7.5, 2.5];

  const analyze = async () => {
    if (positions.length < 3) return;
    setLoading(true);
    const lat = center[0], lon = center[1];
    try {
      const [soil, w, fc] = await Promise.all([
        fetchSoilData(lat, lon),
        fetchCurrentWeather(lat, lon),
        fetchForecast(lat, lon),
      ]);
      setSoilData(soil);
      setWeather(w);
      setForecast(fc);

      const annualRain = estimateAnnualRainfall(fc);
      const tops = getTopCompatibleCrops(
        { ph: soil.ph, clay: soil.clay, sand: soil.sand, soc: soil.soc, nitrogen: soil.nitrogen, phosphorus: soil.phosphorus, potassium: soil.potassium },
        { temp: w.temp, rain: annualRain }, 5
      );
      setTopCrops(tops);
      setStep('results');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkCrop = () => {
    const key = Object.keys(crops).find(k => {
      const c = crops[k];
      return c.name.fr.toLowerCase() === cropQuery.toLowerCase() || c.name.en.toLowerCase() === cropQuery.toLowerCase() || k === cropQuery.toLowerCase();
    });
    if (!key || !soilData || !weather) return;
    const crop = crops[key];
    setSelectedCrop(crop);
    const annualRain = estimateAnnualRainfall(forecast);
    const result = calculateCompatibility(crop,
      { ph: soilData.ph, clay: soilData.clay, sand: soilData.sand, soc: soilData.soc, nitrogen: soilData.nitrogen, phosphorus: soilData.phosphorus, potassium: soilData.potassium },
      { temp: weather.temp, rain: annualRain }
    );
    setCompatibility(result);
    setStep('crop');
  };

  const saveToDashboard = () => {
    addParcel({
      id: crypto.randomUUID(),
      name: parcelName || `Parcelle ${new Date().toLocaleDateString()}`,
      area,
      lat: center[0],
      lon: center[1],
      soilData,
      weatherData: weather,
      forecastData: forecast,
      cropAnalysis: compatibility ? { crop: selectedCrop, ...compatibility } : undefined,
      createdAt: new Date().toISOString(),
    });
  };

  const downloadPDF = async () => {
    if (!resultsRef.current) return;
    const canvas = await html2canvas(resultsRef.current, { scale: 2, useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    let yPos = 0;
    const pageH = pdf.internal.pageSize.getHeight();
    while (yPos < h) {
      if (yPos > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -yPos, w, h);
      yPos += pageH;
    }
    pdf.save(`AgriSmartConnect_${parcelName || 'analysis'}.pdf`);
  };

  const resetDraw = () => {
    setPositions([]);
    setSoilData(null);
    setWeather(null);
    setForecast([]);
    setCompatibility(null);
    setSelectedCrop(null);
    setStep('draw');
  };

  const chemicalData = soilData ? [
    { name: 'pH', value: soilData.ph, unit: '' },
    { name: lang === 'fr' ? 'Carbone Org.' : 'Org. Carbon', value: soilData.soc, unit: 'g/kg' },
    { name: lang === 'fr' ? 'Azote' : 'Nitrogen', value: soilData.nitrogen, unit: 'g/kg' },
    { name: lang === 'fr' ? 'Phosphore' : 'Phosphorus', value: soilData.phosphorus, unit: 'mg/kg' },
    { name: lang === 'fr' ? 'Potassium' : 'Potassium', value: soilData.potassium, unit: 'mg/kg' },
    { name: 'CEC', value: soilData.cec, unit: 'cmol/kg' },
  ] : [];

  const physicalData = soilData ? [
    { name: lang === 'fr' ? 'Argile' : 'Clay', value: soilData.clay, unit: '%' },
    { name: lang === 'fr' ? 'Sable' : 'Sand', value: soilData.sand, unit: '%' },
    { name: lang === 'fr' ? 'Limon' : 'Silt', value: soilData.silt, unit: '%' },
    { name: lang === 'fr' ? 'Densité' : 'Density', value: soilData.bdod, unit: 'kg/dm³' },
    { name: lang === 'fr' ? 'Frag. grossiers' : 'Coarse frag.', value: soilData.cfvo, unit: '%' },
  ] : [];

  const textureData = soilData ? [
    { name: lang === 'fr' ? 'Argile' : 'Clay', value: soilData.clay },
    { name: lang === 'fr' ? 'Sable' : 'Sand', value: soilData.sand },
    { name: lang === 'fr' ? 'Limon' : 'Silt', value: soilData.silt },
  ] : [];

  const cropSuggestions = cropQuery.length > 0 ? Object.entries(crops)
    .filter(([k, c]) => c.name.fr.toLowerCase().includes(cropQuery.toLowerCase()) || c.name.en.toLowerCase().includes(cropQuery.toLowerCase()) || k.includes(cropQuery.toLowerCase()))
    .slice(0, 8) : [];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-black text-foreground mb-2">{t('soil.title')}</motion.h1>
        <p className="text-muted-foreground mb-6">{t('soil.draw')}</p>

        {/* Map + Controls */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <GlassCard variant="strong" className="p-2 h-[500px] relative">
              <LeafletMap positions={positions} setPositions={setPositions} center={center} />
            </GlassCard>
          </div>

          <div className="space-y-4">
            <GlassCard variant="strong">
              <label className="text-sm font-semibold text-foreground block mb-2">{t('soil.parcel_name')}</label>
              <input type="text" value={parcelName} onChange={e => setParcelName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-green-accent/50" />
            </GlassCard>

            <GlassCard variant="strong">
              <div className="text-sm text-muted-foreground mb-1">{t('soil.area')}</div>
              <div className="text-2xl font-bold text-foreground">{area > 0 ? `${area} ha` : '—'}</div>
              <div className="text-xs text-muted-foreground mt-1">{positions.length} points</div>
            </GlassCard>

            <div className="flex gap-2">
              <button onClick={analyze} disabled={positions.length < 3 || loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t('soil.analyzing')}</> : t('soil.analyze')}
              </button>
              <button onClick={resetDraw} className="px-4 py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {step !== 'draw' && soilData && weather && (
            <motion.div ref={resultsRef} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Chemical Properties */}
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-accent" /> {t('soil.chemical')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {chemicalData.map((d, i) => (
                  <GlassCard key={i} variant="strong" className="p-4">
                    <div className="text-sm text-muted-foreground">{d.name}</div>
                    <div className="text-2xl font-bold text-foreground">{typeof d.value === 'number' ? d.value.toFixed(2) : d.value} <span className="text-sm text-muted-foreground">{d.unit}</span></div>
                  </GlassCard>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <GlassCard variant="strong">
                  <h3 className="text-lg font-bold text-foreground mb-4">{t('soil.chemical')}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chemicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#2FA36B" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard variant="strong">
                  <h3 className="text-lg font-bold text-foreground mb-4">{t('soil.physical')} — Texture</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={textureData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                        {textureData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>
              </div>

              {/* Physical Properties */}
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('soil.physical')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {physicalData.map((d, i) => (
                  <GlassCard key={i} variant="strong" className="p-4">
                    <div className="text-sm text-muted-foreground">{d.name}</div>
                    <div className="text-2xl font-bold text-foreground">{d.value.toFixed(2)} <span className="text-sm text-muted-foreground">{d.unit}</span></div>
                  </GlassCard>
                ))}
              </div>

              {/* Weather */}
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-green-accent" /> {t('soil.weather')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Thermometer, label: lang === 'fr' ? 'Température' : 'Temperature', value: `${weather.temp.toFixed(1)}°C`, sub: `Ressenti: ${weather.feels_like.toFixed(1)}°C` },
                  { icon: Droplets, label: lang === 'fr' ? 'Humidité' : 'Humidity', value: `${weather.humidity}%`, sub: `Pression: ${weather.pressure} hPa` },
                  { icon: Wind, label: lang === 'fr' ? 'Vent' : 'Wind', value: `${weather.wind_speed} m/s`, sub: `Direction: ${weather.wind_deg}°` },
                  { icon: CloudRain, label: lang === 'fr' ? 'Nuages' : 'Clouds', value: `${weather.clouds}%`, sub: weather.description },
                ].map((w, i) => (
                  <GlassCard key={i} variant="strong" className="p-4">
                    <w.icon className="w-5 h-5 text-green-accent mb-2" />
                    <div className="text-sm text-muted-foreground">{w.label}</div>
                    <div className="text-xl font-bold text-foreground">{w.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{w.sub}</div>
                  </GlassCard>
                ))}
              </div>

              {/* Forecast Chart */}
              <GlassCard variant="strong" className="mb-8">
                <h3 className="text-lg font-bold text-foreground mb-4">{t('soil.forecast')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="temp_max" name="Max °C" stroke="#2FA36B" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="temp_min" name="Min °C" stroke="#0E3B2E" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="rain" name="Pluie mm" stroke="#4ADE80" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* Crop Compatibility Check */}
              <GlassCard variant="strong" className="mb-8">
                <h3 className="text-lg font-bold text-foreground mb-4">{t('soil.crop_input')}</h3>
                <div className="flex gap-3 relative">
                  <div className="flex-1 relative">
                    <input type="text" value={cropQuery} onChange={e => { setCropQuery(e.target.value); setCompatibility(null); }}
                      placeholder={t('soil.crop_input')}
                      className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-accent/50" />
                    {cropSuggestions.length > 0 && !selectedCrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-strong rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                        {cropSuggestions.map(([k, c]) => (
                          <button key={k} onClick={() => { setCropQuery(c.name[lang]); }}
                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors">
                            {c.name[lang]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={checkCrop} className="px-6 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all">
                    {t('soil.crop_check')}
                  </button>
                </div>
              </GlassCard>

              {/* Compatibility Results */}
              {compatibility && selectedCrop && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-4">{t('soil.compatibility')} — {selectedCrop.name[lang]}</h2>

                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <GlassCard variant="strong">
                      <div className="text-center mb-4">
                        <div className={`text-5xl font-black ${compatibility.score >= 70 ? 'text-green-accent' : compatibility.score >= 50 ? 'text-gold' : 'text-destructive'}`}>
                          {compatibility.score}%
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {compatibility.score >= 70 ? <CheckCircle2 className="w-5 h-5 text-green-accent" /> :
                           compatibility.score >= 50 ? <AlertTriangle className="w-5 h-5 text-gold" /> :
                           <XCircle className="w-5 h-5 text-destructive" />}
                          <span className="text-sm text-muted-foreground">
                            {compatibility.score >= 70 ? (lang === 'fr' ? 'Bonne compatibilité' : 'Good compatibility') :
                             compatibility.score >= 50 ? (lang === 'fr' ? 'Compatibilité moyenne' : 'Average compatibility') :
                             (lang === 'fr' ? 'Faible compatibilité' : 'Low compatibility')}
                          </span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={compatibility.details}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="param" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar dataKey="score" stroke="#2FA36B" fill="#2FA36B" fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </GlassCard>

                    <GlassCard variant="strong">
                      <h3 className="text-lg font-bold text-foreground mb-4">{t('soil.recommendations')}</h3>
                      <div className="space-y-3">
                        {[
                          { label: lang === 'fr' ? 'Azote (N)' : 'Nitrogen (N)', value: `${compatibility.nitrogenNeed} kg/ha`, total: `${(compatibility.nitrogenNeed * area).toFixed(0)} kg total` },
                          { label: lang === 'fr' ? 'Phosphore (P)' : 'Phosphorus (P)', value: `${compatibility.phosphorusNeed} kg/ha`, total: `${(compatibility.phosphorusNeed * area).toFixed(0)} kg total` },
                          { label: lang === 'fr' ? 'Potassium (K)' : 'Potassium (K)', value: `${compatibility.potassiumNeed} kg/ha`, total: `${(compatibility.potassiumNeed * area).toFixed(0)} kg total` },
                          { label: lang === 'fr' ? 'Correction pH' : 'pH Correction', value: compatibility.phCorrection > 0 ? `+${compatibility.phCorrection}` : `${compatibility.phCorrection}`, total: '' },
                          { label: lang === 'fr' ? 'Eau nécessaire' : 'Water needed', value: `${compatibility.waterNeed} m³/ha`, total: `${(compatibility.waterNeed * area).toFixed(0)} m³ total` },
                          { label: lang === 'fr' ? 'Rendement estimé' : 'Est. yield', value: `${selectedCrop.yield_potential} t/ha`, total: `${(selectedCrop.yield_potential * area).toFixed(1)} t total` },
                          { label: lang === 'fr' ? 'Revenu potentiel' : 'Potential revenue', value: `$${selectedCrop.market_price}/t`, total: `$${(selectedCrop.yield_potential * area * selectedCrop.market_price).toFixed(0)} total` },
                        ].map((r, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm text-muted-foreground">{r.label}</span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-foreground">{r.value}</span>
                              {r.total && <span className="text-xs text-muted-foreground ml-2">({r.total})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>

                  {/* Detail table */}
                  <GlassCard variant="strong" className="mb-8 overflow-x-auto">
                    <h3 className="text-lg font-bold text-foreground mb-4">{lang === 'fr' ? 'Détails de compatibilité' : 'Compatibility Details'}</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground font-medium">{lang === 'fr' ? 'Paramètre' : 'Parameter'}</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">{lang === 'fr' ? 'Valeur sol' : 'Soil value'}</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Min</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Max</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Score</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compatibility.details.map((d: any, i: number) => (
                          <tr key={i} className="border-b border-border/30">
                            <td className="py-2 font-medium text-foreground">{d.param}</td>
                            <td className="text-center text-foreground">{d.value.toFixed(2)}</td>
                            <td className="text-center text-muted-foreground">{d.min}</td>
                            <td className="text-center text-muted-foreground">{d.max}</td>
                            <td className="text-center font-bold" style={{ color: d.score >= 75 ? '#2FA36B' : d.score >= 50 ? '#D97706' : '#DC2626' }}>{d.score}%</td>
                            <td className="text-center">
                              {d.status === 'optimal' ? <CheckCircle2 className="w-4 h-4 text-green-accent inline" /> :
                               d.status === 'acceptable' ? <AlertTriangle className="w-4 h-4 text-gold inline" /> :
                               <XCircle className="w-4 h-4 text-destructive inline" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </GlassCard>

                  {/* Alternatives if low score */}
                  {compatibility.score < 70 && (
                    <GlassCard variant="strong" className="mb-8">
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-green-accent" />
                        {t('soil.alternatives')}
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topCrops.map((tc, i) => (
                          <div key={i} className="p-4 rounded-xl bg-secondary/50 border border-border/30">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-foreground">{tc.crop.name[lang]}</span>
                              <span className={`text-sm font-bold ${tc.score >= 70 ? 'text-green-accent' : 'text-gold'}`}>{tc.score}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lang === 'fr' ? 'Rendement' : 'Yield'}: {tc.crop.yield_potential} t/ha · {lang === 'fr' ? 'Prix' : 'Price'}: ${tc.crop.market_price}/t
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </motion.div>
              )}

              {/* Top compatible crops (always shown) */}
              {!compatibility && topCrops.length > 0 && (
                <GlassCard variant="strong" className="mb-8">
                  <h3 className="text-lg font-bold text-foreground mb-4">{lang === 'fr' ? 'Cultures les plus compatibles' : 'Most compatible crops'}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {topCrops.map((tc, i) => (
                      <button key={i} onClick={() => { setCropQuery(tc.crop.name[lang]); }}
                        className="p-4 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary transition-colors text-left">
                        <div className="text-sm font-bold text-foreground mb-1">{tc.crop.name[lang]}</div>
                        <div className="text-2xl font-black text-green-accent">{tc.score}%</div>
                        <div className="text-xs text-muted-foreground mt-1">{tc.crop.yield_potential} t/ha</div>
                      </button>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={saveToDashboard} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all">
                  <Save className="w-4 h-4" /> {t('soil.save_dashboard')}
                </button>
                <button onClick={downloadPDF} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <Download className="w-4 h-4" /> {t('soil.download_pdf')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
