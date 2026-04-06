// AgriSmartConnect — Moteur agronomique scientifique
// Sources: FAO EcoCrop, CIRAD, IITA, IRRI, ICARDA, FAOSTAT 2022-2023
// Aucune valeur inventée — toutes les références sont documentées

import type { SoilData } from './soilgrids';
import type { ClimateData, GeoLocation } from './climate-api';
import type { CurrentWeather } from './weather';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type AgroZone = 'sahelian' | 'sudanian' | 'guinean' | 'mediterranean' | 'mountain_med';
export type Grade = 'excellent' | 'bon' | 'moyen' | 'deconseille';
export type RiskLevel = 'red' | 'orange' | 'yellow';
export type AlertLevel = 'red' | 'orange';
export type Lang = 'fr' | 'en';

export interface AgroRisk {
  type: string;
  level: RiskLevel;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  recommendations: { fr: string[]; en: string[] };
}

export interface ImmediateAlert {
  type: string;
  level: AlertLevel;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
}

export interface InputRec {
  type: 'organic' | 'mineral';
  name: { fr: string; en: string };
  quantity: string;
  timing: { fr: string; en: string };
  priority: number;
}

export interface CropScore {
  key: string;
  name: { fr: string; en: string };
  category: string;
  score: number;
  grade: Grade;
  subScores: { ph: number; texture: number; temp: number; rain: number; nitrogen: number };
  yieldLow: number;
  yieldHigh: number;
  yieldLowPerHa: number;
  yieldHighPerHa: number;
  revenueLow: number;
  revenueHigh: number;
  costsLow: number;
  costsHigh: number;
  marginLow: number;
  marginHigh: number;
  costBreakdown: {
    seeds: number;
    labor: number;
    fertilizer: number;
    phyto: number;
    transport: number;
  };
  pricePerTon: number;
  pricePerTonLocal: number;
  forecastYear: number;
  sowingWindow: { fr: string; en: string };
  cycleDays: number;
  harvestWindow: { fr: string; en: string };
  saleWindow: { fr: string; en: string };
  association: { fr: string; en: string };
  eliminationReason?: { fr: string; en: string };
  inputRecommendations: InputRec[];
  radarLegend: { axis: string; status: 'favorable' | 'limite' | 'problematique' }[];
}

export interface RotationYear {
  year: number;
  crop: { fr: string; en: string };
  reason: { fr: string; en: string };
}

export interface AnalysisResult {
  zone: AgroZone;
  zoneLabel: { fr: string; en: string };
  zoneDescription: { fr: string; en: string };
  risks: AgroRisk[];
  alerts: ImmediateAlert[];
  cropScores: CropScore[];
  topCrops: CropScore[];
  excludedCrops: CropScore[];
  rotation: RotationYear[];
  associationSystem: { fr: string; en: string };
  allocationFood: number;
  allocationCash: number;
  allocationDescription: { fr: string; en: string };
  confidenceIndex: number;
  confidenceLabel: { fr: string; en: string };
  soilInterpretations: { label: string; value: string; interpretation: { fr: string; en: string } }[];
}

// ─── REFERENCE DATA (FAOSTAT 2022-2023, CIRAD, IITA) ────────────────────────

interface CropRef {
  name: { fr: string; en: string };
  category: string;
  phOpt: [number, number]; phTol: [number, number];
  tempOpt: [number, number]; tempTol: [number, number];
  rainMin: number; rainMax: number;
  clayOpt: [number, number]; sandOpt: [number, number];
  cycleDays: number;
  isTuber: boolean;
  isIrrigated: boolean; // requires irrigation
  isPhotosensitive: boolean;
  saltSensitive: boolean;
  deepRooted: boolean;
  zones: AgroZone[];
  yields: Partial<Record<AgroZone, [number, number]>>; // [without, with inputs] t/ha
  priceUSD: number; // USD/t FAOSTAT 2022-2023
  seedCostPct: number; // % of revenue
  laborPct: number; // % of revenue
  sowingByZone: Partial<Record<AgroZone, { sow: string; harvest: string; sale: string }>>;
  association: { fr: string; en: string };
  rotationAfter: { fr: string; en: string }[];
}

