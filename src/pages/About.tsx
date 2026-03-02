import { useApp } from '@/contexts/AppContext';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { Leaf, Target, Eye, Cpu, Satellite, Bot, Sprout } from 'lucide-react';
import droneImg from '@/assets/about-drone.jpg';

export default function About() {
  const { lang } = useApp();

  const timeline = [
    {
      icon: Sprout,
      title: lang === 'fr' ? 'Aujourd\'hui' : 'Today',
      desc: lang === 'fr' ? 'Analyse des sols par satellite, recommandations IA, connexion au marché agricole.' : 'Satellite soil analysis, AI recommendations, agricultural market connection.',
    },
    {
      icon: Satellite,
      title: lang === 'fr' ? 'Demain' : 'Tomorrow',
      desc: lang === 'fr' ? 'Équipes terrain pour analyses précises, drones de surveillance, capteurs IoT temps réel.' : 'Field teams for precise analysis, surveillance drones, real-time IoT sensors.',
    },
    {
      icon: Bot,
      title: lang === 'fr' ? 'Le futur' : 'The Future',
      desc: lang === 'fr' ? 'Robots agricoles autonomes, champs auto-correctifs en temps réel, IA prédictive avancée.' : 'Autonomous farming robots, self-correcting fields in real-time, advanced predictive AI.',
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img src={droneImg} alt="Agricultural technology" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-hero-gradient" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center px-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black text-primary-foreground mb-4">
            {lang === 'fr' ? 'À Propos' : 'About Us'}
          </h1>
          <p className="text-lg text-primary-foreground/75">
            {lang === 'fr'
              ? 'Nous croyons en une agriculture plus intelligente, plus durable et plus rentable pour chaque agriculteur.'
              : 'We believe in smarter, more sustainable and more profitable agriculture for every farmer.'}
          </p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* Mission */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GlassCard variant="strong" className="p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-green-gradient flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{lang === 'fr' ? 'Notre Mission' : 'Our Mission'}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {lang === 'fr'
                ? 'AgriSmartConnect est née d\'un constat simple : l\'agriculture est le pilier de nos économies, mais elle manque cruellement d\'outils technologiques accessibles. Notre mission est de démocratiser l\'accès aux données agronomiques, aux analyses de sol de précision et aux connexions commerciales pour chaque agriculteur, qu\'il soit petit exploitant ou agro-industriel.'
                : 'AgriSmartConnect was born from a simple observation: agriculture is the backbone of our economies, but it critically lacks accessible technological tools. Our mission is to democratize access to agronomic data, precision soil analysis and commercial connections for every farmer, whether small-scale or agro-industrial.'}
            </p>
          </GlassCard>
        </motion.div>

        {/* Vision */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <GlassCard variant="strong" className="p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-green-gradient flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{lang === 'fr' ? 'Notre Vision' : 'Our Vision'}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              {lang === 'fr'
                ? 'Nous imaginons un futur où chaque parcelle agricole est connectée, intelligente et auto-optimisée. Où les agriculteurs prennent des décisions basées sur des données fiables et non sur l\'intuition seule. Où la technologie réduit le gaspillage, augmente les rendements et protège notre environnement.'
                : 'We envision a future where every agricultural plot is connected, intelligent and self-optimized. Where farmers make decisions based on reliable data and not intuition alone. Where technology reduces waste, increases yields and protects our environment.'}
            </p>
          </GlassCard>
        </motion.div>

        {/* Timeline */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">{lang === 'fr' ? 'Notre Feuille de Route' : 'Our Roadmap'}</h2>
          <div className="space-y-6">
            {timeline.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <GlassCard variant="strong" className="flex gap-6 p-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-gradient flex items-center justify-center shrink-0">
                    <item.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
