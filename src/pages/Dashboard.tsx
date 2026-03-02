import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { Plus, MapPin, Droplets, TrendingUp, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { t, parcels, user, lang } = useApp();

  const totalArea = parcels.reduce((s, p) => s + p.area, 0);
  const avgSoilScore = parcels.length > 0
    ? Math.round(parcels.reduce((s, p) => {
        const ph = p.soilData?.ph ?? 6;
        const soc = p.soilData?.soc ?? 10;
        return s + Math.min(100, (ph / 7 * 40) + (soc / 20 * 30) + 30);
      }, 0) / parcels.length)
    : 0;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground">{t('dash.title')}</h1>
            <p className="text-muted-foreground">{user?.name ? `${lang === 'fr' ? 'Bienvenue' : 'Welcome'}, ${user.name}` : ''}</p>
          </div>
          <Link to="/analysis" className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> {t('dash.add')}
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: MapPin, label: t('dash.parcels'), value: `${parcels.length}`, sub: `${totalArea.toFixed(1)} ha` },
            { icon: Leaf, label: t('dash.soil_score'), value: `${avgSoilScore}/100`, sub: '' },
            { icon: TrendingUp, label: t('dash.yield'), value: parcels.length > 0 ? `${parcels.filter(p => p.cropAnalysis).reduce((s, p) => s + (p.cropAnalysis?.crop?.yield_potential ?? 0) * p.area, 0).toFixed(1)} t` : '—', sub: '' },
            { icon: Droplets, label: t('dash.water'), value: parcels.length > 0 ? `${parcels.filter(p => p.cropAnalysis).reduce((s, p) => s + (p.cropAnalysis?.waterNeed ?? 0) * p.area, 0).toFixed(0)} m³` : '—', sub: '' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <GlassCard variant="strong" className="p-5">
                <s.icon className="w-5 h-5 text-green-accent mb-2" />
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Parcels list */}
        {parcels.length === 0 ? (
          <GlassCard variant="strong" className="text-center py-16">
            <Leaf className="w-12 h-12 text-green-accent mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">{t('dash.no_parcels')}</p>
            <Link to="/analysis" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground">
              <Plus className="w-4 h-4" /> {t('dash.add')}
            </Link>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parcels.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard variant="strong" className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground">{p.name}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('soil.area')}</span>
                      <div className="font-bold text-foreground">{p.area} ha</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">pH</span>
                      <div className="font-bold text-foreground">{p.soilData?.ph?.toFixed(1) ?? '—'}</div>
                    </div>
                    {p.weatherData && (
                      <div>
                        <span className="text-muted-foreground">Temp</span>
                        <div className="font-bold text-foreground">{p.weatherData.temp?.toFixed(1)}°C</div>
                      </div>
                    )}
                    {p.cropAnalysis && (
                      <div>
                        <span className="text-muted-foreground">{lang === 'fr' ? 'Culture' : 'Crop'}</span>
                        <div className="font-bold text-foreground">{p.cropAnalysis.crop?.name?.[lang] ?? '—'}</div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
