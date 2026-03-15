import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Target, Eye, Cpu, Satellite, Bot, Sprout, MapPin, FlaskConical, FileText, BarChart3, Droplets, Thermometer, Leaf } from 'lucide-react';
import droneImg from '@/assets/about-drone.jpg';

export default function About() {
  const { lang } = useApp();

  const analysisSteps = [
    {
      icon: MapPin,
      title: lang === 'fr' ? '1. Tracez votre parcelle' : '1. Draw your plot',
      desc: lang === 'fr'
        ? "L'agriculteur dessine les contours de sa parcelle sur une carte interactive (OpenStreetMap). Le système calcule automatiquement la surface en hectares et détermine les coordonnées GPS du centroïde."
        : "The farmer draws plot boundaries on an interactive map (OpenStreetMap). The system automatically calculates the area in hectares and determines the GPS coordinates of the centroid.",
    },
    {
      icon: FlaskConical,
      title: lang === 'fr' ? '2. Analyse des propriétés du sol' : '2. Soil properties analysis',
      desc: lang === 'fr'
        ? "SoilGrids ISRIC/NASA fournit 11 paramètres du sol (pH, azote, argile, sable, limon, carbone organique, CEC, densité apparente 0-30cm et 30-60cm, fragments grossiers, densité de carbone organique). Moyenne pondérée sur 0-30 cm avec fallback OpenLandMap puis estimations régionales ISRIC Africa Soil Atlas 2014."
        : "SoilGrids ISRIC/NASA provides 11 soil parameters (pH, nitrogen, clay, sand, silt, organic carbon, CEC, bulk density 0-30cm and 30-60cm, coarse fragments, organic carbon density). Weighted average over 0-30 cm with OpenLandMap fallback then ISRIC Africa Soil Atlas 2014 regional estimates.",
    },
    {
      icon: Thermometer,
      title: lang === 'fr' ? '3. Normales climatiques 30 ans' : '3. 30-year climate normals',
      desc: lang === 'fr'
        ? "ERA5 (ECMWF/Copernicus) via Open-Meteo fournit les données journalières 1991-2020 : précipitations, température, évapotranspiration FAO, radiation solaire. Le système calcule le bilan hydrique mensuel (P - ETP), les mois de déficit, la température corrigée par l'altitude et le rayonnement solaire annuel."
        : "ERA5 (ECMWF/Copernicus) via Open-Meteo provides 1991-2020 daily data: precipitation, temperature, FAO evapotranspiration, solar radiation. The system computes monthly water balance (P - ETP), deficit months, altitude-corrected temperature and annual solar radiation.",
    },
    {
      icon: Satellite,
      title: lang === 'fr' ? '4. Géocodage et zone agro-écologique' : '4. Geocoding and agro-ecological zone',
      desc: lang === 'fr'
        ? "Nominatim (OpenStreetMap) identifie le pays et la région. Le moteur détermine la zone agro-écologique (sahélienne, soudanienne, guinéenne, méditerranéenne, montagne) selon le pays, l'altitude, la pluviométrie et les mois de déficit hydrique."
        : "Nominatim (OpenStreetMap) identifies the country and region. The engine determines the agro-ecological zone (Sahelian, Sudanian, Guinean, Mediterranean, mountain) based on country, altitude, rainfall and water deficit months.",
    },
    {
      icon: Cpu,
      title: lang === 'fr' ? '5. Scoring multicritère de 21 cultures' : '5. Multi-criteria scoring of 21 crops',
      desc: lang === 'fr'
        ? "Chaque culture est évaluée selon 5 sous-scores pondérés par zone : pH (vs plage optimale/tolérée), pluviométrie (vs besoins), température (vs plages), texture (argile/sable vs exigences), azote disponible (kg/ha). Des filtres d'élimination s'appliquent : incompatibilité de zone, sol caillouteux (>35% CFVO pour tubercules), pas d'irrigation, salinité côtière, semelle de labour."
        : "Each crop is evaluated on 5 sub-scores weighted by zone: pH (vs optimal/tolerated range), rainfall (vs needs), temperature (vs ranges), texture (clay/sand vs requirements), available nitrogen (kg/ha). Elimination filters apply: zone incompatibility, stony soil (>35% CFVO for tubers), no irrigation, coastal salinity, plow pan.",
    },
    {
      icon: BarChart3,
      title: lang === 'fr' ? '6. Recommandations et rapport' : '6. Recommendations and report',
      desc: lang === 'fr'
        ? "Le rapport final inclut : Top 5 cultures avec scores et grades, radar de compatibilité, recommandations d'intrants (quantités, timing), calendrier cultural (semis → récolte → vente), estimations économiques (FAOSTAT 2022-2023), rotation 3 ans, plan subsistance/rente et alertes agronomiques."
        : "The final report includes: Top 5 crops with scores and grades, compatibility radar, input recommendations (quantities, timing), crop calendar (sowing → harvest → sale), economic estimates (FAOSTAT 2022-2023), 3-year rotation, subsistence/cash plan and agronomic alerts.",
    },
  ];

  const dataSources = [
    { name: 'SoilGrids ISRIC/NASA', desc: lang === 'fr' ? 'Propriétés du sol — résolution 250m' : 'Soil properties — 250m resolution' },
    { name: 'ERA5 ECMWF/Copernicus', desc: lang === 'fr' ? 'Normales climatiques 1991-2020' : 'Climate normals 1991-2020' },
    { name: 'OpenWeatherMap', desc: lang === 'fr' ? 'Météo temps réel (alertes uniquement)' : 'Real-time weather (alerts only)' },
    { name: 'FAO EcoCrop / CIRAD / IITA', desc: lang === 'fr' ? 'Exigences des cultures' : 'Crop requirements' },
    { name: 'FAOSTAT 2022-2023', desc: lang === 'fr' ? 'Prix et rendements de référence' : 'Reference prices and yields' },
    { name: 'Nominatim (OSM)', desc: lang === 'fr' ? 'Géocodage inverse' : 'Reverse geocoding' },
  ];

  const timeline = [
    {
      icon: Sprout,
      title: lang === 'fr' ? "Aujourd'hui" : 'Today',
      desc: lang === 'fr' ? "Analyse satellite des sols, scoring multicritère de 21 cultures, recommandations d'intrants, export PDF/CSV, marché agricole digital." : 'Satellite soil analysis, multi-criteria scoring of 21 crops, input recommendations, PDF/CSV export, digital agricultural market.',
    },
    {
      icon: Satellite,
      title: lang === 'fr' ? 'Demain' : 'Tomorrow',
      desc: lang === 'fr' ? "Équipes terrain avec capteurs IoT, drones de surveillance, analyses in-situ pour calibrer les données satellite." : 'Field teams with IoT sensors, surveillance drones, in-situ analyses to calibrate satellite data.',
    },
    {
      icon: Bot,
      title: lang === 'fr' ? 'Le futur' : 'The Future',
      desc: lang === 'fr' ? "IA prédictive avancée, robots agricoles autonomes, gestion automatisée de l'irrigation et des intrants." : 'Advanced predictive AI, autonomous farming robots, automated irrigation and input management.',
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <img src={droneImg} alt="Agricultural technology" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center px-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 drop-shadow-lg">
            {lang === 'fr' ? 'À Propos' : 'About Us'}
          </h1>
          <p className="text-lg text-white/85 drop-shadow">
            {lang === 'fr'
              ? "La science au service de l'agriculture. Données fiables, résultats vérifiables."
              : 'Science at the service of agriculture. Reliable data, verifiable results.'}
          </p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        {/* Mission */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-green-gradient flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{lang === 'fr' ? 'Notre Mission' : 'Our Mission'}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {lang === 'fr'
                ? "AgriSmartConnect démocratise l'accès aux données agronomiques de précision. En combinant SoilGrids ISRIC/NASA, ERA5 ECMWF et les références FAO/CIRAD/IITA, nous fournissons à chaque agriculteur — du petit exploitant à l'agro-industriel — des analyses de sol fiables, des recommandations culturales scientifiquement fondées et des connexions commerciales directes."
                : "AgriSmartConnect democratizes access to precision agronomic data. By combining SoilGrids ISRIC/NASA, ERA5 ECMWF and FAO/CIRAD/IITA references, we provide every farmer — from smallholder to agro-industrial — reliable soil analyses, scientifically grounded crop recommendations and direct commercial connections."}
            </p>
          </div>
        </motion.div>

        {/* Vision */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-green-gradient flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{lang === 'fr' ? 'Notre Vision' : 'Our Vision'}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg mb-4">
              {lang === 'fr'
                ? "Un futur où chaque parcelle agricole est connectée et intelligente. Où les décisions se prennent sur des données fiables — pas sur l'intuition seule. Où la technologie augmente les rendements, réduit les intrants inutiles et protège les sols pour les générations futures."
                : "A future where every farm plot is connected and intelligent. Where decisions are made on reliable data — not intuition alone. Where technology increases yields, reduces unnecessary inputs and protects soils for future generations."}
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {lang === 'fr'
                ? "Notre approche est résolument scientifique : aucune donnée inventée, chaque chiffre est sourcé (ISRIC, FAO, CIRAD, FAOSTAT), et l'indice de confiance de chaque analyse est transparent."
                : "Our approach is resolutely scientific: no invented data, every figure is sourced (ISRIC, FAO, CIRAD, FAOSTAT), and the confidence index of each analysis is transparent."}
            </p>
          </div>
        </motion.div>

        {/* Pipeline d'analyse */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
              {lang === 'fr' ? "Pipeline d'analyse des sols" : 'Soil Analysis Pipeline'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {lang === 'fr' ? "De la parcelle au rapport, voici chaque étape de notre processus scientifique." : "From plot to report, here is every step of our scientific process."}
            </p>
          </motion.div>

          <div className="space-y-4">
            {analysisSteps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="rounded-2xl border border-border bg-card p-6 hover:border-accent/40 transition-colors">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-xl bg-green-gradient flex items-center justify-center shrink-0">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sources de données */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            {lang === 'fr' ? '📡 Sources de données' : '📡 Data Sources'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dataSources.map((ds, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm font-bold text-foreground">{ds.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{ds.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Roadmap */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">{lang === 'fr' ? 'Notre Feuille de Route' : 'Our Roadmap'}</h2>
          <div className="space-y-4">
            {timeline.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="rounded-2xl border border-border bg-card p-6 flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-gradient flex items-center justify-center shrink-0">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
