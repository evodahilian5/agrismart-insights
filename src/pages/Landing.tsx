import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Leaf, BarChart3, Users, Droplets, Sun, TrendingUp, ArrowRight } from 'lucide-react';
import heroImg from '@/assets/hero-crops.webp';
import soilImg from '@/assets/soil-hands.jpg';

export default function Landing() {
  const { t } = useApp();

  const features = [
    { icon: BarChart3, title: t('landing.feature1.title'), desc: t('landing.feature1.desc'), color: 'from-green-accent to-green-light' },
    { icon: Sun, title: t('landing.feature2.title'), desc: t('landing.feature2.desc'), color: 'from-gold to-green-accent' },
    { icon: Users, title: t('landing.feature3.title'), desc: t('landing.feature3.desc'), color: 'from-green-light to-green-accent' },
  ];

  const stats = [
    { value: '50+', label: 'Cultures analysées' },
    { value: '99%', label: 'Fiabilité données' },
    { value: '24/7', label: 'Météo temps réel' },
    { value: '∞', label: 'Parcelles' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <img src={heroImg} alt="Agricultural farmland" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Leaf className="w-4 h-4 text-green-accent" />
              <span className="text-sm font-medium text-primary-foreground/90">AgriSmartConnect</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-primary-foreground leading-tight mb-6 whitespace-pre-line">
              {t('landing.title')}
            </h1>
            <p className="text-lg sm:text-xl text-primary-foreground/75 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('landing.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?role=farmer" className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-green-accent/20 flex items-center justify-center gap-2">
                {t('landing.farmer')} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/auth?role=company" className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-bold glass text-primary-foreground hover:bg-primary-foreground/10 transition-all flex items-center justify-center gap-2">
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
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-1">
            <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60" />
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
              <div className="text-sm text-primary-foreground/60">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
              {t('landing.feature2.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t('landing.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="group glass-strong rounded-3xl p-8 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA with soil image */}
      <section className="relative py-32 overflow-hidden">
        <img src={soilImg} alt="Soil analysis" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-5xl font-black text-primary-foreground mb-6">
              {t('landing.feature1.title')}
            </h2>
            <p className="text-lg text-primary-foreground/75 mb-10">
              {t('landing.feature1.desc')}
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all">
              {t('nav.signup')} <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-green-deep text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-green-accent" />
          <span className="font-bold text-primary-foreground">AgriSmartConnect</span>
        </div>
        <p className="text-sm text-primary-foreground/50">© 2026 AgriSmartConnect. All rights reserved.</p>
      </footer>
    </div>
  );
}
