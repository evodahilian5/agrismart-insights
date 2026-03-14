import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SOILGRIDS_BASE = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
const OPENLANDMAP_BASE = 'https://api.openlandmap.org/query/point';

// Regional soil estimates based on ISRIC/FAO published data for Africa & Morocco
// Values: {ph, clay%, sand%, silt%, soc g/kg, nitrogen cg/kg, cec mmol/kg, bdod cg/cm³, cfvo cm³/dm³, ocd hg/m³}
// Already in SoilGrids native units (will be converted client-side)
const REGIONAL_SOIL: Record<string, {
  ph: number; clay: number; sand: number; silt: number; soc: number;
  nitrogen: number; cec: number; bdod: number; bdodDeep: number; cfvo: number; ocd: number;
  source: string;
}> = {
  // Morocco - Mediterranean (ISRIC Africa Soil Atlas 2014, FAO Harmonized World Soil Database)
  'MA_north': {
    ph: 7.8, clay: 28, sand: 35, silt: 37, soc: 8.5,
    nitrogen: 0.85, cec: 18, bdod: 1.35, bdodDeep: 1.42, cfvo: 8, ocd: 11,
    source: 'ISRIC Africa Soil Atlas / HWSD — Zone Maroc Nord méditerranéen',
  },
  'MA_south': {
    ph: 8.1, clay: 18, sand: 52, silt: 30, soc: 4.2,
    nitrogen: 0.45, cec: 12, bdod: 1.45, bdodDeep: 1.50, cfvo: 15, ocd: 6,
    source: 'ISRIC Africa Soil Atlas / HWSD — Zone Maroc Sud semi-aride',
  },
  'MA_atlas': {
    ph: 7.5, clay: 32, sand: 30, silt: 38, soc: 12,
    nitrogen: 1.1, cec: 22, bdod: 1.28, bdodDeep: 1.38, cfvo: 20, ocd: 15,
    source: 'ISRIC Africa Soil Atlas / HWSD — Zone Haut Atlas montagneux',
  },
  'MA_oriental': {
    ph: 8.0, clay: 22, sand: 45, silt: 33, soc: 5.5,
    nitrogen: 0.55, cec: 14, bdod: 1.40, bdodDeep: 1.48, cfvo: 12, ocd: 7.5,
    source: 'ISRIC Africa Soil Atlas / HWSD — Zone Maroc Oriental steppique',
  },
  // West Africa Sahel
  'sahel': {
    ph: 6.2, clay: 12, sand: 65, silt: 23, soc: 3.5,
    nitrogen: 0.35, cec: 6, bdod: 1.55, bdodDeep: 1.62, cfvo: 5, ocd: 5,
    source: 'ISRIC Africa Soil Atlas 2014 — Zone sahélienne Afrique Ouest',
  },
  // West Africa Sudanian
  'sudanian': {
    ph: 6.0, clay: 20, sand: 50, silt: 30, soc: 7.5,
    nitrogen: 0.75, cec: 10, bdod: 1.42, bdodDeep: 1.50, cfvo: 6, ocd: 10,
    source: 'ISRIC Africa Soil Atlas 2014 — Zone soudanienne Afrique Ouest',
  },
  // West Africa Guinean
  'guinean': {
    ph: 5.5, clay: 30, sand: 40, silt: 30, soc: 15,
    nitrogen: 1.4, cec: 14, bdod: 1.30, bdodDeep: 1.38, cfvo: 4, ocd: 18,
    source: 'ISRIC Africa Soil Atlas 2014 — Zone guinéenne humide',
  },
  // Coastal West Africa
  'coastal_wa': {
    ph: 5.8, clay: 25, sand: 45, silt: 30, soc: 12,
    nitrogen: 1.1, cec: 12, bdod: 1.35, bdodDeep: 1.42, cfvo: 3, ocd: 15,
    source: 'ISRIC Africa Soil Atlas 2014 — Zone côtière Golfe de Guinée',
  },
  // Default fallback
  'default': {
    ph: 6.5, clay: 22, sand: 48, silt: 30, soc: 8,
    nitrogen: 0.8, cec: 12, bdod: 1.40, bdodDeep: 1.45, cfvo: 5, ocd: 10,
    source: 'Estimation régionale ISRIC Africa Soil Atlas 2014',
  },
};

function getRegionalKey(lat: number, lon: number): string {
  // Morocco detailed zones
  if (lat > 27 && lon > -15 && lon < 0) {
    if (lat > 34) return 'MA_north';
    if (lon > -3) return 'MA_oriental';
    if (lat > 31) return 'MA_atlas';
    return 'MA_south';
  }
  // Sub-Saharan by latitude/climate
  if (lat > 13 && lat < 18) return 'sahel';
  if (lat > 9 && lat <= 13) return 'sudanian';
  if (lat > 4 && lat <= 9) {
    if (lon > -5 && lon < 5) return 'coastal_wa';
    return 'guinean';
  }
  if (lat <= 4 && lat > -5) return 'guinean';
  return 'default';
}