const CROPS: Record<string, CropRef> = {
  millet: {
    name: { fr: 'Mil perlé', en: 'Pearl Millet' }, category: 'cereals',
    phOpt: [5.5, 7.5], phTol: [5.0, 8.0], tempOpt: [25, 35], tempTol: [22, 40],
    rainMin: 200, rainMax: 800, clayOpt: [5, 35], sandOpt: [30, 80],
    cycleDays: 90, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sahelian', 'sudanian'],
    yields: { sahelian: [0.5, 1.0], sudanian: [0.7, 1.3] },
    priceUSD: 200, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      sahelian: { sow: 'Juin-Juillet', harvest: 'Sept-Oct', sale: 'Nov-Déc' },
      sudanian: { sow: 'Mai-Juin', harvest: 'Sept-Oct', sale: 'Nov-Jan' },
    },
    association: { fr: 'Mil + niébé ou arachide (fixation azote)', en: 'Millet + cowpea or groundnut (nitrogen fixation)' },
    rotationAfter: [
      { fr: 'An 2 : Niébé ou arachide', en: 'Year 2: Cowpea or groundnut' },
      { fr: 'An 3 : Sorgho ou mil variété résistante Striga', en: 'Year 3: Sorghum or Striga-resistant millet' },
    ],
  },
  sorghum: {
    name: { fr: 'Sorgho', en: 'Sorghum' }, category: 'cereals',
    phOpt: [6.0, 7.5], phTol: [5.5, 8.5], tempOpt: [25, 35], tempTol: [20, 40],
    rainMin: 300, rainMax: 1000, clayOpt: [5, 50], sandOpt: [10, 70],
    cycleDays: 110, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sahelian', 'sudanian'],
    yields: { sahelian: [0.6, 1.2], sudanian: [1.0, 2.0] },
    priceUSD: 160, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      sahelian: { sow: 'Juin-Juillet', harvest: 'Oct-Nov', sale: 'Déc-Fév' },
      sudanian: { sow: 'Mai-Juin', harvest: 'Sept-Nov', sale: 'Nov-Jan' },
    },
    association: { fr: 'Sorgho + niébé ou sésame', en: 'Sorghum + cowpea or sesame' },
    rotationAfter: [
      { fr: 'An 2 : Niébé ou sésame', en: 'Year 2: Cowpea or sesame' },
      { fr: 'An 3 : Sorgho possible', en: 'Year 3: Sorghum possible' },
    ],
  },
  maize: {
    name: { fr: 'Maïs', en: 'Maize' }, category: 'cereals',
    phOpt: [5.5, 7.0], phTol: [5.0, 7.5], tempOpt: [20, 30], tempTol: [18, 35],
    rainMin: 500, rainMax: 1200, clayOpt: [10, 40], sandOpt: [20, 60],
    cycleDays: 120, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sudanian', 'guinean'],
    yields: { sudanian: [1.2, 2.5], guinean: [1.5, 3.5] },
    priceUSD: 220, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Mai-Juin', harvest: 'Sept-Oct', sale: 'Nov-Jan' },
      guinean: { sow: 'Mars-Avril', harvest: 'Juil-Août', sale: 'Août-Oct' },
    },
    association: { fr: 'Maïs + niébé (fixation azote) ou citrouille (couverture sol)', en: 'Maize + cowpea (N fixation) or pumpkin (soil cover)' },
    rotationAfter: [
      { fr: 'An 2 : Niébé ou arachide', en: 'Year 2: Cowpea or groundnut' },
      { fr: 'An 3 : Sorgho ou maïs variété résistante Striga', en: 'Year 3: Sorghum or Striga-resistant maize' },
    ],
  },
  cowpea: {
    name: { fr: 'Niébé', en: 'Cowpea' }, category: 'legumes',
    phOpt: [6.0, 7.0], phTol: [5.5, 7.5], tempOpt: [25, 35], tempTol: [22, 38],
    rainMin: 300, rainMax: 1000, clayOpt: [5, 35], sandOpt: [25, 75],
    cycleDays: 80, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: true, deepRooted: false,
    zones: ['sahelian', 'sudanian', 'guinean'],
    yields: { sahelian: [0.4, 0.8], sudanian: [0.6, 1.2] },
    priceUSD: 600, seedCostPct: 12, laborPct: 35,
    sowingByZone: {
      sahelian: { sow: 'Juil-Août', harvest: 'Oct-Nov', sale: 'Nov-Fév' },
      sudanian: { sow: 'Juin-Juil', harvest: 'Sept-Oct', sale: 'Oct-Jan' },
    },
    association: { fr: 'Niébé en association ou en rotation avec toutes les céréales', en: 'Cowpea intercropped or rotated with all cereals' },
    rotationAfter: [
      { fr: 'An 2 : Toutes céréales bénéficient de l\'azote fixé', en: 'Year 2: All cereals benefit from fixed nitrogen' },
      { fr: 'An 3 : Rotation libre', en: 'Year 3: Free rotation' },
    ],
  },
  groundnut: {
    name: { fr: 'Arachide', en: 'Groundnut' }, category: 'legumes',
    phOpt: [5.5, 7.0], phTol: [5.0, 7.5], tempOpt: [25, 35], tempTol: [20, 38],
    rainMin: 400, rainMax: 1200, clayOpt: [5, 30], sandOpt: [30, 75],
    cycleDays: 120, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sudanian', 'guinean'],
    yields: { sudanian: [0.7, 1.3], guinean: [1.0, 1.8] },
    priceUSD: 1000, seedCostPct: 12, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Mai-Juin', harvest: 'Sept-Oct', sale: 'Oct-Déc' },
      guinean: { sow: 'Avril-Mai', harvest: 'Août-Sept', sale: 'Sept-Nov' },
    },
    association: { fr: 'Arachide + mil ou sorgho', en: 'Groundnut + millet or sorghum' },
    rotationAfter: [
      { fr: 'An 2 : Toutes céréales', en: 'Year 2: All cereals' },
      { fr: 'An 3 : Rotation libre', en: 'Year 3: Free rotation' },
    ],
  },
  sesame: {
    name: { fr: 'Sésame', en: 'Sesame' }, category: 'cash',
    phOpt: [5.5, 7.5], phTol: [5.0, 8.0], tempOpt: [25, 35], tempTol: [22, 40],
    rainMin: 300, rainMax: 800, clayOpt: [5, 30], sandOpt: [30, 75],
    cycleDays: 100, isTuber: false, isIrrigated: false, isPhotosensitive: true,
    saltSensitive: false, deepRooted: false,
    zones: ['sahelian', 'sudanian'],
    yields: { sahelian: [0.4, 0.7], sudanian: [0.5, 0.9] },
    priceUSD: 1400, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      sahelian: { sow: 'Juil-Août', harvest: 'Oct-Nov', sale: 'Nov-Fév' },
      sudanian: { sow: 'Juin-Juil', harvest: 'Sept-Oct', sale: 'Nov-Jan' },
    },
    association: { fr: 'Sésame en bandes alternées avec sorgho', en: 'Sesame in alternating strips with sorghum' },
    rotationAfter: [
      { fr: 'An 2 : Niébé ou arachide', en: 'Year 2: Cowpea or groundnut' },
      { fr: 'An 3 : Sorgho ou mil', en: 'Year 3: Sorghum or millet' },
    ],
  },
  cassava: {
    name: { fr: 'Manioc', en: 'Cassava' }, category: 'tubers',
    phOpt: [5.5, 6.5], phTol: [4.5, 7.5], tempOpt: [25, 32], tempTol: [20, 35],
    rainMin: 500, rainMax: 2000, clayOpt: [5, 40], sandOpt: [20, 70],
    cycleDays: 300, isTuber: true, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: true,
    zones: ['guinean', 'sudanian'],
    yields: { guinean: [8.0, 15.0] },
    priceUSD: 100, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      guinean: { sow: 'Mars-Avril', harvest: 'Déc-Fév (10-12 mois)', sale: 'Toute l\'année' },
      sudanian: { sow: 'Mai-Juin', harvest: 'Fév-Avril (10-12 mois)', sale: 'Toute l\'année' },
    },
    association: { fr: 'Manioc + arachide ou niébé entre les rangées', en: 'Cassava + groundnut or cowpea between rows' },
    rotationAfter: [
      { fr: 'An 2 : Légumineuse OBLIGATOIRE (épuise K et N)', en: 'Year 2: Legume MANDATORY (depletes K and N)' },
      { fr: 'An 3 : Céréale', en: 'Year 3: Cereal' },
    ],
  },
  yam: {
    name: { fr: 'Igname', en: 'Yam' }, category: 'tubers',
    phOpt: [5.5, 6.5], phTol: [5.0, 7.0], tempOpt: [25, 32], tempTol: [22, 35],
    rainMin: 800, rainMax: 1800, clayOpt: [10, 35], sandOpt: [20, 60],
    cycleDays: 240, isTuber: true, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: true,
    zones: ['guinean'],
    yields: { guinean: [10.0, 18.0] },
    priceUSD: 200, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      guinean: { sow: 'Fév-Mars', harvest: 'Oct-Nov (8 mois)', sale: 'Nov-Jan' },
    },
    association: { fr: 'Igname + maïs (ombrage partiel bénéfique)', en: 'Yam + maize (beneficial partial shade)' },
    rotationAfter: [
      { fr: 'An 2 : Légumineuse obligatoire', en: 'Year 2: Legume mandatory' },
      { fr: 'An 3 : Céréale', en: 'Year 3: Cereal' },
    ],
  },
  taro: {
    name: { fr: 'Taro', en: 'Taro' }, category: 'tubers',
    phOpt: [5.5, 6.5], phTol: [5.0, 7.0], tempOpt: [25, 32], tempTol: [21, 35],
    rainMin: 1500, rainMax: 3000, clayOpt: [15, 45], sandOpt: [10, 50],
    cycleDays: 210, isTuber: true, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['guinean'],
    yields: { guinean: [6.0, 12.0] },
    priceUSD: 250, seedCostPct: 10, laborPct: 35,
    sowingByZone: {
      guinean: { sow: 'Mars-Avril', harvest: 'Oct-Déc (7 mois)', sale: 'Nov-Fév' },
    },
    association: { fr: 'Taro en bas-fond avec riz pluvial', en: 'Taro in lowland with rainfed rice' },
    rotationAfter: [
      { fr: 'An 2 : Légumineuse', en: 'Year 2: Legume' },
      { fr: 'An 3 : Céréale', en: 'Year 3: Cereal' },
    ],
  },
  sweet_potato: {
    name: { fr: 'Patate douce', en: 'Sweet Potato' }, category: 'tubers',
    phOpt: [5.5, 6.5], phTol: [5.0, 7.0], tempOpt: [22, 30], tempTol: [20, 35],
    rainMin: 500, rainMax: 1500, clayOpt: [5, 35], sandOpt: [25, 70],
    cycleDays: 120, isTuber: true, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sudanian', 'guinean'],
    yields: { sudanian: [5.0, 10.0], guinean: [8.0, 15.0] },
    priceUSD: 100, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Juin-Juil', harvest: 'Oct-Nov', sale: 'Nov-Jan' },
      guinean: { sow: 'Avril-Mai', harvest: 'Août-Sept', sale: 'Sept-Nov' },
    },
    association: { fr: 'Patate douce en rotation avec niébé', en: 'Sweet potato rotated with cowpea' },
    rotationAfter: [
      { fr: 'An 2 : Légumineuse', en: 'Year 2: Legume' },
      { fr: 'An 3 : Céréale ou tubercule', en: 'Year 3: Cereal or tuber' },
    ],
  },
  tomato: {
    name: { fr: 'Tomate', en: 'Tomato' }, category: 'vegetables',
    phOpt: [6.0, 7.0], phTol: [5.5, 7.5], tempOpt: [20, 30], tempTol: [18, 32],
    rainMin: 400, rainMax: 1200, clayOpt: [10, 35], sandOpt: [25, 60],
    cycleDays: 90, isTuber: false, isIrrigated: true, isPhotosensitive: false,
    saltSensitive: true, deepRooted: false,
    zones: ['sudanian', 'guinean'],
    yields: { sudanian: [15.0, 30.0], guinean: [15.0, 30.0] },
    priceUSD: 400, seedCostPct: 12, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Oct-Nov (irrigué)', harvest: 'Jan-Mars', sale: 'Jan-Avril' },
      guinean: { sow: 'Sept-Oct', harvest: 'Déc-Fév', sale: 'Déc-Mars' },
    },
    association: { fr: 'Tomate + basilic (répulsif aleurodes)', en: 'Tomato + basil (whitefly repellent)' },
    rotationAfter: [
      { fr: 'Éviter tomate/gombo/piment pendant 2 ans (nématodes, fusariose)', en: 'Avoid tomato/okra/pepper for 2 years (nematodes, fusarium)' },
      { fr: 'An 2-3 : Céréale ou légumineuse', en: 'Year 2-3: Cereal or legume' },
    ],
  },
  onion: {
    name: { fr: 'Oignon', en: 'Onion' }, category: 'vegetables',
    phOpt: [6.0, 7.0], phTol: [5.5, 7.5], tempOpt: [15, 25], tempTol: [12, 30],
    rainMin: 350, rainMax: 1000, clayOpt: [15, 40], sandOpt: [20, 55],
    cycleDays: 100, isTuber: false, isIrrigated: true, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sudanian', 'mediterranean'],
    yields: { sudanian: [10.0, 25.0], mediterranean: [15.0, 30.0] },
    priceUSD: 250, seedCostPct: 12, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Oct-Nov', harvest: 'Fév-Mars', sale: 'Mars-Mai' },
      mediterranean: { sow: 'Sept-Oct', harvest: 'Jan-Mars', sale: 'Fév-Avril' },
    },
    association: { fr: 'Oignon en rotation avec céréales', en: 'Onion rotated with cereals' },
    rotationAfter: [
      { fr: 'An 2 : Céréale ou légumineuse', en: 'Year 2: Cereal or legume' },
    ],
  },
  okra: {
    name: { fr: 'Gombo', en: 'Okra' }, category: 'vegetables',
    phOpt: [6.0, 7.0], phTol: [5.8, 7.5], tempOpt: [25, 35], tempTol: [22, 38],
    rainMin: 400, rainMax: 1200, clayOpt: [10, 35], sandOpt: [25, 60],
    cycleDays: 60, isTuber: false, isIrrigated: true, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sudanian', 'guinean'],
    yields: { sudanian: [5.0, 12.0], guinean: [6.0, 12.0] },
    priceUSD: 350, seedCostPct: 12, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Mai-Juin', harvest: 'Juil-Sept', sale: 'Juil-Oct' },
      guinean: { sow: 'Mars-Avril', harvest: 'Mai-Juil', sale: 'Mai-Août' },
    },
    association: { fr: 'Gombo en association avec maïs', en: 'Okra intercropped with maize' },
    rotationAfter: [
      { fr: 'Éviter gombo/tomate/piment pendant 2 ans', en: 'Avoid okra/tomato/pepper for 2 years' },
    ],
  },
  pepper: {
    name: { fr: 'Piment', en: 'Pepper' }, category: 'vegetables',
    phOpt: [6.0, 7.0], phTol: [5.5, 7.5], tempOpt: [22, 30], tempTol: [18, 35],
    rainMin: 500, rainMax: 1500, clayOpt: [10, 35], sandOpt: [20, 55],
    cycleDays: 100, isTuber: false, isIrrigated: true, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['sudanian', 'guinean'],
    yields: { sudanian: [5.0, 12.0], guinean: [6.0, 15.0] },
    priceUSD: 400, seedCostPct: 12, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Mai-Juin', harvest: 'Sept-Nov', sale: 'Oct-Déc' },
      guinean: { sow: 'Mars-Avril', harvest: 'Juil-Sept', sale: 'Juil-Oct' },
    },
    association: { fr: 'Piment en association avec tomate et basilic', en: 'Pepper intercropped with tomato and basil' },
    rotationAfter: [
      { fr: 'Éviter tomate/gombo/piment pendant 2 ans', en: 'Avoid tomato/okra/pepper for 2 years' },
    ],
  },
  cotton: {
    name: { fr: 'Coton', en: 'Cotton' }, category: 'cash',
    phOpt: [6.0, 7.5], phTol: [5.5, 8.0], tempOpt: [25, 35], tempTol: [20, 40],
    rainMin: 500, rainMax: 1200, clayOpt: [10, 45], sandOpt: [15, 60],
    cycleDays: 180, isTuber: false, isIrrigated: false, isPhotosensitive: true,
    saltSensitive: false, deepRooted: true,
    zones: ['sudanian'],
    yields: { sudanian: [0.8, 1.5] },
    priceUSD: 420, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      sudanian: { sow: 'Juin-Juil', harvest: 'Nov-Déc', sale: 'Déc-Mars' },
    },
    association: { fr: 'Coton + niébé (couverture sol, diversification alimentaire)', en: 'Cotton + cowpea (soil cover, food diversification)' },
    rotationAfter: [
      { fr: 'An 2 : Niébé ou maïs (réduction pression parasitaire)', en: 'Year 2: Cowpea or maize (reduce pest pressure)' },
      { fr: 'An 3 : Sorgho ou coton', en: 'Year 3: Sorghum or cotton' },
    ],
  },
  rice_rainfed: {
    name: { fr: 'Riz pluvial', en: 'Rainfed Rice' }, category: 'cereals',
    phOpt: [5.5, 6.5], phTol: [5.0, 7.0], tempOpt: [22, 32], tempTol: [20, 37],
    rainMin: 900, rainMax: 2500, clayOpt: [20, 60], sandOpt: [10, 40],
    cycleDays: 150, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['guinean'],
    yields: { guinean: [2.0, 4.0] },
    priceUSD: 350, seedCostPct: 8, laborPct: 35,
    sowingByZone: {
      guinean: { sow: 'Avril-Mai', harvest: 'Août-Oct', sale: 'Oct-Déc' },
    },
    association: { fr: 'Riz pluvial en bas-fond', en: 'Rainfed rice in lowlands' },
    rotationAfter: [
      { fr: 'An 2 : Légumineuse', en: 'Year 2: Legume' },
      { fr: 'An 3 : Riz ou maïs', en: 'Year 3: Rice or maize' },
    ],
  },
  wheat_durum: {
    name: { fr: 'Blé dur', en: 'Durum Wheat' }, category: 'cereals',
    phOpt: [6.5, 8.0], phTol: [6.0, 8.5], tempOpt: [12, 22], tempTol: [8, 28],
    rainMin: 300, rainMax: 600, clayOpt: [15, 45], sandOpt: [15, 50],
    cycleDays: 150, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['mediterranean', 'mountain_med'],
    yields: { mediterranean: [2.0, 4.5], mountain_med: [1.5, 3.5] },
    priceUSD: 320, seedCostPct: 8, laborPct: 30,
    sowingByZone: {
      mediterranean: { sow: 'Oct-Nov', harvest: 'Mai-Juin', sale: 'Juin-Sept' },
      mountain_med: { sow: 'Oct-Nov', harvest: 'Juin-Juil', sale: 'Juil-Sept' },
    },
    association: { fr: 'Blé + légumineuses d\'hiver (pois chiche, fève)', en: 'Wheat + winter legumes (chickpea, fava bean)' },
    rotationAfter: [
      { fr: 'An 2 : Pois chiche ou fève', en: 'Year 2: Chickpea or fava bean' },
      { fr: 'An 3 : Blé ou orge', en: 'Year 3: Wheat or barley' },
    ],
  },
  barley: {
    name: { fr: 'Orge', en: 'Barley' }, category: 'cereals',
    phOpt: [6.5, 8.0], phTol: [6.0, 8.5], tempOpt: [10, 20], tempTol: [8, 28],
    rainMin: 250, rainMax: 500, clayOpt: [10, 45], sandOpt: [15, 60],
    cycleDays: 100, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: false,
    zones: ['mediterranean', 'mountain_med'],
    yields: { mediterranean: [1.5, 3.5], mountain_med: [1.0, 2.5] },
    priceUSD: 200, seedCostPct: 8, laborPct: 30,
    sowingByZone: {
      mediterranean: { sow: 'Oct-Nov', harvest: 'Avril-Mai', sale: 'Mai-Juil' },
    },
    association: { fr: 'Orge + trèfle en couverture hivernale', en: 'Barley + clover as winter cover' },
    rotationAfter: [
      { fr: 'An 2 : Légumineuse (pois chiche)', en: 'Year 2: Legume (chickpea)' },
      { fr: 'An 3 : Blé ou orge', en: 'Year 3: Wheat or barley' },
    ],
  },
  olive: {
    name: { fr: 'Olivier', en: 'Olive tree' }, category: 'cash',
    phOpt: [7.0, 8.0], phTol: [6.5, 8.5], tempOpt: [15, 25], tempTol: [10, 35],
    rainMin: 300, rainMax: 800, clayOpt: [15, 40], sandOpt: [20, 50],
    cycleDays: 365, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: true,
    zones: ['mediterranean'],
    yields: { mediterranean: [2.0, 4.0] },
    priceUSD: 1500, seedCostPct: 5, laborPct: 30,
    sowingByZone: {
      mediterranean: { sow: 'Plantation automne', harvest: 'Nov-Jan', sale: 'Fév-Juin' },
    },
    association: { fr: 'Olivier + légumineuses annuelles d\'hiver (pois chiche, fève)', en: 'Olive + winter annual legumes (chickpea, fava)' },
    rotationAfter: [
      { fr: 'Culture pérenne — intégrer légumineuses annuelles en inter-rang', en: 'Perennial — integrate annual legumes between rows' },
    ],
  },
  cacao: {
    name: { fr: 'Cacao', en: 'Cocoa' }, category: 'cash',
    phOpt: [5.5, 7.0], phTol: [5.0, 7.5], tempOpt: [22, 30], tempTol: [20, 32],
    rainMin: 1500, rainMax: 2500, clayOpt: [15, 45], sandOpt: [15, 50],
    cycleDays: 365, isTuber: false, isIrrigated: false, isPhotosensitive: false,
    saltSensitive: false, deepRooted: true,
    zones: ['guinean'],
    yields: { guinean: [0.5, 1.2] },
    priceUSD: 3000, seedCostPct: 5, laborPct: 35,
    sowingByZone: {
      guinean: { sow: 'Plantation saison pluies', harvest: 'Oct-Mars', sale: 'Jan-Mai' },
    },
    association: { fr: 'Système agroforestier avec arbres d\'ombrage', en: 'Agroforestry system with shade trees' },
    rotationAfter: [
      { fr: 'Culture pérenne — diversifier avec fruitiers', en: 'Perennial — diversify with fruit trees' },
    ],
  },
};

