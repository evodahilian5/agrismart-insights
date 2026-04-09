// SoilGrids V2 ISRIC/NASA — Soil property data
// Primary: Edge function proxy (SoilGrids → OpenLandMap → Regional estimates)
// Fallback: Direct SoilGrids API call

import { supabase } from '@/integrations/supabase/client';

export interface SoilData {
  ph: number;           // pH (unitless)
  clay: number;         // %
  sand: number;         // %
  silt: number;         // %
  soc: number;          // g/kg organic carbon
  nitrogen: number;     // g/kg
  nitrogenKgHa: number; // kg/ha (FAO-ISRIC formula)
  cec: number;          // cmol(c)/kg
  bdod: number;         // g/cm³ = kg/dm³ (0-30cm)
  bdodDeep: number;     // g/cm³ (30-60cm, for compaction detection)
  cfvo: number;         // % coarse fragments
  ocd: number;          // kg/m³ organic carbon density
  isReal: boolean;      // true if from API or regional estimate, false if total failure
  source?: string;      // Data source description
}

export async function fetchSoilData(lat: number, lon: number): Promise<SoilData> {
  // Strategy 1: Edge function (SoilGrids → OpenLandMap → Regional)
  try {
    console.log('Calling soil-data edge function...');
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (projectId && anonKey) {
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/soil-data?lat=${lat}&lon=${lon}`,
        {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
          },
        }
      );
      
      if (resp.ok) {
        const soil = await resp.json();
        // Validate: if ph and textures are all 0, SoilGrids had no data — fall through to fallbacks
        if (soil && soil.ph !== undefined && soil.ph > 0 && (soil.clay > 0 || soil.sand > 0)) {
          console.log('Edge function success, source:', soil.source);
          return { ...soil, isReal: true };
        } else {
          console.warn('Edge function returned empty soil data, using fallback...');
        }
      } else {
        console.warn('Edge function response not OK:', resp.status);
      }
    }
  } catch (err) {
    console.warn('Edge function call failed:', err);
  }

  // Strategy 2: Direct SoilGrids call (in case edge function is down)
  try {
    console.log('Trying direct SoilGrids call...');
    return await fetchSoilGridsDirect(lat, lon);
  } catch (err) {
    console.warn('Direct SoilGrids failed:', err);
  }

  // Strategy 3: Regional estimation (always works)
  console.log('Using regional soil estimation...');
  return getRegionalEstimate(lat, lon);
}

async function fetchSoilGridsDirect(lat: number, lon: number): Promise<SoilData> {
  const SOILGRIDS_BASE = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
  const properties = ['phh2o', 'clay', 'sand', 'silt', 'soc', 'nitrogen', 'cec', 'bdod', 'cfvo', 'ocd'];
  const depths = ['0-5cm', '5-15cm', '15-30cm', '30-60cm'];

  const params = new URLSearchParams();
  params.set('lat', lat.toString());
  params.set('lon', lon.toString());
  properties.forEach(p => params.append('property', p));
  depths.forEach(d => params.append('depth', d));
  params.append('value', 'mean');

  const resp = await fetch(`${SOILGRIDS_BASE}?${params.toString()}`);
  if (!resp.ok) throw new Error(`SoilGrids API error: ${resp.status}`);
  const data = await resp.json();

  const getWeightedAvg030 = (prop: string): number => {
    const layer = data.properties?.layers?.find((l: any) => l.name === prop);
    if (!layer) return 0;
    const depthMap: Record<string, number> = {};
    layer.depths?.forEach((d: any) => {
      if (d.values?.mean != null) depthMap[d.label] = d.values.mean;
    });
    const vals = [depthMap['0-5cm'] ?? null, depthMap['5-15cm'] ?? null, depthMap['15-30cm'] ?? null];
    const weights = [5 / 30, 10 / 30, 15 / 30];
    let sum = 0, wSum = 0;
    for (let i = 0; i < 3; i++) {
      if (vals[i] != null) { sum += vals[i]! * weights[i]; wSum += weights[i]; }
    }
    return wSum > 0 ? sum / wSum : 0;
  };

  const getDepthValue = (prop: string, depth: string): number => {
    const layer = data.properties?.layers?.find((l: any) => l.name === prop);
    if (!layer) return 0;
    const d = layer.depths?.find((d: any) => d.label === depth);
    return d?.values?.mean ?? 0;
  };

  const ph = getWeightedAvg030('phh2o') / 10;
  const clay = getWeightedAvg030('clay') / 10;
  const sand = getWeightedAvg030('sand') / 10;
  const silt = getWeightedAvg030('silt') / 10;
  const soc = getWeightedAvg030('soc') / 10;
  const nitrogenGkg = getWeightedAvg030('nitrogen') / 100;
  const cec = getWeightedAvg030('cec') / 10;
  const bdod = getWeightedAvg030('bdod') / 100;
  const bdodDeep = getDepthValue('bdod', '30-60cm') / 100;
  const cfvo = getWeightedAvg030('cfvo') / 10;
  const ocd = getWeightedAvg030('ocd') / 10;
  const nitrogenKgHa = Math.round(nitrogenGkg * bdod * 3 * 10 * 100) / 100;

  return {
    ph: Math.round(ph * 100) / 100,
    clay: Math.round(clay * 100) / 100,
    sand: Math.round(sand * 100) / 100,
    silt: Math.round(silt * 100) / 100,
    soc: Math.round(soc * 100) / 100,
    nitrogen: Math.round(nitrogenGkg * 1000) / 1000,
    nitrogenKgHa,
    cec: Math.round(cec * 100) / 100,
    bdod: Math.round(bdod * 100) / 100,
    bdodDeep: Math.round(bdodDeep * 100) / 100,
    cfvo: Math.round(cfvo * 100) / 100,
    ocd: Math.round(ocd * 100) / 100,
    isReal: true,
    source: 'SoilGrids ISRIC/NASA',
  };
}

// Regional soil estimates based on ISRIC Africa Soil Atlas 2014 + FAO HWSD
function getRegionalEstimate(lat: number, lon: number): SoilData {
  let ph = 6.5, clay = 22, sand = 48, silt = 30, soc = 8, nitrogen = 0.8;
  let cec = 12, bdod = 1.40, bdodDeep = 1.45, cfvo = 5, ocd = 10;
  let source = 'Estimation régionale ISRIC Africa Soil Atlas 2014';

  // Morocco
  if (lat > 27 && lon > -15 && lon < 0) {
    if (lat > 34) {
      // North - Mediterranean
      ph = 7.8; clay = 28; sand = 35; silt = 37; soc = 8.5; nitrogen = 0.85;
      cec = 18; bdod = 1.35; bdodDeep = 1.42; cfvo = 8; ocd = 11;
      source = 'ISRIC/HWSD — Maroc Nord méditerranéen';
    } else if (lon > -3) {
      // Oriental
      ph = 8.0; clay = 22; sand = 45; silt = 33; soc = 5.5; nitrogen = 0.55;
      cec = 14; bdod = 1.40; bdodDeep = 1.48; cfvo = 12; ocd = 7.5;
      source = 'ISRIC/HWSD — Maroc Oriental';
    } else if (lat > 31) {
      // Atlas mountains
      ph = 7.5; clay = 32; sand = 30; silt = 38; soc = 12; nitrogen = 1.1;
      cec = 22; bdod = 1.28; bdodDeep = 1.38; cfvo = 20; ocd = 15;
      source = 'ISRIC/HWSD — Haut Atlas';
    } else {
      // South
      ph = 8.1; clay = 18; sand = 52; silt = 30; soc = 4.2; nitrogen = 0.45;
      cec = 12; bdod = 1.45; bdodDeep = 1.50; cfvo = 15; ocd = 6;
      source = 'ISRIC/HWSD — Maroc Sud semi-aride';
    }
  }
  // Sahel (Senegal, Mali, Niger, Burkina)
  else if (lat > 13 && lat < 18) {
    ph = 6.2; clay = 12; sand = 65; silt = 23; soc = 3.5; nitrogen = 0.35;
    cec = 6; bdod = 1.55; bdodDeep = 1.62; cfvo = 5; ocd = 5;
    source = 'ISRIC Africa Soil Atlas — Zone sahélienne';
  }
  // Sudanian (Togo north, Benin north, Ghana north, southern Mali/Senegal)
  else if (lat > 9 && lat <= 13) {
    ph = 6.0; clay = 20; sand = 50; silt = 30; soc = 7.5; nitrogen = 0.75;
    cec = 10; bdod = 1.42; bdodDeep = 1.50; cfvo = 6; ocd = 10;
    source = 'ISRIC Africa Soil Atlas — Zone soudanienne';
  }
  // Guinean humid (Togo south, Benin south, Ghana south, Côte d'Ivoire)
  else if (lat > 4 && lat <= 9) {
    if (lon > -5 && lon < 5) {
      // Coastal Togo/Benin/Ghana
      ph = 5.8; clay = 25; sand = 45; silt = 30; soc = 12; nitrogen = 1.1;
      cec = 12; bdod = 1.35; bdodDeep = 1.42; cfvo = 3; ocd = 15;
      source = 'ISRIC Africa Soil Atlas — Zone côtière Golfe de Guinée';
    } else {
      ph = 5.5; clay = 30; sand = 40; silt = 30; soc = 15; nitrogen = 1.4;
      cec = 14; bdod = 1.30; bdodDeep = 1.38; cfvo = 4; ocd = 18;
      source = 'ISRIC Africa Soil Atlas — Zone guinéenne humide';
    }
  }

  const nitrogenKgHa = Math.round(nitrogen * bdod * 3 * 10 * 100) / 100;

  return {
    ph, clay, sand, silt, soc, nitrogen, nitrogenKgHa,
    cec, bdod, bdodDeep, cfvo, ocd,
    isReal: true,
    source,
  };
}
