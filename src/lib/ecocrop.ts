// ECOCROP-inspired crop requirements database
// Each crop has optimal ranges for soil and climate parameters

export interface CropRequirement {
  name: { fr: string; en: string };
  category: string;
  ph_min: number;
  ph_max: number;
  temp_min: number; // °C
  temp_max: number;
  rain_min: number; // mm/year
  rain_max: number;
  clay_min: number; // %
  clay_max: number;
  sand_min: number;
  sand_max: number;
  soc_min: number; // g/kg organic carbon
  soc_max: number;
  nitrogen_min: number; // g/kg
  nitrogen_max: number;
  phosphorus_min: number; // mg/kg
  phosphorus_max: number;
  potassium_min: number; // mg/kg (cmol/kg CEC proxy)
  potassium_max: number;
  water_need: number; // m³/ha
  cycle_days: number;
  yield_potential: number; // t/ha
  market_price: number; // $/ton
}

export const crops: Record<string, CropRequirement> = {
  maize: { name: { fr: 'Maïs', en: 'Maize' }, category: 'cereals', ph_min: 5.5, ph_max: 7.5, temp_min: 18, temp_max: 35, rain_min: 500, rain_max: 1200, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 8, soc_max: 50, nitrogen_min: 1.0, nitrogen_max: 5.0, phosphorus_min: 10, phosphorus_max: 50, potassium_min: 80, potassium_max: 300, water_need: 5000, cycle_days: 120, yield_potential: 8, market_price: 200 },
  rice: { name: { fr: 'Riz', en: 'Rice' }, category: 'cereals', ph_min: 5.0, ph_max: 7.0, temp_min: 20, temp_max: 37, rain_min: 1000, rain_max: 2500, clay_min: 20, clay_max: 60, sand_min: 10, sand_max: 40, soc_min: 10, soc_max: 60, nitrogen_min: 1.2, nitrogen_max: 5.0, phosphorus_min: 8, phosphorus_max: 40, potassium_min: 60, potassium_max: 250, water_need: 12000, cycle_days: 150, yield_potential: 6, market_price: 350 },
  wheat: { name: { fr: 'Blé', en: 'Wheat' }, category: 'cereals', ph_min: 6.0, ph_max: 8.0, temp_min: 10, temp_max: 30, rain_min: 400, rain_max: 1000, clay_min: 15, clay_max: 45, sand_min: 15, sand_max: 50, soc_min: 8, soc_max: 45, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 80, potassium_max: 280, water_need: 4500, cycle_days: 130, yield_potential: 5, market_price: 250 },
  sorghum: { name: { fr: 'Sorgho', en: 'Sorghum' }, category: 'cereals', ph_min: 5.5, ph_max: 8.5, temp_min: 20, temp_max: 40, rain_min: 300, rain_max: 1000, clay_min: 5, clay_max: 50, sand_min: 10, sand_max: 70, soc_min: 5, soc_max: 40, nitrogen_min: 0.8, nitrogen_max: 3.5, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 60, potassium_max: 250, water_need: 4000, cycle_days: 110, yield_potential: 4, market_price: 180 },
  millet: { name: { fr: 'Mil', en: 'Millet' }, category: 'cereals', ph_min: 5.0, ph_max: 8.0, temp_min: 22, temp_max: 40, rain_min: 200, rain_max: 800, clay_min: 5, clay_max: 35, sand_min: 30, sand_max: 80, soc_min: 3, soc_max: 30, nitrogen_min: 0.5, nitrogen_max: 3.0, phosphorus_min: 5, phosphorus_max: 30, potassium_min: 50, potassium_max: 200, water_need: 3000, cycle_days: 90, yield_potential: 2.5, market_price: 220 },
  cassava: { name: { fr: 'Manioc', en: 'Cassava' }, category: 'tubers', ph_min: 4.5, ph_max: 7.5, temp_min: 20, temp_max: 35, rain_min: 500, rain_max: 2000, clay_min: 5, clay_max: 40, sand_min: 20, sand_max: 70, soc_min: 5, soc_max: 40, nitrogen_min: 0.5, nitrogen_max: 3.0, phosphorus_min: 5, phosphorus_max: 25, potassium_min: 60, potassium_max: 250, water_need: 5000, cycle_days: 300, yield_potential: 25, market_price: 80 },
  yam: { name: { fr: 'Igname', en: 'Yam' }, category: 'tubers', ph_min: 5.5, ph_max: 7.0, temp_min: 22, temp_max: 35, rain_min: 800, rain_max: 1800, clay_min: 10, clay_max: 35, sand_min: 20, sand_max: 60, soc_min: 10, soc_max: 50, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 100, potassium_max: 350, water_need: 6000, cycle_days: 240, yield_potential: 15, market_price: 150 },
  potato: { name: { fr: 'Pomme de terre', en: 'Potato' }, category: 'tubers', ph_min: 5.0, ph_max: 6.5, temp_min: 12, temp_max: 25, rain_min: 500, rain_max: 1200, clay_min: 15, clay_max: 40, sand_min: 20, sand_max: 55, soc_min: 12, soc_max: 55, nitrogen_min: 1.5, nitrogen_max: 5.0, phosphorus_min: 15, phosphorus_max: 50, potassium_min: 120, potassium_max: 350, water_need: 5500, cycle_days: 100, yield_potential: 30, market_price: 120 },
  sweetpotato: { name: { fr: 'Patate douce', en: 'Sweet Potato' }, category: 'tubers', ph_min: 5.0, ph_max: 7.0, temp_min: 20, temp_max: 35, rain_min: 500, rain_max: 1500, clay_min: 5, clay_max: 35, sand_min: 25, sand_max: 70, soc_min: 5, soc_max: 35, nitrogen_min: 0.8, nitrogen_max: 3.0, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 80, potassium_max: 300, water_need: 4500, cycle_days: 120, yield_potential: 20, market_price: 100 },
  tomato: { name: { fr: 'Tomate', en: 'Tomato' }, category: 'vegetables', ph_min: 5.5, ph_max: 7.5, temp_min: 18, temp_max: 32, rain_min: 400, rain_max: 1200, clay_min: 10, clay_max: 35, sand_min: 25, sand_max: 60, soc_min: 12, soc_max: 55, nitrogen_min: 1.5, nitrogen_max: 5.5, phosphorus_min: 15, phosphorus_max: 60, potassium_min: 120, potassium_max: 400, water_need: 6000, cycle_days: 90, yield_potential: 40, market_price: 300 },
  onion: { name: { fr: 'Oignon', en: 'Onion' }, category: 'vegetables', ph_min: 6.0, ph_max: 7.5, temp_min: 12, temp_max: 30, rain_min: 350, rain_max: 1000, clay_min: 15, clay_max: 40, sand_min: 20, sand_max: 55, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 12, phosphorus_max: 50, potassium_min: 100, potassium_max: 350, water_need: 4000, cycle_days: 100, yield_potential: 25, market_price: 250 },
  pepper: { name: { fr: 'Piment/Poivron', en: 'Pepper' }, category: 'vegetables', ph_min: 5.5, ph_max: 7.0, temp_min: 18, temp_max: 35, rain_min: 500, rain_max: 1500, clay_min: 10, clay_max: 35, sand_min: 20, sand_max: 55, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 5.0, phosphorus_min: 12, phosphorus_max: 50, potassium_min: 100, potassium_max: 350, water_need: 5500, cycle_days: 100, yield_potential: 15, market_price: 400 },
  cabbage: { name: { fr: 'Chou', en: 'Cabbage' }, category: 'vegetables', ph_min: 6.0, ph_max: 7.5, temp_min: 12, temp_max: 25, rain_min: 400, rain_max: 1000, clay_min: 15, clay_max: 45, sand_min: 15, sand_max: 50, soc_min: 12, soc_max: 55, nitrogen_min: 1.5, nitrogen_max: 5.5, phosphorus_min: 15, phosphorus_max: 55, potassium_min: 120, potassium_max: 380, water_need: 4500, cycle_days: 80, yield_potential: 35, market_price: 150 },
  carrot: { name: { fr: 'Carotte', en: 'Carrot' }, category: 'vegetables', ph_min: 6.0, ph_max: 7.0, temp_min: 12, temp_max: 25, rain_min: 400, rain_max: 1000, clay_min: 5, clay_max: 25, sand_min: 30, sand_max: 70, soc_min: 10, soc_max: 50, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 320, water_need: 4000, cycle_days: 75, yield_potential: 30, market_price: 200 },
  lettuce: { name: { fr: 'Laitue', en: 'Lettuce' }, category: 'vegetables', ph_min: 6.0, ph_max: 7.0, temp_min: 10, temp_max: 25, rain_min: 300, rain_max: 900, clay_min: 10, clay_max: 30, sand_min: 25, sand_max: 60, soc_min: 12, soc_max: 55, nitrogen_min: 1.5, nitrogen_max: 5.0, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 300, water_need: 3000, cycle_days: 50, yield_potential: 20, market_price: 350 },
  cocoa: { name: { fr: 'Cacao', en: 'Cocoa' }, category: 'cash', ph_min: 5.0, ph_max: 7.5, temp_min: 20, temp_max: 32, rain_min: 1200, rain_max: 2500, clay_min: 15, clay_max: 45, sand_min: 15, sand_max: 50, soc_min: 15, soc_max: 60, nitrogen_min: 1.5, nitrogen_max: 5.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 300, water_need: 8000, cycle_days: 365, yield_potential: 2, market_price: 3000 },
  coffee: { name: { fr: 'Café', en: 'Coffee' }, category: 'cash', ph_min: 5.0, ph_max: 6.5, temp_min: 15, temp_max: 28, rain_min: 1000, rain_max: 2500, clay_min: 15, clay_max: 45, sand_min: 15, sand_max: 50, soc_min: 15, soc_max: 60, nitrogen_min: 1.5, nitrogen_max: 5.0, phosphorus_min: 10, phosphorus_max: 45, potassium_min: 100, potassium_max: 350, water_need: 7000, cycle_days: 365, yield_potential: 2.5, market_price: 2500 },
  cotton: { name: { fr: 'Coton', en: 'Cotton' }, category: 'cash', ph_min: 5.5, ph_max: 8.0, temp_min: 20, temp_max: 40, rain_min: 500, rain_max: 1200, clay_min: 10, clay_max: 45, sand_min: 15, sand_max: 60, soc_min: 5, soc_max: 35, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 280, water_need: 7000, cycle_days: 180, yield_potential: 3, market_price: 1500 },
  sugarcane: { name: { fr: 'Canne à sucre', en: 'Sugarcane' }, category: 'cash', ph_min: 5.0, ph_max: 8.5, temp_min: 20, temp_max: 38, rain_min: 800, rain_max: 2500, clay_min: 10, clay_max: 50, sand_min: 10, sand_max: 60, soc_min: 8, soc_max: 45, nitrogen_min: 1.0, nitrogen_max: 4.5, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 300, water_need: 15000, cycle_days: 365, yield_potential: 80, market_price: 40 },
  groundnut: { name: { fr: 'Arachide', en: 'Groundnut' }, category: 'legumes', ph_min: 5.5, ph_max: 7.5, temp_min: 20, temp_max: 35, rain_min: 400, rain_max: 1200, clay_min: 5, clay_max: 30, sand_min: 30, sand_max: 75, soc_min: 5, soc_max: 35, nitrogen_min: 0.5, nitrogen_max: 3.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 60, potassium_max: 250, water_need: 4500, cycle_days: 120, yield_potential: 3, market_price: 600 },
  soybean: { name: { fr: 'Soja', en: 'Soybean' }, category: 'legumes', ph_min: 5.5, ph_max: 7.5, temp_min: 18, temp_max: 35, rain_min: 450, rain_max: 1200, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 8, soc_max: 45, nitrogen_min: 0.8, nitrogen_max: 3.5, phosphorus_min: 10, phosphorus_max: 45, potassium_min: 80, potassium_max: 300, water_need: 5000, cycle_days: 120, yield_potential: 3, market_price: 450 },
  cowpea: { name: { fr: 'Niébé', en: 'Cowpea' }, category: 'legumes', ph_min: 5.5, ph_max: 7.5, temp_min: 22, temp_max: 38, rain_min: 300, rain_max: 1000, clay_min: 5, clay_max: 35, sand_min: 25, sand_max: 75, soc_min: 3, soc_max: 30, nitrogen_min: 0.5, nitrogen_max: 2.5, phosphorus_min: 5, phosphorus_max: 30, potassium_min: 50, potassium_max: 200, water_need: 3500, cycle_days: 80, yield_potential: 2, market_price: 500 },
  bean: { name: { fr: 'Haricot', en: 'Bean' }, category: 'legumes', ph_min: 5.5, ph_max: 7.0, temp_min: 15, temp_max: 30, rain_min: 400, rain_max: 1200, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 8, soc_max: 45, nitrogen_min: 0.8, nitrogen_max: 3.5, phosphorus_min: 10, phosphorus_max: 45, potassium_min: 80, potassium_max: 300, water_need: 4000, cycle_days: 90, yield_potential: 2.5, market_price: 500 },
  banana: { name: { fr: 'Banane', en: 'Banana' }, category: 'fruits', ph_min: 5.0, ph_max: 7.5, temp_min: 20, temp_max: 35, rain_min: 1000, rain_max: 3000, clay_min: 15, clay_max: 45, sand_min: 10, sand_max: 50, soc_min: 12, soc_max: 60, nitrogen_min: 1.5, nitrogen_max: 5.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 150, potassium_max: 500, water_need: 12000, cycle_days: 365, yield_potential: 30, market_price: 200 },
  mango: { name: { fr: 'Mangue', en: 'Mango' }, category: 'fruits', ph_min: 5.5, ph_max: 7.5, temp_min: 22, temp_max: 38, rain_min: 500, rain_max: 2500, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 8, soc_max: 45, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 300, water_need: 6000, cycle_days: 365, yield_potential: 10, market_price: 400 },
  pineapple: { name: { fr: 'Ananas', en: 'Pineapple' }, category: 'fruits', ph_min: 4.5, ph_max: 6.5, temp_min: 20, temp_max: 35, rain_min: 600, rain_max: 2500, clay_min: 5, clay_max: 30, sand_min: 30, sand_max: 75, soc_min: 8, soc_max: 40, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 100, potassium_max: 350, water_need: 5000, cycle_days: 540, yield_potential: 40, market_price: 250 },
  citrus: { name: { fr: 'Agrumes', en: 'Citrus' }, category: 'fruits', ph_min: 5.5, ph_max: 7.0, temp_min: 15, temp_max: 35, rain_min: 600, rain_max: 2000, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 350, water_need: 8000, cycle_days: 365, yield_potential: 20, market_price: 350 },
  oil_palm: { name: { fr: 'Palmier à huile', en: 'Oil Palm' }, category: 'cash', ph_min: 4.0, ph_max: 6.5, temp_min: 22, temp_max: 35, rain_min: 1500, rain_max: 3000, clay_min: 10, clay_max: 50, sand_min: 10, sand_max: 55, soc_min: 10, soc_max: 55, nitrogen_min: 1.0, nitrogen_max: 4.5, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 80, potassium_max: 350, water_need: 10000, cycle_days: 365, yield_potential: 20, market_price: 500 },
  rubber: { name: { fr: 'Hévéa', en: 'Rubber' }, category: 'cash', ph_min: 4.0, ph_max: 6.5, temp_min: 20, temp_max: 35, rain_min: 1500, rain_max: 3000, clay_min: 15, clay_max: 50, sand_min: 10, sand_max: 50, soc_min: 10, soc_max: 55, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 60, potassium_max: 280, water_need: 9000, cycle_days: 365, yield_potential: 2, market_price: 1800 },
  okra: { name: { fr: 'Gombo', en: 'Okra' }, category: 'vegetables', ph_min: 5.8, ph_max: 7.5, temp_min: 22, temp_max: 38, rain_min: 400, rain_max: 1200, clay_min: 10, clay_max: 35, sand_min: 25, sand_max: 60, soc_min: 8, soc_max: 45, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 300, water_need: 4000, cycle_days: 60, yield_potential: 12, market_price: 350 },
  eggplant: { name: { fr: 'Aubergine', en: 'Eggplant' }, category: 'vegetables', ph_min: 5.5, ph_max: 7.0, temp_min: 18, temp_max: 35, rain_min: 400, rain_max: 1200, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 55, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 330, water_need: 5000, cycle_days: 80, yield_potential: 20, market_price: 280 },
  watermelon: { name: { fr: 'Pastèque', en: 'Watermelon' }, category: 'fruits', ph_min: 5.5, ph_max: 7.5, temp_min: 22, temp_max: 38, rain_min: 400, rain_max: 1000, clay_min: 5, clay_max: 25, sand_min: 35, sand_max: 75, soc_min: 5, soc_max: 35, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 100, potassium_max: 350, water_need: 5000, cycle_days: 85, yield_potential: 30, market_price: 150 },
  cucumber: { name: { fr: 'Concombre', en: 'Cucumber' }, category: 'vegetables', ph_min: 5.5, ph_max: 7.5, temp_min: 18, temp_max: 35, rain_min: 400, rain_max: 1200, clay_min: 10, clay_max: 35, sand_min: 25, sand_max: 60, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 330, water_need: 4000, cycle_days: 55, yield_potential: 25, market_price: 200 },
  sunflower: { name: { fr: 'Tournesol', en: 'Sunflower' }, category: 'cash', ph_min: 5.5, ph_max: 8.0, temp_min: 15, temp_max: 35, rain_min: 350, rain_max: 900, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 5, soc_max: 40, nitrogen_min: 0.8, nitrogen_max: 3.5, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 280, water_need: 4000, cycle_days: 110, yield_potential: 2.5, market_price: 500 },
  sesame: { name: { fr: 'Sésame', en: 'Sesame' }, category: 'cash', ph_min: 5.5, ph_max: 8.0, temp_min: 22, temp_max: 40, rain_min: 300, rain_max: 800, clay_min: 5, clay_max: 30, sand_min: 30, sand_max: 75, soc_min: 3, soc_max: 30, nitrogen_min: 0.5, nitrogen_max: 3.0, phosphorus_min: 5, phosphorus_max: 30, potassium_min: 50, potassium_max: 200, water_need: 3000, cycle_days: 100, yield_potential: 1.5, market_price: 1200 },
  teff: { name: { fr: 'Teff', en: 'Teff' }, category: 'cereals', ph_min: 5.0, ph_max: 8.0, temp_min: 15, temp_max: 30, rain_min: 300, rain_max: 1200, clay_min: 10, clay_max: 50, sand_min: 10, sand_max: 55, soc_min: 5, soc_max: 40, nitrogen_min: 0.8, nitrogen_max: 3.5, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 60, potassium_max: 250, water_need: 3500, cycle_days: 100, yield_potential: 2, market_price: 700 },
  barley: { name: { fr: 'Orge', en: 'Barley' }, category: 'cereals', ph_min: 6.0, ph_max: 8.5, temp_min: 8, temp_max: 28, rain_min: 300, rain_max: 800, clay_min: 10, clay_max: 45, sand_min: 15, sand_max: 60, soc_min: 5, soc_max: 40, nitrogen_min: 0.8, nitrogen_max: 3.5, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 70, potassium_max: 260, water_need: 3500, cycle_days: 100, yield_potential: 4, market_price: 200 },
  oat: { name: { fr: 'Avoine', en: 'Oat' }, category: 'cereals', ph_min: 5.5, ph_max: 7.5, temp_min: 8, temp_max: 25, rain_min: 350, rain_max: 900, clay_min: 10, clay_max: 40, sand_min: 15, sand_max: 55, soc_min: 8, soc_max: 45, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 70, potassium_max: 260, water_need: 3500, cycle_days: 90, yield_potential: 3.5, market_price: 250 },
  lentil: { name: { fr: 'Lentille', en: 'Lentil' }, category: 'legumes', ph_min: 6.0, ph_max: 8.0, temp_min: 10, temp_max: 28, rain_min: 250, rain_max: 700, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 5, soc_max: 35, nitrogen_min: 0.5, nitrogen_max: 2.5, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 60, potassium_max: 230, water_need: 2500, cycle_days: 90, yield_potential: 2, market_price: 700 },
  chickpea: { name: { fr: 'Pois chiche', en: 'Chickpea' }, category: 'legumes', ph_min: 6.0, ph_max: 9.0, temp_min: 15, temp_max: 35, rain_min: 250, rain_max: 800, clay_min: 10, clay_max: 45, sand_min: 15, sand_max: 60, soc_min: 5, soc_max: 35, nitrogen_min: 0.5, nitrogen_max: 2.5, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 60, potassium_max: 230, water_need: 3000, cycle_days: 110, yield_potential: 2.5, market_price: 600 },
  tea: { name: { fr: 'Thé', en: 'Tea' }, category: 'cash', ph_min: 4.0, ph_max: 6.0, temp_min: 12, temp_max: 28, rain_min: 1200, rain_max: 3000, clay_min: 15, clay_max: 50, sand_min: 10, sand_max: 45, soc_min: 15, soc_max: 65, nitrogen_min: 1.5, nitrogen_max: 5.5, phosphorus_min: 8, phosphorus_max: 35, potassium_min: 80, potassium_max: 300, water_need: 9000, cycle_days: 365, yield_potential: 3, market_price: 2000 },
  tobacco: { name: { fr: 'Tabac', en: 'Tobacco' }, category: 'cash', ph_min: 5.0, ph_max: 6.5, temp_min: 18, temp_max: 35, rain_min: 600, rain_max: 1500, clay_min: 10, clay_max: 35, sand_min: 25, sand_max: 65, soc_min: 10, soc_max: 45, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 100, potassium_max: 350, water_need: 5000, cycle_days: 120, yield_potential: 3, market_price: 3000 },
  cashew: { name: { fr: 'Anacarde', en: 'Cashew' }, category: 'cash', ph_min: 4.5, ph_max: 7.0, temp_min: 20, temp_max: 38, rain_min: 500, rain_max: 2000, clay_min: 5, clay_max: 35, sand_min: 25, sand_max: 70, soc_min: 5, soc_max: 35, nitrogen_min: 0.5, nitrogen_max: 3.0, phosphorus_min: 5, phosphorus_max: 30, potassium_min: 50, potassium_max: 250, water_need: 5000, cycle_days: 365, yield_potential: 1.5, market_price: 2500 },
  shea: { name: { fr: 'Karité', en: 'Shea' }, category: 'cash', ph_min: 5.0, ph_max: 7.0, temp_min: 22, temp_max: 40, rain_min: 600, rain_max: 1500, clay_min: 5, clay_max: 40, sand_min: 20, sand_max: 70, soc_min: 3, soc_max: 30, nitrogen_min: 0.5, nitrogen_max: 2.5, phosphorus_min: 5, phosphorus_max: 25, potassium_min: 40, potassium_max: 200, water_need: 4000, cycle_days: 365, yield_potential: 3, market_price: 800 },
  ginger: { name: { fr: 'Gingembre', en: 'Ginger' }, category: 'spices', ph_min: 5.5, ph_max: 7.0, temp_min: 20, temp_max: 35, rain_min: 800, rain_max: 2500, clay_min: 10, clay_max: 35, sand_min: 20, sand_max: 60, soc_min: 12, soc_max: 55, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 350, water_need: 6000, cycle_days: 240, yield_potential: 15, market_price: 600 },
  turmeric: { name: { fr: 'Curcuma', en: 'Turmeric' }, category: 'spices', ph_min: 5.0, ph_max: 7.0, temp_min: 20, temp_max: 35, rain_min: 800, rain_max: 2500, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 55, soc_min: 12, soc_max: 55, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 300, water_need: 5000, cycle_days: 240, yield_potential: 10, market_price: 800 },
  vanilla: { name: { fr: 'Vanille', en: 'Vanilla' }, category: 'spices', ph_min: 5.5, ph_max: 7.0, temp_min: 20, temp_max: 32, rain_min: 1500, rain_max: 3000, clay_min: 15, clay_max: 45, sand_min: 15, sand_max: 50, soc_min: 15, soc_max: 65, nitrogen_min: 1.5, nitrogen_max: 5.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 300, water_need: 8000, cycle_days: 365, yield_potential: 0.5, market_price: 25000 },
  avocado: { name: { fr: 'Avocat', en: 'Avocado' }, category: 'fruits', ph_min: 5.0, ph_max: 7.0, temp_min: 15, temp_max: 33, rain_min: 800, rain_max: 2500, clay_min: 10, clay_max: 35, sand_min: 25, sand_max: 65, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 100, potassium_max: 350, water_need: 7000, cycle_days: 365, yield_potential: 10, market_price: 1000 },
  papaya: { name: { fr: 'Papaye', en: 'Papaya' }, category: 'fruits', ph_min: 5.5, ph_max: 7.0, temp_min: 20, temp_max: 35, rain_min: 800, rain_max: 2500, clay_min: 10, clay_max: 35, sand_min: 25, sand_max: 65, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 350, water_need: 6000, cycle_days: 270, yield_potential: 30, market_price: 250 },
  guava: { name: { fr: 'Goyave', en: 'Guava' }, category: 'fruits', ph_min: 4.5, ph_max: 7.5, temp_min: 18, temp_max: 35, rain_min: 600, rain_max: 2000, clay_min: 10, clay_max: 40, sand_min: 20, sand_max: 60, soc_min: 8, soc_max: 45, nitrogen_min: 1.0, nitrogen_max: 4.0, phosphorus_min: 10, phosphorus_max: 40, potassium_min: 80, potassium_max: 300, water_need: 5000, cycle_days: 365, yield_potential: 15, market_price: 300 },
  passion_fruit: { name: { fr: 'Fruit de la passion', en: 'Passion Fruit' }, category: 'fruits', ph_min: 5.5, ph_max: 7.0, temp_min: 18, temp_max: 32, rain_min: 800, rain_max: 2000, clay_min: 10, clay_max: 35, sand_min: 25, sand_max: 60, soc_min: 10, soc_max: 50, nitrogen_min: 1.2, nitrogen_max: 4.5, phosphorus_min: 12, phosphorus_max: 45, potassium_min: 100, potassium_max: 350, water_need: 5500, cycle_days: 365, yield_potential: 10, market_price: 500 },
};