export { CROPS };

// ─── ZONE DETERMINATION ──────────────────────────────────────────────────────

export function determineZone(
  lat: number, _lon: number, countryCode: string, altitude: number,
  annualRain: number, deficitMonths: number, _correctedTemp: number
): AgroZone {
  // Morocco
  if (countryCode === 'MA') {
    if (altitude > 800) return 'mountain_med';
    return 'mediterranean';
  }
  // Tunisia, Algeria (Mediterranean)
  if (['TN', 'DZ'].includes(countryCode) && lat > 30) return 'mediterranean';

  // Sub-Saharan Africa by climate
  if (deficitMonths > 7 && annualRain < 600) return 'sahelian';
  if (deficitMonths >= 4 && deficitMonths <= 7 && annualRain >= 600 && annualRain <= 1000) return 'sudanian';
  if (deficitMonths < 4 && annualRain > 1000) return 'guinean';

  // Fallback by latitude
  if (lat > 30) return 'mediterranean';
  if (lat > 13) return 'sahelian';
  if (lat > 9) return 'sudanian';
  return 'guinean';
}

const ZONE_LABELS: Record<AgroZone, { fr: string; en: string }> = {
  sahelian: { fr: 'Zone sahélienne', en: 'Sahelian Zone' },
  sudanian: { fr: 'Zone soudanienne', en: 'Sudanian Zone' },
  guinean: { fr: 'Zone guinéenne humide', en: 'Humid Guinean Zone' },
  mediterranean: { fr: 'Zone méditerranéenne', en: 'Mediterranean Zone' },
  mountain_med: { fr: 'Zone de montagne méditerranéenne', en: 'Mediterranean Mountain Zone' },
};

