import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchSoilData, SoilData } from '@/lib/soilgrids';
import { fetchCurrentWeather, CurrentWeather } from '@/lib/weather';
import { fetchClimateNormals, reverseGeocode, ClimateData, GeoLocation } from '@/lib/climate-api';
import { runFullAnalysis, AnalysisResult, CropScore, AgroZone } from '@/lib/agro-engine';
import L from 'leaflet';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  Download, Save, Loader2, Droplets, Thermometer, Wind, CloudRain, Leaf, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, MapPin, Zap, X, FileSpreadsheet,
  FlaskConical, Layers, Activity, TrendingUp, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'leaflet/dist/leaflet.css';

interface LatLngPoint { lat: number; lng: number; }

// ─── LEAFLET MAP ─────────────────────────────────────────────────────────────

function LeafletMap({ positions, setPositions, center }: { positions: LatLngPoint[]; setPositions: (p: LatLngPoint[]) => void; center: [number, number] }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const positionsRef = useRef(positions);
  const hasCenteredRef = useRef(false);
  positionsRef.current = positions;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    mapRef.current = map;
    map.on('click', (e: L.LeafletMouseEvent) => {
      setPositions([...positionsRef.current, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Re-center map when user location is resolved (only once, before any points drawn)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || hasCenteredRef.current || positions.length > 0) return;
    map.setView(center, 13);
    hasCenteredRef.current = true;
  }, [center, positions.length]);

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
  return Math.round(area / 10000 * 100) / 100;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const GRADE_COLORS = {
  excellent: { bg: '#1E4D0A', text: '#fff' },
  bon: { bg: '#52A829', text: '#fff' },
  moyen: { bg: '#D97706', text: '#fff' },
  deconseille: { bg: '#DC2626', text: '#fff' },
};
const GRADE_LABELS = {
  excellent: { fr: 'Excellent', en: 'Excellent' },
  bon: { fr: 'Bon', en: 'Good' },
  moyen: { fr: 'Moyen', en: 'Average' },
  deconseille: { fr: 'Déconseillé', en: 'Not recommended' },
};
const ZONE_ICONS: Record<AgroZone, string> = {
  sahelian: '🏜️', sudanian: '🌾', guinean: '🌴', mediterranean: '🫒', mountain_med: '⛰️',
};
const MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = ['hsl(150,55%,30%)', 'hsl(150,55%,41%)', 'hsl(42,80%,55%)', 'hsl(0,84%,60%)'];

const LOADING_STEPS = [
  { fr: 'Interrogation SoilGrids ISRIC/NASA...', en: 'Querying SoilGrids ISRIC/NASA...' },
  { fr: 'Récupération normales climatiques ERA5 1991-2020...', en: 'Retrieving ERA5 climate normals 1991-2020...' },
  { fr: 'Géocodage inverse Nominatim...', en: 'Reverse geocoding Nominatim...' },
  { fr: 'Récupération météo temps réel...', en: 'Fetching real-time weather...' },
  { fr: 'Détermination zone agro-écologique...', en: 'Determining agro-ecological zone...' },
  { fr: 'Calcul compatibilité 21 cultures...', en: 'Computing compatibility for 21 crops...' },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function SoilAnalysis() {
  const { t, addParcel, lang } = useApp();
  const [positions, setPositions] = useState<LatLngPoint[]>([]);
  const [parcelName, setParcelName] = useState('');
  const [hasIrrigation, setHasIrrigation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [climate, setClimate] = useState<ClimateData | null>(null);
  const [geo, setGeo] = useState<GeoLocation | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedCropIdx, setSelectedCropIdx] = useState<number | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showRawData, setShowRawData] = useState(false);
  const [step, setStep] = useState<'draw' | 'results'>('draw');
  const [error, setError] = useState<string | null>(null);
  // Farmer custom inputs
  const [farmerPrevCrop, setFarmerPrevCrop] = useState('');
  const [farmerBudget, setFarmerBudget] = useState('');
  const [farmerSoilObs, setFarmerSoilObs] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  // User geolocation for map centering
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => { /* fallback stays default */ },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }, []);

  const area = calculateArea(positions);
  const center: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p.lat, 0) / positions.length, positions.reduce((s, p) => s + p.lng, 0) / positions.length]
    : userLocation || [7.5, 2.5];
  const monthLabels = lang === 'fr' ? MONTH_LABELS_FR : MONTH_LABELS_EN;

  const analyze = async () => {
    if (positions.length < 3) return;
    setLoading(true); setError(null); setLoadingStep(0);
    const lat = center[0], lon = center[1];

    try {
      setLoadingStep(0);
      const soil = await fetchSoilData(lat, lon);
      setSoilData(soil);

      setLoadingStep(1);
      const clim = await fetchClimateNormals(lat, lon);
      setClimate(clim);

      setLoadingStep(2);
      const geoData = await reverseGeocode(lat, lon);
      setGeo(geoData);

      setLoadingStep(3);
      let w: CurrentWeather | null = null;
      try { w = await fetchCurrentWeather(lat, lon); } catch { /* non-critical */ }
      setWeather(w);

      setLoadingStep(4);
      await new Promise(r => setTimeout(r, 200));
      setLoadingStep(5);

      const result = runFullAnalysis(soil, clim, geoData, w, hasIrrigation, area, lat, lon);
      setAnalysis(result);
      setStep('results');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const resetDraw = () => {
    setPositions([]); setSoilData(null); setWeather(null); setClimate(null);
    setGeo(null); setAnalysis(null); setSelectedCropIdx(null);
    setStep('draw'); setError(null); setDismissedAlerts(new Set());
  };

  // ─── PDF EXPORT ───────────────────────────────────────────────────────────

  const downloadPDF = () => {
    if (!analysis || !soilData || !geo || !climate) return;
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      let y = 15;

      const addLine = (text: string, size = 10, style: 'normal' | 'bold' = 'normal') => {
        if (y > 270) { pdf.addPage(); y = 15; }
        pdf.setFontSize(size); pdf.setFont('helvetica', style);
        pdf.text(text, 15, y, { maxWidth: w - 30 }); y += size * 0.5 + 2;
      };
      const addSpacer = (h = 4) => { y += h; };

      addLine('AgriSmartConnect — Rapport d\'Analyse de Sol', 16, 'bold');
      addLine(`Date : ${new Date().toLocaleDateString('fr-FR')} | Parcelle : ${parcelName || 'Sans nom'} | Surface : ${area.toFixed(2)} ha`);
      addLine(`Pays : ${geo.country} | Zone : ${L_(analysis.zoneLabel)} | Confiance : ${analysis.confidenceIndex}%`);
      addSpacer(6);

      // Soil data
      addLine('PROPRIÉTÉS DU SOL', 12, 'bold');
      addLine(`pH : ${soilData.ph.toFixed(2)} | Azote : ${soilData.nitrogen.toFixed(3)} g/kg (${soilData.nitrogenKgHa.toFixed(0)} kg/ha)`);
      addLine(`Carbone organique : ${soilData.soc.toFixed(1)} g/kg | CEC : ${soilData.cec.toFixed(1)} cmol(c)/kg`);
      addLine(`Argile : ${soilData.clay.toFixed(1)}% | Sable : ${soilData.sand.toFixed(1)}% | Limon : ${soilData.silt.toFixed(1)}%`);
      addLine(`Densité 0-30cm : ${soilData.bdod.toFixed(2)} g/cm³ | 30-60cm : ${soilData.bdodDeep.toFixed(2)} g/cm³`);
      addLine(`Fragments grossiers : ${soilData.cfvo.toFixed(1)}% | OCD : ${soilData.ocd.toFixed(1)} kg/m³`);
      addLine(`Source : ${soilData.source || 'SoilGrids ISRIC/NASA'}`);
      addSpacer(4);

      // Climate
      addLine('NORMALES CLIMATIQUES (ERA5 1991-2020)', 12, 'bold');
      addLine(`Pluie annuelle : ${climate.annualRainfall} mm/an | Temp. moyenne : ${climate.annualTemp.toFixed(1)}°C`);
      addLine(`Temp. corrigée altitude : ${climate.correctedTemp.toFixed(1)}°C | Altitude : ${climate.altitude} m`);
      addLine(`Mois déficit hydrique : ${climate.deficitMonths}/12 | Mois humides : ${climate.wetMonths}/12`);
      addSpacer(4);

      // Top crops
      addLine('CULTURES RECOMMANDÉES', 12, 'bold');
      analysis.topCrops.slice(0, 5).forEach((c, i) => {
        addLine(`${i + 1}. ${c.name[lang]} — ${c.score}% (${GRADE_LABELS[c.grade][lang]})`, 10, 'bold');
        addLine(`   Rendement : ${c.yieldLow.toFixed(1)} à ${c.yieldHigh.toFixed(1)} t/ha`);
        addLine(`   Semis : ${L_(c.sowingWindow)} | Récolte : ${L_(c.harvestWindow)} (${c.cycleDays} jours)`);
        addLine(`   Marge nette : ${fmtCur(c.marginLow, geo)} à ${fmtCur(c.marginHigh, geo)}`);
        // Input recs
        c.inputRecommendations.forEach(rec => {
          addLine(`   → ${L_(rec.name)} : ${rec.quantity} — ${L_(rec.timing)}`);
        });
        addSpacer(2);
      });

      // Rotation
      addLine('ROTATION 3 ANS', 12, 'bold');
      analysis.rotation.forEach(r => addLine(`An ${r.year} : ${L_(r.crop)} — ${L_(r.reason)}`));
      addSpacer(4);

      // Allocation
      addLine('PLAN SUBSISTANCE / RENTE', 12, 'bold');
      addLine(L_(analysis.allocationDescription));
      addSpacer(4);

      // Risks
      if (analysis.risks.length > 0) {
        addLine('RISQUES AGRONOMIQUES', 12, 'bold');
        analysis.risks.forEach(r => {
          addLine(`[${r.level.toUpperCase()}] ${L_(r.title)}`, 10, 'bold');
          addLine(`   ${L_(r.description)}`);
        });
      }

      // Footer
      y = pdf.internal.pageSize.getHeight() - 10;
      pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
      pdf.text('Sources : SoilGrids ISRIC/NASA · ERA5 Open-Meteo · FAO EcoCrop · CIRAD · IITA · FAOSTAT 2022-2023', w / 2, y, { align: 'center' });

      // Use blob for reliable download
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AgriSmartConnect_${parcelName || 'analyse'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(lang === 'fr' ? 'Erreur lors de la génération du PDF' : 'Error generating PDF');
    }
  };

  // ─── CSV EXPORT ───────────────────────────────────────────────────────────

  const downloadCSV = () => {
    if (!analysis || !soilData || !geo || !climate) return;
    const rows: string[][] = [];
    rows.push(['AgriSmartConnect — Rapport d\'Analyse']);
    rows.push(['Parcelle', parcelName || 'Sans nom', 'Surface (ha)', area.toFixed(2), 'Pays', geo.country]);
    rows.push(['Zone', L_(analysis.zoneLabel), 'Confiance (%)', String(analysis.confidenceIndex)]);
    rows.push([]);
    rows.push(['=== PROPRIÉTÉS DU SOL ===']);
    rows.push(['Paramètre', 'Valeur', 'Unité', 'Source']);
    rows.push(['pH', soilData.ph.toFixed(2), '', soilData.source || 'SoilGrids']);
    rows.push(['Azote', soilData.nitrogen.toFixed(3), 'g/kg', 'SoilGrids/ISRIC']);
    rows.push(['Azote disponible', soilData.nitrogenKgHa.toFixed(0), 'kg/ha', 'FAO-ISRIC']);
    rows.push(['Carbone organique (SOC)', soilData.soc.toFixed(1), 'g/kg', 'SoilGrids']);
    rows.push(['CEC', soilData.cec.toFixed(1), 'cmol(c)/kg', 'SoilGrids']);
    rows.push(['Argile', soilData.clay.toFixed(1), '%', 'SoilGrids']);
    rows.push(['Sable', soilData.sand.toFixed(1), '%', 'SoilGrids']);
    rows.push(['Limon', soilData.silt.toFixed(1), '%', 'SoilGrids']);
    rows.push(['Densité 0-30cm', soilData.bdod.toFixed(2), 'g/cm³', 'SoilGrids']);
    rows.push(['Densité 30-60cm', soilData.bdodDeep.toFixed(2), 'g/cm³', 'SoilGrids']);
    rows.push(['Fragments grossiers', soilData.cfvo.toFixed(1), '%', 'SoilGrids']);
    rows.push(['OCD', soilData.ocd.toFixed(1), 'kg/m³', 'SoilGrids']);
    rows.push([]);
    rows.push(['=== NORMALES CLIMATIQUES (ERA5 1991-2020) ===']);
    rows.push(['Pluie annuelle', String(climate.annualRainfall), 'mm/an']);
    rows.push(['Temp. moyenne', climate.annualTemp.toFixed(1), '°C']);
    rows.push(['Altitude', String(climate.altitude), 'm']);
    rows.push(['Mois déficit', String(climate.deficitMonths), '/12']);
    rows.push([]);
    rows.push(['=== PLUIE MENSUELLE (mm) ===']);
    rows.push(['Mois', ...MONTH_LABELS_FR]);
    rows.push(['Pluie (mm)', ...climate.monthlyRain.map(String)]);
    rows.push(['ETP (mm)', ...climate.monthlyETP.map(String)]);
    rows.push(['Bilan (mm)', ...climate.waterBalance.map(String)]);
    rows.push([]);
    rows.push(['=== CULTURES RECOMMANDÉES ===']);
    rows.push(['Rang', 'Culture', 'Score (%)', 'Grade', 'Rendement bas (t/ha)', 'Rendement haut (t/ha)', 'Marge basse', 'Marge haute', 'Semis', 'Récolte', 'Cycle (jours)']);
    analysis.topCrops.forEach((c, i) => {
      rows.push([String(i + 1), c.name[lang], String(c.score), GRADE_LABELS[c.grade][lang],
        c.yieldLow.toFixed(1), c.yieldHigh.toFixed(1), fmtCur(c.marginLow, geo), fmtCur(c.marginHigh, geo),
        L_(c.sowingWindow), L_(c.harvestWindow), String(c.cycleDays)]);
    });

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgriSmartConnect_${parcelName || 'analyse'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveToDashboard = () => {
    addParcel({
      id: crypto.randomUUID(), name: parcelName || `Parcelle ${new Date().toLocaleDateString()}`,
      area, lat: center[0], lon: center[1], soilData, weatherData: weather,
      forecastData: [], cropAnalysis: analysis, createdAt: new Date().toISOString(),
    });
  };

  const L_ = (obj: { fr: string; en: string }) => obj[lang] || obj.fr;

  return (
    <div className="min-h-screen pt-20 pb-32 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black text-foreground mb-1">{t('soil.title')}</motion.h1>
        <p className="text-sm text-muted-foreground mb-4">{t('soil.draw')}</p>

        {/* ─── DRAW PHASE ──────────────────────────────────────────────── */}
        {step === 'draw' && (
          <>
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-border bg-card p-1.5 h-[400px] sm:h-[450px] relative">
                  <LeafletMap positions={positions} setPositions={setPositions} center={center} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <label className="text-xs font-semibold text-foreground block mb-1.5">{t('soil.parcel_name')}</label>
                  <input type="text" value={parcelName} onChange={e => setParcelName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="text-xs text-muted-foreground mb-1">{t('soil.area')}</div>
                  <div className="text-xl font-bold text-foreground">{area > 0 ? `${area} ha` : '—'}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{positions.length} points</div>
                </div>

                {/* Irrigation toggle */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <label className="text-xs font-semibold text-foreground block mb-2">
                    {lang === 'fr' ? "Accès à l'irrigation ?" : 'Access to irrigation?'}
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setHasIrrigation(true)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${hasIrrigation ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {lang === 'fr' ? 'Oui' : 'Yes'}
                    </button>
                    <button onClick={() => setHasIrrigation(false)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${!hasIrrigation ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {lang === 'fr' ? 'Non' : 'No'}
                    </button>
                  </div>
                </div>

                {/* Farmer custom inputs */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="text-xs font-semibold text-foreground mb-1">
                    {lang === 'fr' ? '📝 Vos données terrain (optionnel)' : '📝 Your field data (optional)'}
                  </div>
                  <input type="text" value={farmerPrevCrop} onChange={e => setFarmerPrevCrop(e.target.value)}
                    placeholder={lang === 'fr' ? 'Culture précédente (ex: maïs)' : 'Previous crop (e.g. maize)'}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                  <input type="text" value={farmerBudget} onChange={e => setFarmerBudget(e.target.value)}
                    placeholder={lang === 'fr' ? 'Budget intrants (ex: 50000 FCFA)' : 'Input budget (e.g. 50000 FCFA)'}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                  <input type="text" value={farmerSoilObs} onChange={e => setFarmerSoilObs(e.target.value)}
                    placeholder={lang === 'fr' ? 'Observation sol (ex: argileux, caillouteux)' : 'Soil observation (e.g. clayey, stony)'}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                </div>

                <div className="flex gap-2">
                  <button onClick={analyze} disabled={positions.length < 3 || loading}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t('soil.analyzing')}</> : t('soil.analyze')}
                  </button>
                  <button onClick={resetDraw} className="px-4 py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">Reset</button>
                </div>
              </div>
            </div>

            {/* Loading overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-border bg-card p-6 mb-6">
                  <div className="space-y-2">
                    {LOADING_STEPS.map((s, i) => (
                      <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i <= loadingStep ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                        {i < loadingStep ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> :
                         i === loadingStep ? <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" /> :
                         <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />}
                        <span>{s[lang]}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 mb-6">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── RESULTS PHASE ───────────────────────────────────────────── */}
        {step === 'results' && analysis && soilData && geo && climate && (
          <motion.div ref={resultsRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Immediate Alerts */}
            {analysis.alerts.filter(a => !dismissedAlerts.has(a.type)).map(alert => (
              <motion.div key={alert.type} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-3 mb-3 flex items-start justify-between ${alert.level === 'red' ? 'bg-destructive/15 border border-destructive/30' : 'bg-gold/15 border border-gold/30'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.level === 'red' ? 'text-destructive' : 'text-gold'}`} />
                  <div>
                    <div className="text-sm font-bold text-foreground">{L_(alert.title)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{L_(alert.description)}</div>
                  </div>
                </div>
                <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.type))} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}

            {/* Zone + Overview */}
            <div className="rounded-xl border border-border bg-card p-4 mb-4 flex items-center gap-3">
              <span className="text-3xl">{ZONE_ICONS[analysis.zone]}</span>
              <div className="flex-1">
                <div className="text-lg font-bold text-foreground">{L_(analysis.zoneLabel)}</div>
                <div className="text-xs text-muted-foreground">{L_(analysis.zoneDescription)}</div>
              </div>
            </div>

            {/* Parcel Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <InfoCard label={lang === 'fr' ? 'Parcelle' : 'Plot'} value={parcelName || '—'} />
              <InfoCard label={lang === 'fr' ? 'Surface' : 'Area'} value={`${area.toFixed(2)} ha`} />
              <InfoCard label={lang === 'fr' ? 'Pays' : 'Country'} value={geo.country} icon={MapPin} />
              <InfoCard label={lang === 'fr' ? 'Confiance' : 'Confidence'} value={`${analysis.confidenceIndex}%`} icon={Zap}
                valueClass={analysis.confidenceIndex >= 80 ? 'text-primary' : analysis.confidenceIndex >= 60 ? 'text-gold' : 'text-destructive'} />
            </div>

            {/* ─── SOIL PROPERTIES (CARD GRID) ─────────────────────────── */}
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              {lang === 'fr' ? 'Propriétés du sol' : 'Soil Properties'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              <SoilCard label="pH" value={soilData.ph.toFixed(2)} unit="" interp={soilData.ph < 5.5 ? '🔴 Acide' : soilData.ph < 6.5 ? '🟡 Lég. acide' : soilData.ph < 7.5 ? '🟢 Neutre' : '🟡 Alcalin'} />
              <SoilCard label={lang === 'fr' ? 'Azote' : 'Nitrogen'} value={soilData.nitrogen.toFixed(3)} unit="g/kg" interp={`${soilData.nitrogenKgHa.toFixed(0)} kg/ha`} />
              <SoilCard label="SOC" value={soilData.soc.toFixed(1)} unit="g/kg" interp={soilData.soc < 5 ? '🔴 Faible' : soilData.soc < 15 ? '🟡 Correct' : '🟢 Riche'} />
              <SoilCard label="CEC" value={soilData.cec.toFixed(1)} unit="cmol(c)/kg" interp={soilData.cec < 10 ? '🔴 Faible rétention' : soilData.cec > 25 ? '🟢 Bonne' : '🟡 Correcte'} />
              <SoilCard label={lang === 'fr' ? 'Argile' : 'Clay'} value={soilData.clay.toFixed(1)} unit="%" interp="" />
              <SoilCard label={lang === 'fr' ? 'Sable' : 'Sand'} value={soilData.sand.toFixed(1)} unit="%" interp="" />
              <SoilCard label={lang === 'fr' ? 'Limon' : 'Silt'} value={soilData.silt.toFixed(1)} unit="%" interp="" />
              <SoilCard label={lang === 'fr' ? 'Densité 0-30' : 'Density 0-30'} value={soilData.bdod.toFixed(2)} unit="g/cm³" interp={soilData.bdod > 1.6 ? '🔴 Compacté' : '🟢 Normal'} />
              <SoilCard label={lang === 'fr' ? 'Densité 30-60' : 'Density 30-60'} value={soilData.bdodDeep.toFixed(2)} unit="g/cm³" interp="" />
              <SoilCard label={lang === 'fr' ? 'Frag. grossiers' : 'Coarse frag.'} value={soilData.cfvo.toFixed(1)} unit="%" interp={soilData.cfvo > 20 ? '🟡 Caillouteux' : '🟢 Fin'} />
              <SoilCard label="OCD" value={soilData.ocd.toFixed(1)} unit="kg/m³" interp="" />
            </div>
            <div className="text-[10px] text-primary font-semibold mb-6 px-2 py-1 bg-primary/10 rounded-lg inline-block">
              📡 {soilData.source || 'SoilGrids ISRIC/NASA'}
            </div>

            {/* ─── SOIL TEXTURE PIE ────────────────────────────────────── */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? 'Composition texturale' : 'Texture composition'}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[
                      { name: lang === 'fr' ? 'Argile' : 'Clay', value: soilData.clay },
                      { name: lang === 'fr' ? 'Sable' : 'Sand', value: soilData.sand },
                      { name: lang === 'fr' ? 'Limon' : 'Silt', value: soilData.silt },
                    ]} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} ${value.toFixed(0)}%`}>
                      <Cell fill="hsl(150,55%,30%)" />
                      <Cell fill="hsl(42,80%,55%)" />
                      <Cell fill="hsl(150,55%,41%)" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Climate summary cards */}
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? 'Normales climatiques' : 'Climate normals'} {climate.isFallback ? '(est.)' : '(ERA5 1991-2020)'}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <SoilCard label={lang === 'fr' ? 'Pluie/an' : 'Rain/yr'} value={String(climate.annualRainfall)} unit="mm" interp="" />
                    <SoilCard label={lang === 'fr' ? 'Temp. moy.' : 'Avg temp'} value={climate.annualTemp.toFixed(1)} unit="°C" interp="" />
                    <SoilCard label={lang === 'fr' ? 'Déficit' : 'Deficit'} value={`${climate.deficitMonths}`} unit={lang === 'fr' ? 'mois/12' : 'mo/12'} interp="" />
                    <SoilCard label="Altitude" value={String(climate.altitude)} unit="m" interp="" />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── WATER BALANCE CHART ─────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-4 mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                {lang === 'fr' ? 'Bilan hydrique mensuel (Pluie vs ETP)' : 'Monthly water balance (Rain vs ETP)'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={climate.monthlyRain.map((r, i) => ({
                  month: monthLabels[i],
                  rain: r,
                  etp: climate.monthlyETP[i],
                  balance: climate.waterBalance[i],
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit=" mm" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="rain" name={lang === 'fr' ? 'Pluie (mm)' : 'Rain (mm)'} fill="hsl(150,55%,41%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="etp" name="ETP (mm)" fill="hsl(42,80%,55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-1">{lang === 'fr' ? 'Source : ERA5 ECMWF/Copernicus 1991-2020' : 'Source: ERA5 ECMWF/Copernicus 1991-2020'}</p>
            </div>

            {/* ─── TEMPERATURE CHART ───────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-4 mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary" />
                {lang === 'fr' ? 'Températures mensuelles moyennes' : 'Monthly average temperatures'}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={climate.monthlyTemp.map((t, i) => ({ month: monthLabels[i], temp: t }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit="°C" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Line type="monotone" dataKey="temp" name={lang === 'fr' ? 'Temp. (°C)' : 'Temp. (°C)'} stroke="hsl(0,84%,60%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ─── WATER & INPUT TRACKING ──────────────────────────────── */}
            <div className="rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-5 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {lang === 'fr' ? "Suivi eau & intrants" : 'Water & Input Tracking'}
              </h3>
              {analysis.topCrops[0] && (
                <div className="space-y-4">
                  {/* Water needs */}
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-2">
                      💧 {lang === 'fr' ? `Besoin en eau — ${analysis.topCrops[0].name[lang]}` : `Water need — ${analysis.topCrops[0].name[lang]}`}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <SoilCard label={lang === 'fr' ? 'Pluie annuelle' : 'Annual rain'} value={String(climate.annualRainfall)} unit="mm" interp="" />
                      <SoilCard label={lang === 'fr' ? 'Déficit hydrique' : 'Water deficit'} value={String(Math.max(0, climate.waterBalance.filter(b => b < 0).reduce((s, b) => s + Math.abs(b), 0)))} unit="mm/an" interp={climate.deficitMonths > 6 ? '🔴 Sévère' : climate.deficitMonths > 3 ? '🟡 Modéré' : '🟢 Faible'} />
                      <SoilCard label={lang === 'fr' ? 'Irrigation requise' : 'Irrigation needed'} value={hasIrrigation ? (lang === 'fr' ? 'Disponible' : 'Available') : (lang === 'fr' ? 'Non disponible' : 'Not available')} unit="" interp="" />
                    </div>
                  </div>

                  {/* Input schedule */}
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-2">
                      ⚗️ {lang === 'fr' ? "Calendrier d'apports recommandés" : 'Recommended input schedule'}
                    </div>
                    {analysis.topCrops[0].inputRecommendations.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.topCrops[0].inputRecommendations.map((rec, j) => (
                          <div key={j} className={`rounded-lg p-3 border ${rec.type === 'organic' ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30'}`}>
                            <div className="text-xs font-bold text-foreground">{rec.type === 'organic' ? '🌿' : '⚗️'} {L_(rec.name)}</div>
                            <div className="text-xs text-muted-foreground">{rec.quantity}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">📅 {L_(rec.timing)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{lang === 'fr' ? 'Aucun apport spécifique requis.' : 'No specific input required.'}</p>
                    )}
                  </div>

                  <p className="text-[10px] text-accent font-semibold italic">
                    🌍 {lang === 'fr' ? "Bientôt avec vous sur le terrain, pour plus de précision." : "Coming soon to the field, for greater precision."}
                  </p>
                </div>
              )}
            </div>

            {/* ─── AGRONOMIC RISKS ─────────────────────────────────────── */}
            {analysis.risks.length > 0 && (
              <div className="mb-6 space-y-2">
                <h3 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? '⚠️ Risques agronomiques' : '⚠️ Agronomic risks'}</h3>
                {analysis.risks.map((risk, i) => (
                  <div key={i} className={`rounded-xl border bg-card p-3 border-l-4 ${risk.level === 'red' ? 'border-l-destructive' : risk.level === 'orange' ? 'border-l-gold' : 'border-l-muted-foreground'}`}>
                    <div className="text-sm font-bold text-foreground">{L_(risk.title)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{L_(risk.description)}</div>
                    <ul className="mt-1 space-y-0.5">
                      {risk.recommendations[lang].map((r, j) => (
                        <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1">
                          <span className="text-primary mt-0.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* ─── TOP 5 CROPS ──────────────────────────────────────────── */}
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              {lang === 'fr' ? 'Cultures recommandées' : 'Recommended Crops'}
            </h2>
            <div className="space-y-3 mb-6">
              {analysis.topCrops.map((crop, i) => (
                <motion.div key={crop.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <button onClick={() => setSelectedCropIdx(selectedCropIdx === i ? null : i)}
                    className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-accent/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-black text-foreground">{i + 1}</div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{L_(crop.name)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {lang === 'fr' ? 'Semis' : 'Sowing'}: {L_(crop.sowingWindow)} · {crop.cycleDays} {lang === 'fr' ? 'jours' : 'days'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black" style={{ color: GRADE_COLORS[crop.grade].bg }}>{crop.score}%</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: GRADE_COLORS[crop.grade].bg, color: GRADE_COLORS[crop.grade].text }}>
                          {GRADE_LABELS[crop.grade][lang]}
                        </span>
                        {selectedCropIdx === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {selectedCropIdx === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="mt-2 space-y-3">
                          {/* Radar */}
                          <div className="rounded-xl border border-border bg-card p-4">
                            <ResponsiveContainer width="100%" height={220}>
                              <RadarChart data={[
                                { axis: 'pH', score: crop.subScores.ph },
                                { axis: 'Texture', score: crop.subScores.texture },
                                { axis: lang === 'fr' ? 'Temp.' : 'Temp.', score: crop.subScores.temp },
                                { axis: lang === 'fr' ? 'Pluie' : 'Rain', score: crop.subScores.rain },
                                { axis: lang === 'fr' ? 'Azote' : 'N', score: crop.subScores.nitrogen },
                              ]}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                              </RadarChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {crop.radarLegend.map(l => (
                                <span key={l.axis} className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  l.status === 'favorable' ? 'bg-primary/20 text-primary' :
                                  l.status === 'limite' ? 'bg-gold/20 text-gold' :
                                  'bg-destructive/20 text-destructive'
                                }`}>
                                  {l.axis}: {l.status === 'favorable' ? '✓' : l.status === 'limite' ? '~' : '✗'} {l.status}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Sub-scores as cards */}
                          <div className="grid grid-cols-5 gap-2">
                            <SoilCard label="pH" value={`${crop.subScores.ph}`} unit="/100" interp="" />
                            <SoilCard label="Texture" value={`${crop.subScores.texture}`} unit="/100" interp="" />
                            <SoilCard label={lang === 'fr' ? 'Temp.' : 'Temp.'} value={`${crop.subScores.temp}`} unit="/100" interp="" />
                            <SoilCard label={lang === 'fr' ? 'Pluie' : 'Rain'} value={`${crop.subScores.rain}`} unit="/100" interp="" />
                            <SoilCard label={lang === 'fr' ? 'Azote' : 'N'} value={`${crop.subScores.nitrogen}`} unit="/100" interp="" />
                          </div>

                          {/* Input recs */}
                          {crop.inputRecommendations.length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-4">
                              <h4 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? "Recommandations d'intrants" : 'Input recommendations'}</h4>
                              {crop.inputRecommendations.map((rec, j) => (
                                <div key={j} className={`p-2 rounded-lg mb-1.5 ${rec.type === 'organic' ? 'bg-primary/10' : 'bg-secondary'}`}>
                                  <div className="text-xs font-bold text-foreground">{rec.type === 'organic' ? '🌿' : '⚗️'} {L_(rec.name)}</div>
                                  <div className="text-[11px] text-muted-foreground">{rec.quantity} — {L_(rec.timing)}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Economics — Enhanced 2026 projections */}
                          <div className="rounded-xl border border-border bg-card p-4">
                            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              {lang === 'fr' ? `Estimation économique ${crop.forecastYear}` : `Economic estimate ${crop.forecastYear}`}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                              <SoilCard label={lang === 'fr' ? 'Rendement/ha' : 'Yield/ha'} value={`${crop.yieldLowPerHa.toFixed(1)} — ${crop.yieldHighPerHa.toFixed(1)}`} unit="t/ha" interp="" />
                              <SoilCard label={lang === 'fr' ? `Production totale (${area.toFixed(1)} ha)` : `Total output (${area.toFixed(1)} ha)`} value={`${crop.yieldLow.toFixed(1)} — ${crop.yieldHigh.toFixed(1)}`} unit="t" interp="" />
                              <SoilCard label={lang === 'fr' ? 'Prix/tonne' : 'Price/ton'} value={`${crop.pricePerTonLocal.toLocaleString('fr-FR')}`} unit={geo.currencySymbol} interp={`${crop.pricePerTon} USD/t`} />
                              <SoilCard label={lang === 'fr' ? 'Revenu brut' : 'Revenue'} value={fmtCur(crop.revenueLow, geo)} unit={`→ ${fmtCur(crop.revenueHigh, geo)}`} interp="" />
                              <SoilCard label={lang === 'fr' ? 'Coûts totaux' : 'Total costs'} value={fmtCur(crop.costsLow, geo)} unit={`→ ${fmtCur(crop.costsHigh, geo)}`} interp="" />
                              <SoilCard label={lang === 'fr' ? 'Marge nette' : 'Net margin'} value={fmtCur(crop.marginLow, geo)} unit={`→ ${fmtCur(crop.marginHigh, geo)}`}
                                interp={crop.marginLow > 0 ? '🟢' : '🔴'} />
                            </div>
                            {/* Cost breakdown */}
                            <div className="rounded-lg bg-secondary/30 p-3">
                              <div className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider">
                                {lang === 'fr' ? 'Décomposition des coûts' : 'Cost breakdown'}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                <SoilCard label={lang === 'fr' ? 'Semences' : 'Seeds'} value={fmtCur(crop.costBreakdown.seeds, geo)} unit="" interp="" />
                                <SoilCard label={lang === 'fr' ? 'Main d\'œuvre' : 'Labor'} value={fmtCur(crop.costBreakdown.labor, geo)} unit="" interp="" />
                                <SoilCard label={lang === 'fr' ? 'Engrais' : 'Fertilizer'} value={fmtCur(crop.costBreakdown.fertilizer, geo)} unit="" interp="" />
                                <SoilCard label={lang === 'fr' ? 'Phytosanitaire' : 'Phytosanitary'} value={fmtCur(crop.costBreakdown.phyto, geo)} unit="" interp="" />
                                <SoilCard label="Transport" value={fmtCur(crop.costBreakdown.transport, geo)} unit="" interp="" />
                              </div>
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-2">
                              {lang === 'fr'
                                ? `Source : FAOSTAT 2022-2023 + indice d'inflation CIRAD/Cyclope 2024 projeté ${crop.forecastYear}. Prix ajustés IFDC Africa, AfricaRice, IITA.`
                                : `Source: FAOSTAT 2022-2023 + CIRAD/Cyclope 2024 inflation index projected ${crop.forecastYear}. Prices adjusted IFDC Africa, AfricaRice, IITA.`}
                            </p>
                          </div>

                          {/* Cycle */}
                          <div className="rounded-xl border border-border bg-card p-4">
                            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {lang === 'fr' ? 'Calendrier cultural' : 'Crop calendar'}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <span className="bg-primary/20 text-primary px-2 py-1 rounded-lg font-semibold">
                                {lang === 'fr' ? 'Semis' : 'Sowing'}: {L_(crop.sowingWindow)}
                              </span>
                              <span>→</span>
                              <span className="bg-secondary px-2 py-1 rounded-lg">
                                {lang === 'fr' ? 'Récolte' : 'Harvest'}: {L_(crop.harvestWindow)} ({crop.cycleDays} j)
                              </span>
                              <span>→</span>
                              <span className="bg-gold/20 text-gold px-2 py-1 rounded-lg font-semibold">
                                {lang === 'fr' ? 'Vente' : 'Sale'}: {L_(crop.saleWindow)}
                              </span>
                            </div>
                          </div>

                          {/* Association */}
                          <div className="rounded-xl border border-border bg-card p-3">
                            <div className="text-xs font-bold text-foreground">🌱 {lang === 'fr' ? 'Association' : 'Association'}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{L_(crop.association)}</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Crop scores comparison bar chart */}
            <div className="rounded-xl border border-border bg-card p-4 mb-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {lang === 'fr' ? 'Comparaison des scores' : 'Score comparison'}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analysis.topCrops.map(c => ({ name: c.name[lang].substring(0, 10), score: c.score }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="score" fill="hsl(150,55%,41%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ─── ROTATION ────────────────────────────────────────────── */}
            {analysis.rotation.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 mb-4">
                <h3 className="text-sm font-bold text-foreground mb-2">🔄 {lang === 'fr' ? 'Rotation culturale — 3 ans' : 'Crop rotation — 3 years'}</h3>
                <div className="space-y-2">
                  {analysis.rotation.map(r => (
                    <div key={r.year} className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {r.year}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-foreground">{L_(r.crop)}</span>
                        <span className="text-[11px] text-muted-foreground ml-1">— {L_(r.reason)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── ALLOCATION ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-4 mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2">📊 {lang === 'fr' ? 'Plan subsistance / rente' : 'Subsistence / cash plan'}</h3>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 bg-primary/10 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-primary">{Math.round(analysis.allocationFood * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">{lang === 'fr' ? 'Alimentation' : 'Food'}</div>
                </div>
                <div className="flex-1 bg-gold/10 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-gold">{Math.round(analysis.allocationCash * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">{lang === 'fr' ? 'Rente' : 'Cash'}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{L_(analysis.allocationDescription)}</p>
            </div>

            {/* ─── CURRENT WEATHER ────────────────────────────────────── */}
            {weather && (
              <div className="rounded-xl border border-border bg-card p-4 mb-4">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-primary" /> {lang === 'fr' ? 'Météo actuelle' : 'Current weather'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <SoilCard label={lang === 'fr' ? 'Temp.' : 'Temp.'} value={weather.temp.toFixed(1)} unit="°C" interp="" />
                  <SoilCard label={lang === 'fr' ? 'Humidité' : 'Humidity'} value={String(weather.humidity)} unit="%" interp="" />
                  <SoilCard label={lang === 'fr' ? 'Vent' : 'Wind'} value={weather.wind_speed.toFixed(1)} unit="m/s" interp="" />
                  <SoilCard label={lang === 'fr' ? 'Pluie' : 'Rain'} value={weather.rain_1h.toFixed(1)} unit="mm/h" interp="" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  {lang === 'fr' ? 'Source : OpenWeatherMap — données du jour, non utilisées dans le scoring.' : 'Source: OpenWeatherMap — current day only, not used in scoring.'}
                </p>
              </div>
            )}

            {/* Farmer notes */}
            {(farmerPrevCrop || farmerBudget || farmerSoilObs) && (
              <div className="rounded-xl border border-border bg-card p-4 mb-4">
                <h3 className="text-sm font-bold text-foreground mb-2">📝 {lang === 'fr' ? 'Données terrain saisies' : 'Field data entered'}</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {farmerPrevCrop && <div><span className="font-semibold text-foreground">{lang === 'fr' ? 'Culture précédente' : 'Previous crop'}:</span> {farmerPrevCrop}</div>}
                  {farmerBudget && <div><span className="font-semibold text-foreground">{lang === 'fr' ? 'Budget intrants' : 'Input budget'}:</span> {farmerBudget}</div>}
                  {farmerSoilObs && <div><span className="font-semibold text-foreground">{lang === 'fr' ? 'Observation sol' : 'Soil obs.'}:</span> {farmerSoilObs}</div>}
                </div>
              </div>
            )}

            {/* Confidence warning */}
            {analysis.confidenceIndex < 60 && (
              <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 mb-4">
                <p className="text-xs text-muted-foreground">⚠️ {L_(analysis.confidenceLabel)}</p>
              </div>
            )}

            {/* Sources */}
            <p className="text-[9px] text-muted-foreground text-center mb-4 px-4">
              Sources : SoilGrids ISRIC/NASA · ERA5 ECMWF/Copernicus 1991-2020 · FAO EcoCrop · CIRAD · IITA · FAOSTAT 2022-2023
            </p>

            {/* New analysis */}
            <button onClick={resetDraw} className="w-full py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-4">
              {lang === 'fr' ? 'Nouvelle analyse' : 'New analysis'}
            </button>
          </motion.div>
        )}
      </div>

      {/* ─── FIXED BOTTOM BAR ──────────────────────────────────────── */}
      {step === 'results' && analysis && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-t border-border p-3">
          <div className="max-w-5xl mx-auto flex gap-3">
            <button onClick={saveToDashboard} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90">
              <Save className="w-4 h-4" /> {t('soil.save_dashboard')}
            </button>
            <button onClick={downloadPDF} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={downloadCSV} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <FileSpreadsheet className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

function InfoCard({ label, value, icon: Icon, valueClass }: { label: string; value: string; icon?: any; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </div>
      <div className={`text-sm font-bold truncate ${valueClass || 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function SoilCard({ label, value, unit, interp }: { label: string; value: string; unit: string; interp: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold text-foreground">
        {value} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>
      </div>
      {interp && <div className="text-[10px] text-muted-foreground mt-0.5">{interp}</div>}
    </div>
  );
}

function fmtCur(amount: number, geo: GeoLocation): string {
  if (amount < 0) return `-${fmtCur(Math.abs(amount), geo)}`;
  return `${Math.round(amount).toLocaleString('fr-FR')} ${geo.currencySymbol}`;
}