export function calculateCompatibility(
  crop: CropRequirement,
  soilData: { ph: number; clay: number; sand: number; soc: number; nitrogen: number; phosphorus: number; potassium: number },
  weatherData: { temp: number; rain: number }
): {
  score: number;
  details: { param: string; value: number; min: number; max: number; score: number; status: 'optimal' | 'acceptable' | 'poor' }[];
  waterNeed: number;
  nitrogenNeed: number;
  phosphorusNeed: number;
  potassiumNeed: number;
  phCorrection: number;
} {
  const params = [
    { param: 'pH', value: soilData.ph, min: crop.ph_min, max: crop.ph_max },
    { param: 'Clay %', value: soilData.clay, min: crop.clay_min, max: crop.clay_max },
    { param: 'Sand %', value: soilData.sand, min: crop.sand_min, max: crop.sand_max },
    { param: 'Organic Carbon', value: soilData.soc, min: crop.soc_min, max: crop.soc_max },
    { param: 'Nitrogen', value: soilData.nitrogen, min: crop.nitrogen_min, max: crop.nitrogen_max },
    { param: 'Phosphorus', value: soilData.phosphorus, min: crop.phosphorus_min, max: crop.phosphorus_max },
    { param: 'Potassium', value: soilData.potassium, min: crop.potassium_min, max: crop.potassium_max },
    { param: 'Temperature', value: weatherData.temp, min: crop.temp_min, max: crop.temp_max },
    { param: 'Rainfall', value: weatherData.rain, min: crop.rain_min, max: crop.rain_max },
  ];

  const details = params.map(p => {
    let score: number;
    const range = p.max - p.min;
    const mid = (p.min + p.max) / 2;
    if (p.value >= p.min && p.value <= p.max) {
      const dist = Math.abs(p.value - mid) / (range / 2);
      score = 100 - dist * 20;
    } else {
      const deficit = p.value < p.min ? (p.min - p.value) / (range || 1) : (p.value - p.max) / (range || 1);
      score = Math.max(0, 60 - deficit * 40);
    }
    const status = score >= 75 ? 'optimal' as const : score >= 50 ? 'acceptable' as const : 'poor' as const;
    return { param: p.param, value: p.value, min: p.min, max: p.max, score: Math.round(score), status };
  });

  const totalScore = Math.round(details.reduce((s, d) => s + d.score, 0) / details.length);

  // Calculate input needs
  const nOptimal = (crop.nitrogen_min + crop.nitrogen_max) / 2;
  const pOptimal = (crop.phosphorus_min + crop.phosphorus_max) / 2;
  const kOptimal = (crop.potassium_min + crop.potassium_max) / 2;
  const phOptimal = (crop.ph_min + crop.ph_max) / 2;

  const nitrogenNeed = Math.max(0, Math.round((nOptimal - soilData.nitrogen) * 10)); // kg/ha approx
  const phosphorusNeed = Math.max(0, Math.round((pOptimal - soilData.phosphorus) * 2)); // kg/ha approx
  const potassiumNeed = Math.max(0, Math.round((kOptimal - soilData.potassium) * 0.5)); // kg/ha approx
  const phCorrection = Math.round((phOptimal - soilData.ph) * 100) / 100;

  return {
    score: totalScore,
    details,
    waterNeed: crop.water_need,
    nitrogenNeed,
    phosphorusNeed,
    potassiumNeed,
    phCorrection,
  };
}

export function getTopCompatibleCrops(
  soilData: { ph: number; clay: number; sand: number; soc: number; nitrogen: number; phosphorus: number; potassium: number },
  weatherData: { temp: number; rain: number },
  count = 5
): { key: string; crop: CropRequirement; score: number }[] {
  const results = Object.entries(crops).map(([key, crop]) => {
    const { score } = calculateCompatibility(crop, soilData, weatherData);
    return { key, crop, score };
  });
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count);
}