const ZONE_DESC: Record<AgroZone, { fr: string; en: string }> = {
  sahelian: {
    fr: 'Climat aride avec une courte saison des pluies. Privilégiez les cultures résistantes à la sécheresse.',
    en: 'Arid climate with a short rainy season. Favor drought-resistant crops.',
  },
  sudanian: {
    fr: 'Climat semi-humide avec une saison des pluies de 4 à 7 mois. Bonne diversité culturale possible.',
    en: 'Semi-humid climate with a 4 to 7 month rainy season. Good crop diversity possible.',
  },
  guinean: {
    fr: 'Climat humide avec abondance d\'eau. Idéal pour les tubercules, le riz pluvial et les cultures pérennes.',
    en: 'Humid climate with abundant water. Ideal for tubers, rainfed rice, and perennial crops.',
  },
  mediterranean: {
    fr: 'Climat méditerranéen avec pluies hivernales et étés secs. Cultures d\'automne-hiver recommandées.',
    en: 'Mediterranean climate with winter rains and dry summers. Autumn-winter crops recommended.',
  },
  mountain_med: {
    fr: 'Climat de montagne méditerranéen avec altitude élevée. Températures corrigées pour l\'altitude.',
    en: 'Mediterranean mountain climate with high altitude. Temperatures corrected for elevation.',
  },
};

// ─── SCORING WEIGHTS BY ZONE ─────────────────────────────────────────────────

const ZONE_WEIGHTS: Record<AgroZone, { rain: number; temp: number; ph: number; texture: number; nitrogen: number }> = {
  sahelian: { rain: 40, temp: 15, ph: 25, texture: 15, nitrogen: 5 },
  sudanian: { rain: 30, ph: 25, texture: 20, temp: 15, nitrogen: 10 },
  guinean: { texture: 30, ph: 25, nitrogen: 20, temp: 15, rain: 10 },
  mediterranean: { rain: 35, temp: 20, ph: 25, texture: 15, nitrogen: 5 },
  mountain_med: { rain: 30, temp: 25, ph: 25, texture: 15, nitrogen: 5 },
};

// ─── ZONE-SPECIFIC FARMING SYSTEM RECOMMENDATIONS ──────────────────────────

