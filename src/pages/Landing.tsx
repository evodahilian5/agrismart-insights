import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Leaf, BarChart3, Users, Droplets, Sun, TrendingUp, ArrowRight, MapPin, Cpu, FileText, Satellite, FlaskConical } from 'lucide-react';
import heroImg from '@/assets/hero-crops.webp';
import soilImg from '@/assets/soil-hands.jpg';

export default function Landing() {
  const { t, lang } = useApp();

  const features = [
    { icon: Satellite, title: lang === 'fr' ? 'Données Satellite' : 'Satellite Data', desc: lang === 'fr' ? 'Propriétés physiques et chimiques du sol via SoilGrids ISRIC/NASA avec fallback OpenLandMap.' : 'Physical and chemical soil properties via SoilGrids ISRIC/NASA with OpenLandMap fallback.', color: 'from-primary to-accent' },
    { icon: Sun, title: lang === 'fr' ? 'Climat & Météo' : 'Climate & Weather', desc: lang === 'fr' ? 'Normales climatiques ERA5 sur 30 ans et météo temps réel OpenWeatherMap.' : '30-year ERA5 climate normals and real-time OpenWeatherMap weather.', color: 'from-gold to-accent' },
    { icon: Users, title: lang === 'fr' ? 'Marché Agricole' : 'Agri Market', desc: lang === 'fr' ? 'Publiez vos récoltes, trouvez des acheteurs et connectez-vous à la communauté agricole.' : 'Publish your harvests, find buyers and join the agricultural community.', color: 'from-accent to-primary' },
  ];

  const steps = [
    { num: '01', icon: MapPin, title: lang === 'fr' ? 'Tracez votre parcelle' : 'Draw your plot', desc: lang === 'fr' ? 'Dessinez les contours de votre parcelle sur la carte interactive.' : 'Draw your plot boundaries on the interactive map.' },
    { num: '02', icon: FlaskConical, title: lang === 'fr' ? 'Analyse automatique' : 'Automatic analysis', desc: lang === 'fr' ? 'SoilGrids ISRIC/NASA analyse pH, azote, argile, carbone organique, CEC et densité.' : 'SoilGrids ISRIC/NASA analyzes pH, nitrogen, clay, organic carbon, CEC and density.' },
    { num: '03', icon: Cpu, title: lang === 'fr' ? 'Scoring multicritère' : 'Multi-criteria scoring', desc: lang === 'fr' ? 'Notre moteur croise sol, climat ERA5 30 ans et exigences de 21 cultures pour un scoring précis.' : 'Our engine crosses soil, 30-year ERA5 climate and 21 crop requirements for precise scoring.' },
    { num: '04', icon: FileText, title: lang === 'fr' ? 'Rapport complet' : 'Full report', desc: lang === 'fr' ? 'Téléchargez vos résultats en PDF ou CSV : recommandations, intrants, prévisions économiques.' : 'Download results as PDF or CSV: recommendations, inputs, economic forecasts.' },
  ];

  const stats = [
    { value: '21', label: lang === 'fr' ? 'Cultures analysées' : 'Crops analyzed' },
    { value: '11', label: lang === 'fr' ? 'Paramètres du sol' : 'Soil parameters' },
    { value: '30 ans', label: lang === 'fr' ? 'Normales climatiques' : 'Climate normals' },
    { value: '∞', label: lang === 'fr' ? 'Parcelles' : 'Plots' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — image fully visible, no blur */}
      <section className="relative h-screen flex items-end sm:items-center overflow-hidden pb-24 sm:pb-0">
        <img src={heroImg} alt="Agricultural farmland with crops" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        <div className="relative z-10 text-left px-6 sm:px-12 lg:px-20 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-lg">
              {lang === 'fr' ? (
                <>L'Agriculture<br />Intelligente,<br /><span className="text-green-400">Connectée.</span></>
              ) : (
                <>Smart<br />Agriculture,<br /><span className="text-green-400">Connected.</span></>
              )}
            </h1>
            <p className="text-base sm:text-lg text-white/90 max-w-xl mb-10 leading-relaxed drop-shadow-md">
              {lang === 'fr'
                ? "Analysez vos sols, optimisez vos cultures et connectez-vous avec le marché agricole."
                : 'Analyze your soils, optimize your crops and connect to the agricultural market.'}
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link to="/auth?role=farmer" className="px-8 py-4 rounded-2xl text-lg font-bold bg-green-gradient text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2">
                {t('landing.farmer')} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/auth?role=company" className="px-8 py-4 rounded-2xl text-lg font-bold bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 transition-all flex items-center gap-2">
                {t('landing.company')}
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-white/70" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-green-deep">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-gradient mb-1">{s.value}</div>
              <div className="text-sm text-white/60">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Analysis Steps */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
              {lang === 'fr' ? "Comment ça marche ?" : 'How does it work?'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {lang === 'fr' ? "De la carte au rapport, en 4 étapes simples." : 'From map to report, in 4 simple steps.'}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="relative group">
                <div className="rounded-2xl border border-border bg-card p-6 hover:shadow-xl hover:border-accent/50 transition-all duration-300 h-full">
                  <div className="text-5xl font-black text-accent/15 absolute top-4 right-4">{s.num}</div>
                  <div className="w-12 h-12 rounded-xl bg-green-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
              {lang === 'fr' ? 'Fonctionnalités' : 'Features'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="group rounded-2xl border border-border bg-card p-8 hover:shadow-xl hover:border-accent/50 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bientôt sur le terrain */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-gradient mx-auto mb-6 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
              {lang === 'fr' ? '🌍 Bientôt avec vous sur le terrain' : '🌍 Coming soon to the field'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              {lang === 'fr'
                ? "Pour plus de précision, nos équipes seront bientôt déployées avec des capteurs IoT, des drones et des kits d'analyse terrain."
                : 'For greater precision, our teams will soon be deployed with IoT sensors, drones and field analysis kits.'}
            </p>
            <p className="text-sm text-accent font-semibold">
              {lang === 'fr' ? 'Analyses in-situ · Capteurs temps réel · Drones de surveillance' : 'In-situ analysis · Real-time sensors · Surveillance drones'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 overflow-hidden">
        <img src={soilImg} alt="Soil analysis" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 drop-shadow-lg">
              {lang === 'fr' ? 'Analysez votre sol dès maintenant' : 'Analyze your soil now'}
            </h2>
            <p className="text-lg text-white/80 mb-10 drop-shadow">
              {lang === 'fr'
                ? "Tracez votre parcelle, obtenez vos résultats en quelques secondes. Gratuit et sans engagement."
                : 'Draw your plot, get your results in seconds. Free and no commitment.'}
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold bg-green-gradient text-white hover:opacity-90 transition-all shadow-lg">
              {t('nav.signup')} <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-green-deep text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-green-400" />
          <span className="font-bold text-white">AgriSmartConnect</span>
        </div>
        <p className="text-sm text-white/50">© 2026 AgriSmartConnect. All rights reserved.</p>
      </footer>
    </div>
  );
}
