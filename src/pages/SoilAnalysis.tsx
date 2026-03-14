import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { fetchSoilData, SoilData } from '@/lib/soilgrids';
import { fetchCurrentWeather, CurrentWeather } from '@/lib/weather';
import { fetchClimateNormals, reverseGeocode, ClimateData, GeoLocation } from '@/lib/climate-api';
import { runFullAnalysis, AnalysisResult, CropScore, AgroZone, determineZoneWithCoords } from '@/lib/agro-engine';
import L from 'leaflet';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Download, Save, Loader2, Droplets, Thermometer, Wind, CloudRain, Leaf, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, MapPin, Zap, X } from 'lucide-react';
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
  positionsRef.current = positions;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(center, 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    mapRef.current = map;
    map.on('click', (e: L.LeafletMouseEvent) => {
      setPositions([...positionsRef.current, { lat: e.latlng.lat, lng: e.latlng.lng }]);
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
  return Math.round(area / 10000 * 100) / 100;
}

// ─── GRADE COLORS ────────────────────────────────────────────────────────────

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

// ─── ZONE ICONS ──────────────────────────────────────────────────────────────

const ZONE_ICONS: Record<AgroZone, string> = {
  sahelian: '🏜️', sudanian: '🌾', guinean: '🌴', mediterranean: '🫒', mountain_med: '⛰️',
};

// ─── LOADING STEPS ───────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { fr: 'Interrogation SoilGrids ISRIC/NASA...', en: 'Querying SoilGrids ISRIC/NASA...' },
  { fr: 'Récupération normales climatiques ERA5 1991-2020...', en: 'Retrieving ERA5 climate normals 1991-2020...' },
  { fr: 'Géocodage inverse Nominatim...', en: 'Reverse geocoding Nominatim...' },
  { fr: 'Calcul bilan hydrique mensuel...', en: 'Computing monthly water balance...' },
  { fr: 'Détermination zone agro-écologique...', en: 'Determining agro-ecological zone...' },
  { fr: 'Analyse risques agronomiques...', en: 'Analyzing agronomic risks...' },
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
  const resultsRef = useRef<HTMLDivElement>(null);

  const area = calculateArea(positions);
  const center: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p.lat, 0) / positions.length, positions.reduce((s, p) => s + p.lng, 0) / positions.length]
    : [7.5, 2.5];

  const analyze = async () => {
    if (positions.length < 3) return;
    setLoading(true); setError(null); setLoadingStep(0);
    const lat = center[0], lon = center[1];

    try {
      setLoadingStep(0);
      const soil = await fetchSoilData(lat, lon);
      if (!soil.isReal) {
        setError(lang === 'fr'
          ? 'Les données sol SoilGrids ne sont pas disponibles pour cette zone. L\'analyse ne peut pas être réalisée avec fiabilité.'
          : 'SoilGrids soil data is not available for this area. Analysis cannot be reliably performed.');
        setLoading(false);
        return;
      }
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
      // Small delay for UX
      await new Promise(r => setTimeout(r, 300));
      setLoadingStep(5);
      await new Promise(r => setTimeout(r, 300));
      setLoadingStep(6);

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

  const downloadPDF = () => {
    if (!analysis || !soilData || !geo) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    let y = 15;

    pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
    pdf.text('AgriSmartConnect — Rapport d\'Analyse', w / 2, y, { align: 'center' }); y += 10;

    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
    pdf.text(`Parcelle : ${parcelName || 'Sans nom'} | Surface : ${area.toFixed(2)} ha`, 15, y); y += 6;
    pdf.text(`Zone : ${analysis.zoneLabel[lang]} | Pays : ${geo.country} | Date : ${new Date().toLocaleDateString('fr-FR')}`, 15, y); y += 6;
    pdf.text(`Indice de confiance : ${analysis.confidenceIndex}% — ${analysis.confidenceLabel[lang]}`, 15, y); y += 10;

    // Top 3
    pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
    pdf.text('Top 3 cultures recommandées', 15, y); y += 8;
    analysis.topCrops.slice(0, 3).forEach((c, i) => {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.text(`${i + 1}. ${c.name[lang]} — ${c.score}% (${GRADE_LABELS[c.grade][lang]})`, 15, y); y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Semis : ${c.sowingWindow[lang]} | Récolte : ${c.harvestWindow[lang]}`, 20, y); y += 5;
      pdf.text(`Marge nette : ${formatCurrency(c.marginLow, geo)} à ${formatCurrency(c.marginHigh, geo)}`, 20, y); y += 7;
    });

    // Economics
    if (analysis.topCrops[0]) {
      const c = analysis.topCrops[0];
      y += 3;
      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text(`Économie — ${c.name[lang]}`, 15, y); y += 7;
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text(`Revenu brut : ${formatCurrency(c.revenueLow, geo)} à ${formatCurrency(c.revenueHigh, geo)}`, 15, y); y += 5;
      pdf.text(`Coûts estimés : ${formatCurrency(c.costsLow, geo)} à ${formatCurrency(c.costsHigh, geo)}`, 15, y); y += 5;
      pdf.text(`Marge nette : ${formatCurrency(c.marginLow, geo)} à ${formatCurrency(c.marginHigh, geo)}`, 15, y); y += 8;
    }

    // Allocation
    pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
    pdf.text('Plan subsistance / rente', 15, y); y += 7;
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
    pdf.text(analysis.allocationDescription[lang], 15, y, { maxWidth: w - 30 }); y += 12;

    // Rotation
    pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
    pdf.text('Rotation 3 ans', 15, y); y += 7;
    analysis.rotation.forEach(r => {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text(`An ${r.year} : ${r.crop[lang]} — ${r.reason[lang]}`, 15, y); y += 5;
    });

    // Footer
    y = pdf.internal.pageSize.getHeight() - 10;
    pdf.setFontSize(7);
    pdf.text('Données : SoilGrids ISRIC/NASA · ERA5 Open-Meteo · EcoCrop FAO · CIRAD · IITA · FAOSTAT 2022-2023', w / 2, y, { align: 'center' });

    pdf.save(`AgriSmartConnect_${parcelName || 'analyse'}.pdf`);
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
                <div className="liquid-glass-card rounded-2xl p-1.5 h-[400px] sm:h-[450px] relative">
                  <LeafletMap positions={positions} setPositions={setPositions} center={center} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="liquid-glass-card rounded-xl p-4">
                  <label className="text-xs font-semibold text-foreground block mb-1.5">{t('soil.parcel_name')}</label>
                  <input type="text" value={parcelName} onChange={e => setParcelName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="liquid-glass-card rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">{t('soil.area')}</div>
                  <div className="text-xl font-bold text-foreground">{area > 0 ? `${area} ha` : '—'}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{positions.length} points</div>
                </div>

                {/* Irrigation toggle */}
                <div className="liquid-glass-card rounded-xl p-4">
                  <label className="text-xs font-semibold text-foreground block mb-2">
                    {lang === 'fr' ? 'Avez-vous accès à un point d\'eau pour irriguer votre parcelle ?' : 'Do you have access to a water point to irrigate your plot?'}
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
                  className="liquid-glass-card rounded-2xl p-6 mb-6">
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

            {/* Error */}
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

            {/* Zone Badge */}
            <div className="liquid-glass-card rounded-xl p-4 mb-4 flex items-center gap-3">
              <span className="text-3xl">{ZONE_ICONS[analysis.zone]}</span>
              <div>
                <div className="text-lg font-bold text-foreground">{L_(analysis.zoneLabel)}</div>
                <div className="text-xs text-muted-foreground">{L_(analysis.zoneDescription)}</div>
              </div>
            </div>

            {/* Parcel Info + Confidence */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="liquid-glass-card rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang === 'fr' ? 'Parcelle' : 'Plot'}</div>
                <div className="text-sm font-bold text-foreground truncate">{parcelName || '—'}</div>
              </div>
              <div className="liquid-glass-card rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang === 'fr' ? 'Surface' : 'Area'}</div>
                <div className="text-sm font-bold text-foreground">{area.toFixed(2)} ha</div>
              </div>
              <div className="liquid-glass-card rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" />{lang === 'fr' ? 'Pays' : 'Country'}</div>
                <div className="text-sm font-bold text-foreground">{geo.country}</div>
              </div>
              <div className="liquid-glass-card rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3" />{lang === 'fr' ? 'Confiance' : 'Confidence'}</div>
                <div className={`text-sm font-bold ${analysis.confidenceIndex >= 80 ? 'text-primary' : analysis.confidenceIndex >= 60 ? 'text-gold' : 'text-destructive'}`}>
                  {analysis.confidenceIndex}%
                </div>
              </div>
            </div>

            {/* Agronomic Risks */}
            {analysis.risks.length > 0 && (
              <div className="mb-4 space-y-2">
                {analysis.risks.map((risk, i) => (
                  <div key={i} className={`liquid-glass-card rounded-xl p-3 border-l-4 ${risk.level === 'red' ? 'border-l-destructive' : risk.level === 'orange' ? 'border-l-gold' : 'border-l-muted-foreground'}`}>
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
                    className="w-full text-left liquid-glass-card rounded-xl p-4 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-black text-foreground">{i + 1}</div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{L_(crop.name)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {lang === 'fr' ? 'Semis' : 'Sowing'}: {L_(crop.sowingWindow)} · {L_(crop.association).substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black" style={{ color: GRADE_COLORS[crop.grade].bg }}>{crop.score}%</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: GRADE_COLORS[crop.grade].bg, color: GRADE_COLORS[crop.grade].text }}>
                          {GRADE_LABELS[crop.grade][lang]}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* ─── CROP DETAIL ─────────────────────────────────────── */}
                  <AnimatePresence>
                    {selectedCropIdx === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="mt-2 space-y-3">

                          {/* Radar Chart */}
                          <div className="liquid-glass-card rounded-xl p-4">
                            <ResponsiveContainer width="100%" height={220}>
                              <RadarChart data={[
                                { axis: 'pH', score: crop.subScores.ph },
                                { axis: 'Texture', score: crop.subScores.texture },
                                { axis: lang === 'fr' ? 'Température' : 'Temperature', score: crop.subScores.temp },
                                { axis: lang === 'fr' ? 'Pluie' : 'Rainfall', score: crop.subScores.rain },
                                { axis: lang === 'fr' ? 'Azote' : 'Nitrogen', score: crop.subScores.nitrogen },
                              ]}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                              </RadarChart>
                            </ResponsiveContainer>
                            {/* Legend */}
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

                          {/* Soil interpretations */}
                          <div className="liquid-glass-card rounded-xl p-4">
                            <h4 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? 'Interprétation sol' : 'Soil interpretation'}</h4>
                            <div className="space-y-2">
                              {analysis.soilInterpretations.map((s, j) => (
                                <div key={j} className="text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground">{s.label} : {s.value}</span> — {L_(s.interpretation)}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Input recommendations */}
                          {crop.inputRecommendations.length > 0 && (
                            <div className="liquid-glass-card rounded-xl p-4">
                              <h4 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? 'Recommandations d\'intrants' : 'Input recommendations'}</h4>
                              {crop.inputRecommendations.map((rec, j) => (
                                <div key={j} className={`p-2 rounded-lg mb-1.5 ${rec.type === 'organic' ? 'bg-primary/10' : 'bg-secondary'}`}>
                                  <div className="text-xs font-bold text-foreground">{rec.type === 'organic' ? '🌿' : '⚗️'} {L_(rec.name)}</div>
                                  <div className="text-[11px] text-muted-foreground">{rec.quantity} — {L_(rec.timing)}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Economics */}
                          <div className="liquid-glass-card rounded-xl p-4">
                            <h4 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? 'Estimation économique' : 'Economic estimate'}</h4>
                            <div className="space-y-1.5">
                              <EcoRow label={lang === 'fr' ? 'Rendement estimé' : 'Estimated yield'} value={`${crop.yieldLow.toFixed(1)} à ${crop.yieldHigh.toFixed(1)} t/ha`} />
                              <EcoRow label={lang === 'fr' ? 'Revenu brut' : 'Gross revenue'} value={`${formatCurrency(crop.revenueLow, geo)} à ${formatCurrency(crop.revenueHigh, geo)}`} />
                              <EcoRow label={lang === 'fr' ? 'Coûts estimés' : 'Estimated costs'} value={`${formatCurrency(crop.costsLow, geo)} à ${formatCurrency(crop.costsHigh, geo)}`} />
                              <div className="border-t border-border pt-1.5">
                                <EcoRow label={lang === 'fr' ? 'Marge nette estimée' : 'Estimated net margin'}
                                  value={`${formatCurrency(crop.marginLow, geo)} à ${formatCurrency(crop.marginHigh, geo)}`} bold />
                              </div>
                            </div>
                          </div>

                          {/* Cash flow cycle */}
                          <div className="liquid-glass-card rounded-xl p-4">
                            <h4 className="text-sm font-bold text-foreground mb-2">{lang === 'fr' ? 'Cycle de trésorerie' : 'Cash flow cycle'}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <span className="bg-primary/20 text-primary px-2 py-1 rounded-lg font-semibold">
                                {lang === 'fr' ? 'Semis' : 'Sowing'}: {L_(crop.sowingWindow)}
                              </span>
                              <span>→</span>
                              <span className="bg-secondary px-2 py-1 rounded-lg">
                                {lang === 'fr' ? 'Récolte' : 'Harvest'}: {L_(crop.harvestWindow)} ({crop.cycleDays} {lang === 'fr' ? 'jours' : 'days'})
                              </span>
                              <span>→</span>
                              <span className="bg-gold/20 text-gold px-2 py-1 rounded-lg font-semibold">
                                {lang === 'fr' ? 'Vente' : 'Sale'}: {L_(crop.saleWindow)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* ─── ASSOCIATIONS & SYSTEMS ──────────────────────────────── */}
            <div className="liquid-glass-card rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                🌳 {lang === 'fr' ? 'Système cultural recommandé' : 'Recommended farming system'}
              </h3>
              <p className="text-xs text-muted-foreground">{L_(analysis.associationSystem)}</p>
            </div>

            {/* ─── ROTATION ────────────────────────────────────────────── */}
            {analysis.rotation.length > 0 && (
              <div className="liquid-glass-card rounded-xl p-4 mb-4">
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
            <div className="liquid-glass-card rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2">📊 {lang === 'fr' ? 'Plan subsistance / rente' : 'Subsistence / cash plan'}</h3>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 bg-primary/20 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-primary">{Math.round(analysis.allocationFood * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">{lang === 'fr' ? 'Alimentation' : 'Food'}</div>
                </div>
                <div className="flex-1 bg-gold/20 rounded-lg p-2 text-center">
                  <div className="text-lg font-black text-gold">{Math.round(analysis.allocationCash * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">{lang === 'fr' ? 'Rente' : 'Cash'}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{L_(analysis.allocationDescription)}</p>
            </div>

            {/* ─── CURRENT WEATHER ────────────────────────────────────── */}
            {weather && (
              <div className="liquid-glass-card rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-primary" /> {lang === 'fr' ? 'Météo actuelle sur la parcelle' : 'Current weather on plot'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <MiniTablet icon={Thermometer} label={lang === 'fr' ? 'Temp.' : 'Temp.'} value={`${weather.temp.toFixed(1)}°C`} />
                  <MiniTablet icon={Droplets} label={lang === 'fr' ? 'Humidité' : 'Humidity'} value={`${weather.humidity}%`} />
                  <MiniTablet icon={Wind} label={lang === 'fr' ? 'Vent' : 'Wind'} value={`${weather.wind_speed} m/s`} />
                  <MiniTablet icon={CloudRain} label={lang === 'fr' ? 'Pluie' : 'Rain'} value={`${weather.rain_1h.toFixed(1)} mm/h`} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  {lang === 'fr' ? 'Source : OpenWeatherMap — données du jour uniquement, non utilisées dans le scoring cultural.' : 'Source: OpenWeatherMap — current day only, not used in crop scoring.'}
                </p>
              </div>
            )}

            {/* ─── RAW DATA ACCORDION ─────────────────────────────────── */}
            <button onClick={() => setShowRawData(!showRawData)}
              className="w-full liquid-glass-card rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {lang === 'fr' ? 'Données sol détaillées (pour agronomes)' : 'Detailed soil data (for agronomists)'}
              </span>
              {showRawData ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {showRawData && soilData && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4">
                  <div className="liquid-glass-card rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <RawDataItem label="pH" value={soilData.ph.toFixed(2)} source="SoilGrids ISRIC" />
                      <RawDataItem label={lang === 'fr' ? 'Azote' : 'Nitrogen'} value={`${soilData.nitrogen.toFixed(3)} g/kg (${soilData.nitrogenKgHa.toFixed(0)} kg/ha)`} source="SoilGrids + FAO" />
                      <RawDataItem label="SOC" value={`${soilData.soc.toFixed(1)} g/kg`} source="SoilGrids ISRIC" />
                      <RawDataItem label="CEC" value={`${soilData.cec.toFixed(1)} cmol/kg`} source="SoilGrids ISRIC" />
                      <RawDataItem label={lang === 'fr' ? 'Argile' : 'Clay'} value={`${soilData.clay.toFixed(1)}%`} source="SoilGrids ISRIC" />
                      <RawDataItem label={lang === 'fr' ? 'Sable' : 'Sand'} value={`${soilData.sand.toFixed(1)}%`} source="SoilGrids ISRIC" />
                      <RawDataItem label={lang === 'fr' ? 'Limon' : 'Silt'} value={`${soilData.silt.toFixed(1)}%`} source="SoilGrids ISRIC" />
                      <RawDataItem label={lang === 'fr' ? 'Densité 0-30' : 'Density 0-30'} value={`${soilData.bdod.toFixed(2)} g/cm³`} source="SoilGrids ISRIC" />
                      <RawDataItem label={lang === 'fr' ? 'Densité 30-60' : 'Density 30-60'} value={`${soilData.bdodDeep.toFixed(2)} g/cm³`} source="SoilGrids ISRIC" />
                      <RawDataItem label={lang === 'fr' ? 'Frag. grossiers' : 'Coarse frag.'} value={`${soilData.cfvo.toFixed(1)}%`} source="SoilGrids ISRIC" />
                      <RawDataItem label="OCD" value={`${soilData.ocd.toFixed(1)} kg/m³`} source="SoilGrids ISRIC" />
                    </div>
                    {climate && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-xs font-bold text-foreground mb-1">{lang === 'fr' ? 'Normales climatiques' : 'Climate normals'} {climate.isFallback ? '(estimation)' : '(ERA5 2014-2023)'}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <RawDataItem label={lang === 'fr' ? 'Pluie annuelle' : 'Annual rain'} value={`${climate.annualRainfall} mm`} source={climate.isFallback ? 'Estimation' : 'ERA5'} />
                          <RawDataItem label={lang === 'fr' ? 'Mois déficit' : 'Deficit months'} value={`${climate.deficitMonths}/12`} source={climate.isFallback ? 'Estimation' : 'ERA5'} />
                          <RawDataItem label={lang === 'fr' ? 'Temp. corrigée' : 'Corrected temp'} value={`${climate.correctedTemp.toFixed(1)}°C`} source={climate.isFallback ? 'Estimation' : 'ERA5'} />
                          <RawDataItem label={lang === 'fr' ? 'Altitude' : 'Elevation'} value={`${climate.altitude} m`} source="Open-Meteo" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confidence warning */}
            {analysis.confidenceIndex < 60 && (
              <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 mb-4">
                <p className="text-xs text-muted-foreground">
                  ⚠️ {L_(analysis.confidenceLabel)}
                </p>
              </div>
            )}

            {/* Data source footer */}
            <p className="text-[9px] text-muted-foreground text-center mb-4 px-4">
              Données : SoilGrids ISRIC/NASA · ERA5 Open-Meteo · EcoCrop FAO · CIRAD · IITA · FAOSTAT 2022-2023
            </p>

            {/* New analysis button */}
            <button onClick={resetDraw} className="w-full py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-4">
              {lang === 'fr' ? 'Nouvelle analyse' : 'New analysis'}
            </button>
          </motion.div>
        )}
      </div>

      {/* ─── FIXED BOTTOM BAR ──────────────────────────────────────── */}
      {step === 'results' && analysis && (
        <div className="fixed bottom-0 left-0 right-0 z-40 liquid-glass p-3">
          <div className="max-w-5xl mx-auto flex gap-3">
            <button onClick={saveToDashboard} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90">
              <Save className="w-4 h-4" /> {t('soil.save_dashboard')}
            </button>
            <button onClick={downloadPDF} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

function MiniTablet({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3 text-primary" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

function EcoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? 'font-bold text-foreground' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function RawDataItem({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="bg-secondary/30 rounded-lg p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-bold text-foreground">{value}</div>
      <div className="text-[9px] text-muted-foreground/60">Source: {source}</div>
    </div>
  );
}

function formatCurrency(amount: number, geo: GeoLocation): string {
  if (amount < 0) return `-${formatCurrency(Math.abs(amount), geo)}`;
  const formatted = Math.round(amount).toLocaleString('fr-FR');
  return `${formatted} ${geo.currencySymbol}`;
}
