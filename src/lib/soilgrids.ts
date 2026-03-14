// SoilGrids V2 ISRIC/NASA — Soil property data
// Source: https://rest.isric.org/soilgrids/v2.0
// Unit conversions per ISRIC documentation

const SOILGRIDS_BASE = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

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
  isReal: boolean;      // true if from API, false if fallback
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return resp;
      if (resp.status === 503 || resp.status === 429 || resp.status >= 500) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
        console.warn(`SoilGrids attempt ${attempt + 1}/${maxRetries} failed (${resp.status}), retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw new Error(`SoilGrids API error: ${resp.status}`);
    } catch (err: any) {
      if (attempt === maxRetries - 1) throw err;
      const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
      console.warn(`SoilGrids attempt ${attempt + 1}/${maxRetries} network error, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('SoilGrids: max retries exceeded');
}

export async function fetchSoilData(lat: number, lon: number): Promise<SoilData> {
  const properties = ['phh2o', 'clay', 'sand', 'silt', 'soc', 'nitrogen', 'cec', 'bdod', 'cfvo', 'ocd'];
  const depths = ['0-5cm', '5-15cm', '15-30cm', '30-60cm'];

  const params = new URLSearchParams();
  params.set('lat', lat.toString());
  params.set('lon', lon.toString());
  properties.forEach(p => params.append('property', p));
  depths.forEach(d => params.append('depth', d));
  params.append('value', 'mean');

  try {
    const resp = await fetchWithRetry(`${SOILGRIDS_BASE}?${params.toString()}`);
    const data = await resp.json();

    // Get weighted average for 0-30cm (weights: 5/30, 10/30, 15/30)
    const getWeightedAvg030 = (prop: string): number => {
      const layer = data.properties?.layers?.find((l: any) => l.name === prop);
      if (!layer) return 0;
      const depthMap: Record<string, number> = {};
      layer.depths?.forEach((d: any) => {
        const label = d.label;
        const val = d.values?.mean;
        if (val != null) depthMap[label] = val;
      });
      const v05 = depthMap['0-5cm'] ?? null;
      const v515 = depthMap['5-15cm'] ?? null;
      const v1530 = depthMap['15-30cm'] ?? null;
      const vals = [v05, v515, v1530];
      const weights = [5 / 30, 10 / 30, 15 / 30];
      let sum = 0, wSum = 0;
      for (let i = 0; i < 3; i++) {
        if (vals[i] != null) { sum += vals[i]! * weights[i]; wSum += weights[i]; }
      }
      return wSum > 0 ? sum / wSum : 0;
    };

    // Get value for specific depth
    const getDepthValue = (prop: string, depth: string): number => {
      const layer = data.properties?.layers?.find((l: any) => l.name === prop);
      if (!layer) return 0;
      const d = layer.depths?.find((d: any) => d.label === depth);
      return d?.values?.mean ?? 0;
    };

    // Conversions per ISRIC documentation:
    // phh2o: pH × 10 → divide by 10
    // clay/sand/silt: g/kg → divide by 10 for %
    // soc: dg/kg → divide by 10 for g/kg
    // nitrogen: cg/kg → divide by 100 for g/kg
    // cec: mmol(c)/kg → divide by 10 for cmol(c)/kg
    // bdod: cg/cm³ → divide by 100 for g/cm³
    // cfvo: cm³/dm³ → divide by 10 for %
    // ocd: hg/m³ → divide by 10 for kg/m³

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

    // FAO-ISRIC formula: N(kg/ha) = N(g/kg) × bdod(g/cm³) × depth(dm) × 10
    // For 0-30cm: depth = 3 dm
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
    };
  } catch (err) {
    console.error('SoilGrids fetch failed:', err);
    return {
      ph: 0, clay: 0, sand: 0, silt: 0, soc: 0, nitrogen: 0, nitrogenKgHa: 0,
      cec: 0, bdod: 0, bdodDeep: 0, cfvo: 0, ocd: 0, isReal: false,
    };
  }
}