const ZONE_SYSTEM: Record<AgroZone, { fr: string; en: string }> = {
  sahelian: {
    fr: 'Système Zaï recommandé (microcuvettes de captage d\'eau) + intégration de Faidherbia albida (+15 à 30% rendement sans coût d\'intrant, CIRAD 2020)',
    en: 'Zaï system recommended (micro-basins for water harvesting) + Faidherbia albida integration (+15-30% yield at no input cost, CIRAD 2020)',
  },
  sudanian: {
    fr: 'Bandes alternées légumineuses/céréales espacées de 10-15m pour limiter l\'érosion et maintenir la fertilité',
    en: 'Alternating legume/cereal strips 10-15m apart to limit erosion and maintain fertility',
  },
  guinean: {
    fr: 'Systèmes agroforestiers intégrant arbres fruitiers (manguier, avocatier) avec cultures annuelles pour diversifier revenus et protéger le sol',
    en: 'Agroforestry systems integrating fruit trees (mango, avocado) with annual crops to diversify income and protect soil',
  },
  mediterranean: {
    fr: 'Association olivier + légumineuses annuelles d\'hiver (pois chiche, fève) pour optimiser l\'occupation du sol',
    en: 'Olive + winter annual legumes (chickpea, fava) association to optimize land use',
  },
  mountain_med: {
    fr: 'Terrasses en courbes de niveau + cultures adaptées à l\'altitude avec légumineuses fixatrices d\'azote',
    en: 'Level-curve terraces + altitude-adapted crops with nitrogen-fixing legumes',
  },
};

// ─── SUB-SCORE CALCULATORS ───────────────────────────────────────────────────

function calcPhScore(ph: number, opt: [number, number], tol: [number, number]): number {
  if (ph >= opt[0] && ph <= opt[1]) return 100;
  if (ph >= tol[0] && ph <= tol[1]) {
    const dist = ph < opt[0] ? (opt[0] - ph) / (opt[0] - tol[0]) : (ph - opt[1]) / (tol[1] - opt[1]);
    return Math.round(85 - dist * 30);
  }
  const dist = ph < tol[0] ? (tol[0] - ph) : (ph - tol[1]);
  return Math.max(0, Math.round(40 - dist * 20));
}

function calcRainScore(rain: number, deficitMonths: number, crop: CropRef, zone: AgroZone): number {
  let score = 100;
  if (rain < crop.rainMin) score = Math.max(0, Math.round((rain / crop.rainMin) * 80));
  else if (rain > crop.rainMax) score = Math.max(40, Math.round(100 - ((rain - crop.rainMax) / crop.rainMax) * 30));

  // Penalty if deficit months exceed crop cycle
  const cycleMonths = Math.ceil(crop.cycleDays / 30);
  if (zone !== 'mediterranean' && deficitMonths > (12 - cycleMonths)) {
    score = Math.max(0, score - 25);
  }
  return score;
}

function calcTempScore(temp: number, opt: [number, number], tol: [number, number]): number {
  if (temp >= opt[0] && temp <= opt[1]) return 100;
  if (temp >= tol[0] && temp <= tol[1]) {
    const dist = temp < opt[0] ? (opt[0] - temp) / (opt[0] - tol[0]) : (temp - opt[1]) / (tol[1] - opt[1]);
    return Math.round(85 - dist * 30);
  }
  return Math.max(0, Math.round(30 - Math.abs(temp < tol[0] ? tol[0] - temp : temp - tol[1]) * 10));
}

function calcTextureScore(clay: number, sand: number, crop: CropRef): number {
  const clayScore = (clay >= crop.clayOpt[0] && clay <= crop.clayOpt[1]) ? 100 :
    Math.max(0, 100 - Math.abs(clay - (crop.clayOpt[0] + crop.clayOpt[1]) / 2) * 3);
  const sandScore = (sand >= crop.sandOpt[0] && sand <= crop.sandOpt[1]) ? 100 :
    Math.max(0, 100 - Math.abs(sand - (crop.sandOpt[0] + crop.sandOpt[1]) / 2) * 3);
  return Math.round((clayScore + sandScore) / 2);
}

function calcNitrogenScore(nKgHa: number): number {
  if (nKgHa >= 80) return 100;
  if (nKgHa >= 60) return 85;
  if (nKgHa >= 40) return 65;
  if (nKgHa >= 20) return 45;
  return 25;
}

// ─── RISK ASSESSMENT ─────────────────────────────────────────────────────────

function assessRisks(soil: SoilData, climate: ClimateData, zone: AgroZone, geo: GeoLocation): AgroRisk[] {
  const risks: AgroRisk[] = [];

  // Striga risk
  if (soil.nitrogenKgHa < 40 && soil.sand > 50 && (zone === 'sahelian' || zone === 'sudanian')) {
    risks.push({
      type: 'striga', level: 'orange',
      title: { fr: 'Risque élevé de Striga hermonthica', en: 'High Striga hermonthica risk' },
      description: {
        fr: 'Faible azote + sol sableux en zone sahélo-soudanienne. Ce parasite réduit les rendements de 50 à 100% sur mil, sorgho et maïs.',
        en: 'Low nitrogen + sandy soil in Sahelo-Sudanian zone. This parasite reduces yields by 50-100% on millet, sorghum, and maize.',
      },
      recommendations: {
        fr: ['Utiliser des variétés résistantes (IITA, CIRAD)', 'Apport d\'azote précoce', 'Rotation avec légumineuses'],
        en: ['Use resistant varieties (IITA, CIRAD)', 'Early nitrogen application', 'Rotate with legumes'],
      },
    });
  }

  // Fungal risk
  if (climate.annualHumidity > 80 && climate.correctedTemp >= 22 && climate.correctedTemp <= 35) {
    risks.push({
      type: 'fungal', level: 'orange',
      title: { fr: 'Risque maladies fongiques', en: 'Fungal disease risk' },
      description: {
        fr: 'Humidité relative élevée (>80%) et températures entre 22-35°C favorisent rouille, helminthosporiose et mildiou.',
        en: 'High relative humidity (>80%) and temperatures 22-35°C favor rust, helminthosporium, and downy mildew.',
      },
      recommendations: {
        fr: ['Variétés résistantes recommandées', 'Programme traitement préventif', 'Espacement adéquat des plants'],
        en: ['Resistant varieties recommended', 'Preventive treatment program', 'Adequate plant spacing'],
      },
    });
  }

  // Compaction / semelle de labour
  if (soil.bdodDeep > 1.65 && soil.bdod < 1.4) {
    risks.push({
      type: 'compaction', level: 'orange',
      title: { fr: 'Semelle de labour détectée', en: 'Plow pan detected' },
      description: {
        fr: `Densité apparente élevée en profondeur (${soil.bdodDeep.toFixed(2)} g/cm³) vs surface (${soil.bdod.toFixed(2)} g/cm³). Obstacle à l'enracinement profond.`,
        en: `High bulk density at depth (${soil.bdodDeep.toFixed(2)} g/cm³) vs surface (${soil.bdod.toFixed(2)} g/cm³). Obstacle to deep rooting.`,
      },
      recommendations: {
        fr: ['Sous-solage recommandé', 'Éviter cultures à enracinement profond (igname, olivier)'],
        en: ['Subsoiling recommended', 'Avoid deep-rooting crops (yam, olive)'],
      },
    });
  }

  // Coastal salinity
  if (geo.distanceToCoast < 30) {
    risks.push({
      type: 'salinity', level: 'yellow',
      title: { fr: 'Alerte salinité côtière potentielle', en: 'Potential coastal salinity alert' },
      description: {
        fr: 'Parcelle à moins de 30 km de la côte. Les données de salinité ne sont pas mesurables par satellite — analyse terrain recommandée.',
        en: 'Plot within 30 km of the coast. Salinity data cannot be measured by satellite — field analysis recommended.',
      },
      recommendations: {
        fr: ['Privilégier cultures tolérantes au sel (sorgho, orge, cocotier)', 'Déconseiller haricot vert, tomate, niébé', 'Analyse terrain salinité recommandée'],
        en: ['Favor salt-tolerant crops (sorghum, barley, coconut)', 'Avoid green bean, tomato, cowpea', 'Field salinity analysis recommended'],
      },
    });
  }

  return risks;
}

// ─── IMMEDIATE ALERTS ────────────────────────────────────────────────────────