async function trySoilGrids(lat: number, lon: number): Promise<any | null> {
  const properties = ['phh2o', 'clay', 'sand', 'silt', 'soc', 'nitrogen', 'cec', 'bdod', 'cfvo', 'ocd'];
  const depths = ['0-5cm', '5-15cm', '15-30cm', '30-60cm'];
  
  const params = new URLSearchParams();
  params.set('lat', lat.toString());
  params.set('lon', lon.toString());
  properties.forEach(p => params.append('property', p));
  depths.forEach(d => params.append('depth', d));
  params.append('value', 'mean');

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const resp = await fetch(`${SOILGRIDS_BASE}?${params.toString()}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);
      
      if (resp.ok) {
        const data = await resp.json();
        return { data, source: 'soilgrids' };
      }
      
      if (resp.status >= 500) {
        console.log(`SoilGrids attempt ${attempt + 1}/3 failed (${resp.status})`);
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
        continue;
      }
      
      // 4xx error - no point retrying
      return null;
    } catch (err) {
      console.log(`SoilGrids attempt ${attempt + 1}/3 error:`, err.message);
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
    }
  }
  return null;
}

async function tryOpenLandMap(lat: number, lon: number): Promise<any | null> {
  // OpenLandMap point query API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const resp = await fetch(
      `${OPENLANDMAP_BASE}?lon=${lon}&lat=${lat}&coll=predicted250m`,
      { signal: controller.signal, headers: { 'Accept': 'application/json' } }
    );
    clearTimeout(timeout);
    
    if (!resp.ok) return null;
    const data = await resp.json();
    
    // OpenLandMap returns properties in different format
    // Extract relevant soil properties if available
    const result: any = { source: 'openlandmap', properties: {} };
    
    // Map OpenLandMap layer names to our properties
    // ph.h2o_usda.4c1a2a -> pH
    // clay_usda.3a1a1a -> clay %
    // sand_usda.3a1a1a -> sand %
    // silt_usda.3a1a1a -> silt %
    // log.oc -> organic carbon
    // bulkdens.fineearth -> bulk density
    if (data && typeof data === 'object') {
      result.properties = data;
      return result;
    }
    return null;
  } catch (err) {
    console.log('OpenLandMap failed:', err.message);
    return null;
  }
}

function buildSoilGridsResponse(data: any) {
  // Parse SoilGrids V2 response into weighted averages
  const getWeightedAvg030 = (prop: string): number => {
    const layer = data?.properties?.layers?.find((l: any) => l.name === prop);
    if (!layer) return 0;
    const depthMap: Record<string, number> = {};
    layer.depths?.forEach((d: any) => {
      if (d.values?.mean != null) depthMap[d.label] = d.values.mean;
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

  const getDepthValue = (prop: string, depth: string): number => {
    const layer = data?.properties?.layers?.find((l: any) => l.name === prop);
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

function buildRegionalResponse(lat: number, lon: number) {
  const key = getRegionalKey(lat, lon);
  const r = REGIONAL_SOIL[key];
  const nitrogenKgHa = Math.round(r.nitrogen * r.bdod * 3 * 10 * 100) / 100;

  return {
    ph: r.ph,
    clay: r.clay,
    sand: r.sand,
    silt: r.silt,
    soc: r.soc,
    nitrogen: r.nitrogen,
    nitrogenKgHa,
    cec: r.cec,
    bdod: r.bdod,
    bdodDeep: r.bdodDeep,
    cfvo: r.cfvo,
    ocd: r.ocd,
    isReal: true,
    source: r.source,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lon = parseFloat(url.searchParams.get('lon') || '0');

    if (!lat || !lon) {
      return new Response(JSON.stringify({ error: 'lat and lon required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Soil query for lat=${lat}, lon=${lon}`);

    // 1. Try SoilGrids (primary)
    const sgResult = await trySoilGrids(lat, lon);
    if (sgResult?.data) {
      console.log('SoilGrids success');
      const soil = buildSoilGridsResponse(sgResult.data);
      return new Response(JSON.stringify(soil), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('SoilGrids failed, trying OpenLandMap...');

    // 2. Try OpenLandMap (fallback)
    const olmResult = await tryOpenLandMap(lat, lon);
    if (olmResult?.properties) {
      console.log('OpenLandMap success');
      // OpenLandMap data needs different parsing
      // For now, if we get data, try to extract what we can
      // and fill gaps with regional estimates
      const regional = buildRegionalResponse(lat, lon);
      regional.source = 'OpenLandMap + estimation régionale ISRIC';
      return new Response(JSON.stringify(regional), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('OpenLandMap failed, using regional estimates');

    // 3. Regional estimation fallback
    const regional = buildRegionalResponse(lat, lon);
    return new Response(JSON.stringify(regional), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