function assessAlerts(weather: CurrentWeather | null, climate: ClimateData, zone: AgroZone): ImmediateAlert[] {
  if (!weather) return [];
  const alerts: ImmediateAlert[] = [];
  const currentMonth = new Date().getMonth();
  const isRainySeason = climate.waterBalance[currentMonth] >= 0;

  if (weather.temp > 38) {
    alerts.push({
      type: 'heat_stress', level: 'red',
      title: { fr: '🌡️ Stress thermique', en: '🌡️ Heat stress' },
      description: {
        fr: `Température actuelle ${weather.temp.toFixed(1)}°C. Risque de chute de rendement de 20 à 40% si vos cultures sont en floraison.`,
        en: `Current temperature ${weather.temp.toFixed(1)}°C. Risk of 20-40% yield loss if crops are flowering.`,
      },
    });
  }

  if (weather.rain_1h < 0.5 && isRainySeason) {
    alerts.push({
      type: 'water_deficit', level: 'orange',
      title: { fr: '💧 Déficit hydrique', en: '💧 Water deficit' },
      description: {
        fr: 'Peu de pluie en pleine saison humide. Irriguer si possible ou pailler pour limiter l\'évaporation.',
        en: 'Low rainfall during rainy season. Irrigate if possible or mulch to limit evaporation.',
      },
    });
  }

  if (weather.humidity > 90 && weather.temp >= 22 && weather.temp <= 32) {
    alerts.push({
      type: 'fungal_risk', level: 'orange',
      title: { fr: '🍄 Risque fongique immédiat', en: '🍄 Immediate fungal risk' },
      description: {
        fr: `Humidité ${weather.humidity}% + temp ${weather.temp.toFixed(1)}°C. Surveillez les feuilles pour signes de maladie.`,
        en: `Humidity ${weather.humidity}% + temp ${weather.temp.toFixed(1)}°C. Watch leaves for disease signs.`,
      },
    });
  }

  if (weather.wind_speed > 8 && zone === 'sahelian') {
    alerts.push({
      type: 'wind_erosion', level: 'orange',
      title: { fr: '💨 Risque d\'érosion éolienne', en: '💨 Wind erosion risk' },
      description: {
        fr: `Vent ${weather.wind_speed} m/s en zone sahélienne. Surveillez les jeunes plants.`,
        en: `Wind ${weather.wind_speed} m/s in Sahelian zone. Watch young plants.`,
      },
    });
  }

  return alerts;
}

// ─── SOIL INTERPRETATIONS ────────────────────────────────────────────────────

function buildSoilInterpretations(soil: SoilData): AnalysisResult['soilInterpretations'] {
  const interps: AnalysisResult['soilInterpretations'] = [];

  const phLevel = soil.ph < 5.5 ? { fr: 'acide', en: 'acidic' } :
    soil.ph < 6.5 ? { fr: 'légèrement acide, excellent pour la plupart des cultures africaines', en: 'slightly acidic, excellent for most African crops' } :
    soil.ph < 7.5 ? { fr: 'neutre, idéal pour la majorité des cultures', en: 'neutral, ideal for most crops' } :
    { fr: 'alcalin, risque de carences en fer et zinc', en: 'alkaline, risk of iron and zinc deficiencies' };
  interps.push({ label: 'pH', value: soil.ph.toFixed(1), interpretation: { fr: `pH ${soil.ph.toFixed(1)} — sol ${phLevel.fr}`, en: `pH ${soil.ph.toFixed(1)} — ${phLevel.en} soil` } });

  const nLevel = soil.nitrogenKgHa > 80 ? { fr: 'bon niveau, entretien suffisant', en: 'good level, maintenance sufficient' } :
    soil.nitrogenKgHa > 50 ? { fr: 'niveau modéré, un apport d\'entretien est conseillé', en: 'moderate level, maintenance input recommended' } :
    { fr: 'niveau faible, apport organique + azoté indispensable', en: 'low level, organic + nitrogen input essential' };
  interps.push({ label: 'Azote', value: `${soil.nitrogenKgHa.toFixed(0)} kg/ha`, interpretation: { fr: `Azote disponible : ${soil.nitrogenKgHa.toFixed(0)} kg/ha — ${nLevel.fr}`, en: `Available nitrogen: ${soil.nitrogenKgHa.toFixed(0)} kg/ha — ${nLevel.en}` } });

  const socLevel = soil.soc < 5 ? { fr: 'très faible — sol appauvri, fertilité limitée', en: 'very low — depleted soil, limited fertility' } :
    soil.soc < 10 ? { fr: 'acceptable sans ajustement', en: 'acceptable without adjustment' } :
    soil.soc > 20 ? { fr: 'riche en matière organique — excellent', en: 'rich in organic matter — excellent' } :
    { fr: 'correct', en: 'adequate' };
  interps.push({ label: 'Carbone organique', value: `${soil.soc.toFixed(1)} g/kg`, interpretation: { fr: `SOC ${soil.soc.toFixed(1)} g/kg — ${socLevel.fr}`, en: `SOC ${soil.soc.toFixed(1)} g/kg — ${socLevel.en}` } });

  const cecLevel = soil.cec < 10 ? { fr: 'faible rétention — fractionner les apports d\'engrais (3× minimum)', en: 'low retention — split fertilizer applications (3× minimum)' } :
    soil.cec > 25 ? { fr: 'bonne rétention — 2 apports suffisent', en: 'good retention — 2 applications sufficient' } :
    { fr: 'rétention correcte', en: 'adequate retention' };
  interps.push({ label: 'CEC', value: `${soil.cec.toFixed(1)} cmol/kg`, interpretation: { fr: `CEC ${soil.cec.toFixed(1)} cmol/kg — ${cecLevel.fr}`, en: `CEC ${soil.cec.toFixed(1)} cmol/kg — ${cecLevel.en}` } });

  const textureType = soil.clay > 40 ? { fr: 'argileux — bonne rétention eau mais risque compaction', en: 'clayey — good water retention but compaction risk' } :
    soil.sand > 60 ? { fr: 'sableux — drainage rapide, fertilisation fractionnée nécessaire', en: 'sandy — fast drainage, split fertilization needed' } :
    { fr: 'équilibré — bon pour la plupart des cultures', en: 'balanced — good for most crops' };
  interps.push({ label: 'Texture', value: `Argile ${soil.clay.toFixed(0)}% / Sable ${soil.sand.toFixed(0)}%`, interpretation: { fr: `Sol ${textureType.fr}`, en: `${textureType.en} soil` } });

  return interps;
}

// ─── INPUT RECOMMENDATIONS ───────────────────────────────────────────────────

function calcInputRecs(soil: SoilData, crop: CropRef, zone: AgroZone): InputRec[] {
  const recs: InputRec[] = [];
  const needOrganic = soil.soc < 5 || (soil.soc < 5 && soil.cec < 10);

  if (needOrganic) {
    recs.push({
      type: 'organic', priority: 1,
      name: { fr: 'Fumure animale ou compost', en: 'Animal manure or compost' },
      quantity: '5 à 10 t/ha',
      timing: { fr: 'Épandre 2-3 semaines avant semis', en: 'Spread 2-3 weeks before sowing' },
    });
  }

  if (soil.nitrogenKgHa < 60) {
    const splits = soil.cec < 10 ? '3' : '2';
    recs.push({
      type: 'mineral', priority: needOrganic ? 2 : 1,
      name: { fr: 'Urée (46-0-0)', en: 'Urea (46-0-0)' },
      quantity: `${Math.round(Math.max(0, 60 - soil.nitrogenKgHa))} kg N/ha en ${splits} apports`,
      timing: {
        fr: `Fractionner en ${splits} apports : 1/3 au semis, restes au tallage et floraison`,
        en: `Split into ${splits} applications: 1/3 at sowing, rest at tillering and flowering`,
      },
    });
  }

  if (soil.ph < 5.5) {
    const limeQty = Math.round((5.5 - soil.ph) * 1500);
    recs.push({
      type: 'mineral', priority: 1,
      name: { fr: 'Chaulage (calcaire broyé)', en: 'Liming (ground limestone)' },
      quantity: `${limeQty} kg/ha`,
      timing: { fr: 'Appliquer 1 mois avant semis, incorporer au sol', en: 'Apply 1 month before sowing, incorporate into soil' },
    });
  }

  return recs;
}

// ─── MAIN ANALYSIS ───────────────────────────────────────────────────────────

export function runFullAnalysis(
  soil: SoilData, climate: ClimateData, geo: GeoLocation,
  weather: CurrentWeather | null, hasIrrigation: boolean, parcelArea: number,
  lat: number = 0, lon: number = 0
): AnalysisResult {
  const zone = determineZone(
    lat, lon, geo.countryCode, climate.altitude,
    climate.annualRainfall, climate.deficitMonths, climate.correctedTemp
  );

  const weights = ZONE_WEIGHTS[zone];
  const risks = assessRisks(soil, climate, zone, geo);
  const alerts = assessAlerts(weather, climate, zone);

  // Determine confidence
  let confidence = 0;
  if (soil.isReal) confidence += 40;
  if (!climate.isFallback) confidence += 40;
  if (soil.isReal && !climate.isFallback) confidence += 20;
  if (!soil.isReal) confidence -= 20;
  if (climate.isFallback) confidence -= 20;
  confidence = Math.max(0, Math.min(100, confidence));

  const hasCompaction = risks.some(r => r.type === 'compaction');
  const hasSalinity = risks.some(r => r.type === 'salinity');

  // Score all crops
  const allScores: CropScore[] = [];
  const irrigatedCropsToFilter = ['tomato', 'onion', 'okra', 'pepper'];
  const wellDistributedRain = climate.wetMonths >= 8 && climate.annualRainfall > 1000;

  for (const [key, crop] of Object.entries(CROPS)) {
    let eliminated = false;
    let eliminationReason: { fr: string; en: string } | undefined;

    // Zone incompatibility
    if (!crop.zones.includes(zone) && !(zone === 'mountain_med' && crop.zones.includes('mediterranean'))) {
      eliminated = true;
      eliminationReason = { fr: `Incompatible avec la ${ZONE_LABELS[zone].fr}`, en: `Incompatible with ${ZONE_LABELS[zone].en}` };
    }

    // CFVO > 35% eliminates tubers
    if (!eliminated && crop.isTuber && soil.cfvo > 35) {
      eliminated = true;
      eliminationReason = {
        fr: 'Sol caillouteux (>35% fragments) — empêche le développement des racines charnues',
        en: 'Stony soil (>35% fragments) — prevents fleshy root development',
      };
    }

    // Irrigation filter
    if (!eliminated && crop.isIrrigated && !hasIrrigation && irrigatedCropsToFilter.includes(key)) {
      if (!(climate.annualRainfall > 1000 && wellDistributedRain)) {
        eliminated = true;
        eliminationReason = {
          fr: 'Culture maraîchère irriguée — pas d\'accès à l\'eau et pluviométrie insuffisante',
          en: 'Irrigated vegetable crop — no water access and insufficient rainfall',
        };
      }
    }

    // Temperature out of tolerance
    if (!eliminated && (climate.correctedTemp < crop.tempTol[0] || climate.correctedTemp > crop.tempTol[1])) {
      eliminated = true;
      eliminationReason = {
        fr: `Température corrigée ${climate.correctedTemp.toFixed(1)}°C hors plage tolérée (${crop.tempTol[0]}-${crop.tempTol[1]}°C)`,
        en: `Corrected temperature ${climate.correctedTemp.toFixed(1)}°C outside tolerated range (${crop.tempTol[0]}-${crop.tempTol[1]}°C)`,
      };
    }

    // Salinity filter
    if (!eliminated && hasSalinity && crop.saltSensitive) {
      eliminated = true;
      eliminationReason = { fr: 'Culture sensible au sel — zone côtière à risque', en: 'Salt-sensitive crop — coastal zone at risk' };
    }

    // Compaction filter
    if (!eliminated && hasCompaction && crop.deepRooted) {
      eliminated = true;
      eliminationReason = { fr: 'Culture à enracinement profond — semelle de labour détectée', en: 'Deep-rooted crop — plow pan detected' };
    }

    // Calculate sub-scores
    const phScore = calcPhScore(soil.ph, crop.phOpt, crop.phTol);
    const rainScore = calcRainScore(climate.annualRainfall, climate.deficitMonths, crop, zone);
    const tempScore = calcTempScore(climate.correctedTemp, crop.tempOpt, crop.tempTol);
    const textureScore = calcTextureScore(soil.clay, soil.sand, crop);
    const nitrogenScore = calcNitrogenScore(soil.nitrogenKgHa);

    // Weighted score
    let score = Math.round(
      (phScore * weights.ph + rainScore * weights.rain + tempScore * weights.temp +
       textureScore * weights.texture + nitrogenScore * weights.nitrogen) / 100
    );

    // SOC adjustments
    if (soil.soc < 5) score = Math.max(0, score - 15);
    if (soil.soc > 20) score = Math.min(100, Math.round(score * 1.05));

    // Sunshine penalty for photosensitive crops
    if (crop.isPhotosensitive && climate.annualSolarRadiation < 15) score = Math.max(0, score - 10);

    // Mediterranean: exclude tropical crops in summer-dry season
    if (zone === 'mediterranean' && crop.category === 'tubers') score = Math.max(0, score - 30);

    score = Math.max(0, Math.min(100, score));

    const grade: Grade = score >= 75 ? 'excellent' : score >= 55 ? 'bon' : score >= 35 ? 'moyen' : 'deconseille';

    // Economics — 2026 projections based on FAOSTAT 2022-2023 + CIRAD price trend index
    // CIRAD/Cyclope 2024: +3-8% annual price increase for African commodities (inflation + demand)
    const FORECAST_YEAR = 2026;
    const PRICE_INFLATION_FACTOR = 1.12; // cumulative 2023→2026 (~3.8%/yr, CIRAD Cyclope, FAO AMIS)
    const adjustedPriceUSD = crop.priceUSD * PRICE_INFLATION_FACTOR;

    const zoneYields = crop.yields[zone] || crop.yields[Object.keys(crop.yields)[0] as AgroZone] || [0.5, 1.0];
    const scoreFactor = score / 100;
    const yieldLowPerHa = Math.round(zoneYields[0] * scoreFactor * 100) / 100;
    const yieldHighPerHa = Math.round(zoneYields[1] * scoreFactor * 100) / 100;
    const yieldLow = Math.round(yieldLowPerHa * parcelArea * 100) / 100;
    const yieldHigh = Math.round(yieldHighPerHa * parcelArea * 100) / 100;

    // Detailed cost breakdown per hectare (USD) — sources: CIRAD 2023, IITA, AfricaRice
    const avgYieldPerHa = (yieldLowPerHa + yieldHighPerHa) / 2;
    const avgRevenuePerHa = avgYieldPerHa * adjustedPriceUSD;
    const seedCostPerHa = avgRevenuePerHa * crop.seedCostPct / 100;
    const laborCostPerHa = avgRevenuePerHa * crop.laborPct / 100;
    // Fertilizer: based on actual soil deficit
    const fertilizerNeedKg = soil.nitrogenKgHa < 60 ? Math.max(0, 60 - soil.nitrogenKgHa) / 0.46 : 0;
    const fertilizerCostPerHa = fertilizerNeedKg * 0.6; // ~0.6 USD/kg urea (IFDC Africa 2024)
    // Phytosanitary: 5-8% of revenue for vegetables, 2-4% for cereals/legumes
    const phytoPct = ['vegetables'].includes(crop.category) ? 0.065 : 0.03;
    const phytoCostPerHa = avgRevenuePerHa * phytoPct;
    // Transport/post-harvest: 5-10% depending on perishability
    const transportPct = crop.isTuber || ['vegetables'].includes(crop.category) ? 0.08 : 0.05;
    const transportCostPerHa = avgRevenuePerHa * transportPct;

    const totalCostPerHa = seedCostPerHa + laborCostPerHa + fertilizerCostPerHa + phytoCostPerHa + transportCostPerHa;

    const rate = geo.currencyRate;
    const revenueLowUSD = yieldLowPerHa * adjustedPriceUSD;
    const revenueHighUSD = yieldHighPerHa * adjustedPriceUSD;
    const revenueLow = Math.round(revenueLowUSD * rate * parcelArea);
    const revenueHigh = Math.round(revenueHighUSD * rate * parcelArea);
    const costsLow = Math.round(totalCostPerHa * 0.85 * rate * parcelArea);
    const costsHigh = Math.round(totalCostPerHa * 1.15 * rate * parcelArea);

    // Sowing info
    const sowInfo = crop.sowingByZone[zone] || crop.sowingByZone[Object.keys(crop.sowingByZone)[0] as AgroZone];

    // Radar legend
    const radarLegend = [
      { axis: 'pH', status: phScore >= 75 ? 'favorable' as const : phScore >= 50 ? 'limite' as const : 'problematique' as const },
      { axis: 'Texture', status: textureScore >= 75 ? 'favorable' as const : textureScore >= 50 ? 'limite' as const : 'problematique' as const },
      { axis: 'Température', status: tempScore >= 75 ? 'favorable' as const : tempScore >= 50 ? 'limite' as const : 'problematique' as const },
      { axis: 'Pluie', status: rainScore >= 75 ? 'favorable' as const : rainScore >= 50 ? 'limite' as const : 'problematique' as const },
      { axis: 'Azote', status: nitrogenScore >= 75 ? 'favorable' as const : nitrogenScore >= 50 ? 'limite' as const : 'problematique' as const },
    ];

    allScores.push({
      key, name: crop.name, category: crop.category, score, grade,
      subScores: { ph: phScore, texture: textureScore, temp: tempScore, rain: rainScore, nitrogen: nitrogenScore },
      yieldLow, yieldHigh,
      yieldLowPerHa, yieldHighPerHa,
      revenueLow, revenueHigh,
      costsLow, costsHigh,
      marginLow: revenueLow - costsHigh,
      marginHigh: revenueHigh - costsLow,
      costBreakdown: {
        seeds: Math.round(seedCostPerHa * rate * parcelArea),
        labor: Math.round(laborCostPerHa * rate * parcelArea),
        fertilizer: Math.round(fertilizerCostPerHa * rate * parcelArea),
        phyto: Math.round(phytoCostPerHa * rate * parcelArea),
        transport: Math.round(transportCostPerHa * rate * parcelArea),
      },
      pricePerTon: Math.round(adjustedPriceUSD),
      pricePerTonLocal: Math.round(adjustedPriceUSD * rate),
      forecastYear: FORECAST_YEAR,
      sowingWindow: sowInfo ? { fr: sowInfo.sow, en: sowInfo.sow } : { fr: '—', en: '—' },
      cycleDays: crop.cycleDays,
      harvestWindow: sowInfo ? { fr: sowInfo.harvest, en: sowInfo.harvest } : { fr: '—', en: '—' },
      saleWindow: sowInfo ? { fr: sowInfo.sale, en: sowInfo.sale } : { fr: '—', en: '—' },
      association: crop.association,
      eliminationReason: eliminated ? eliminationReason : undefined,
      inputRecommendations: eliminated ? [] : calcInputRecs(soil, crop, zone),
      radarLegend,
    });
  }

  // Separate and sort
  const eligible = allScores.filter(c => !c.eliminationReason).sort((a, b) => b.score - a.score);
  const excluded = allScores.filter(c => c.eliminationReason);
  const topCrops = eligible.slice(0, 5);

  // Rotation from top crop
  const topCropRef = topCrops[0] ? CROPS[topCrops[0].key] : null;
  const rotation: RotationYear[] = topCropRef ? [
    { year: 1, crop: topCropRef.name, reason: { fr: 'Culture principale recommandée', en: 'Recommended main crop' } },
    ...topCropRef.rotationAfter.map((r, i) => ({
      year: i + 2,
      crop: { fr: r.fr.split(':')[1]?.trim() || r.fr, en: r.en.split(':')[1]?.trim() || r.en },
      reason: r,
    })),
  ] : [];

  // Subsistence/cash allocation
  let allocFood = 0.5, allocCash = 0.5;
  let allocDesc: { fr: string; en: string };
  if (parcelArea < 2) {
    allocFood = 0.65; allocCash = 0.35;
    const foodArea = (parcelArea * allocFood).toFixed(1);
    const cashArea = (parcelArea * allocCash).toFixed(1);
    const foodCrop = topCrops.find(c => ['cereals', 'tubers'].includes(c.category));
    const cashCrop = topCrops.find(c => ['cash', 'legumes'].includes(c.category));
    allocDesc = {
      fr: `Pour votre parcelle de ${parcelArea.toFixed(1)} ha : ${foodArea} ha en ${foodCrop?.name.fr || 'culture vivrière'} (alimentation) et ${cashArea} ha en ${cashCrop?.name.fr || 'culture de rente'} (vente)`,
      en: `For your ${parcelArea.toFixed(1)} ha plot: ${foodArea} ha of ${foodCrop?.name.en || 'food crop'} (subsistence) and ${cashArea} ha of ${cashCrop?.name.en || 'cash crop'} (sale)`,
    };
  } else if (parcelArea <= 5) {
    allocFood = 0.5; allocCash = 0.5;
    allocDesc = {
      fr: `Parcelle de ${parcelArea.toFixed(1)} ha : 50% alimentation, 50% rente. Association possible avec une 3ème culture.`,
      en: `${parcelArea.toFixed(1)} ha plot: 50% food, 50% cash. Third crop association possible.`,
    };
  } else {
    allocFood = 0.3; allocCash = 0.7;
    allocDesc = {
      fr: `Grande parcelle (${parcelArea.toFixed(1)} ha) : culture de rente majoritaire mais conserver au minimum 1 ha en cultures alimentaires.`,
      en: `Large plot (${parcelArea.toFixed(1)} ha): cash crop dominant but keep at least 1 ha for food crops.`,
    };
  }

  // Soil interpretations
  const soilInterpretations = buildSoilInterpretations(soil);

  // Confidence label
  const confLabel = confidence >= 80
    ? { fr: 'Fiabilité élevée — données satellites confirmées', en: 'High reliability — satellite data confirmed' }
    : confidence >= 60
    ? { fr: 'Fiabilité correcte — recommandations indicatives', en: 'Adequate reliability — indicative recommendations' }
    : { fr: 'Fiabilité limitée — vérification terrain recommandée avant investissement', en: 'Limited reliability — field verification recommended before investment' };

  // Add special rule: low N always recommend legume association
  if (soil.nitrogenKgHa < 60 && topCrops[0] && !topCrops[0].association.fr.includes('légumineuse')) {
    topCrops[0] = {
      ...topCrops[0],
      association: {
        fr: topCrops[0].association.fr + ' — IMPORTANT : associer ou précéder par une légumineuse (sol pauvre en azote)',
        en: topCrops[0].association.en + ' — IMPORTANT: associate or precede with a legume (low nitrogen soil)',
      },
    };
  }

  return {
    zone,
    zoneLabel: ZONE_LABELS[zone],
    zoneDescription: ZONE_DESC[zone],
    risks,
    alerts,
    cropScores: allScores,
    topCrops,
    excludedCrops: excluded,
    rotation,
    associationSystem: ZONE_SYSTEM[zone],
    allocationFood: allocFood,
    allocationCash: allocCash,
    allocationDescription: allocDesc,
    confidenceIndex: confidence,
    confidenceLabel: confLabel,
    soilInterpretations,
  };
}

export function determineZoneWithCoords(
  lat: number, lon: number, countryCode: string, altitude: number,
  annualRain: number, deficitMonths: number, correctedTemp: number
): AgroZone {
  return determineZone(lat, lon, countryCode, altitude, annualRain, deficitMonths, correctedTemp);
}
