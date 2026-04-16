import { NextResponse } from "next/server";

const BLS_KEY = process.env.BLS_API_KEY!;
const FRED_KEY = process.env.FRED_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

// ─── Supabase REST ────────────────────────────────────────────────────────────
async function supabaseSelect(table: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase select failed: ${res.status}`);
  return res.json();
}

async function supabaseUpsert(table: string, rows: any[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status} ${await res.text()}`);
}

// ─── FRED fetch ───────────────────────────────────────────────────────────────
async function fetchFRED(seriesId: string) {
  try {
    const url = "https://api.stlouisfed.org/fred/series/observations?series_id=" + seriesId + "&api_key=" + FRED_KEY + "&file_type=json&sort_order=desc&limit=13";
    const res = await fetch(url);
    const data = await res.json();
    const obs: any[] = (data.observations || []).filter((o: any) => o.value !== ".");
    if (obs.length === 0) return null;

    const latest = obs[0];
    const prev = obs[1];
    const val = parseFloat(latest.value);
    const prevVal = prev ? parseFloat(prev.value) : val;
    const pctChange = prevVal !== 0 ? ((val - prevVal) / Math.abs(prevVal)) * 100 : 0;
    const trend: "up"|"down"|"flat" = Math.abs(pctChange) < 0.5 ? "flat" : pctChange > 0 ? "up" : "down";
    const d = new Date(latest.date);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const period = months[d.getMonth()] + " " + d.getFullYear();
    const change = (pctChange >= 0 ? "+" : "") + pctChange.toFixed(1) + "%";

    return { rawValue: val, period, change, trend };
  } catch (e) {
    console.error("FRED error " + seriesId + ":", e);
    return null;
  }
}

// ─── BLS fetch ────────────────────────────────────────────────────────────────
async function fetchBLS(seriesId: string) {
  try {
    // Fetch 2 years to get year-over-year comparison for CPI index series
    const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesid: [seriesId], registrationkey: BLS_KEY, startyear: "2024", endyear: "2026" }),
    });
    const data = await res.json();
    const items: any[] = data?.Results?.series?.[0]?.data || [];
    if (items.length === 0) return null;

    items.sort((a: any, b: any) => {
      if (b.year !== a.year) return parseInt(b.year) - parseInt(a.year);
      return parseInt(b.period.replace("M","")) - parseInt(a.period.replace("M",""));
    });

    const latest = items[0];
    const latestVal = parseFloat(latest.value);
    const mo: Record<string,string> = {M01:"Jan",M02:"Feb",M03:"Mar",M04:"Apr",M05:"May",M06:"Jun",M07:"Jul",M08:"Aug",M09:"Sep",M10:"Oct",M11:"Nov",M12:"Dec"};
    const period = (mo[latest.period] || latest.period) + " " + latest.year;

    // Find same month one year ago for YoY calculation
    const prevYear = String(parseInt(latest.year) - 1);
    const yearAgoItem = items.find((i: any) => i.year === prevYear && i.period === latest.period);
    const yearAgoVal = yearAgoItem ? parseFloat(yearAgoItem.value) : null;

    let displayVal: string;
    let change: string;
    let trend: "up"|"down"|"flat";

    if (yearAgoVal) {
      // Year-over-year percentage change (this is the actual inflation rate)
      const yoyChange = ((latestVal - yearAgoVal) / yearAgoVal) * 100;
      displayVal = yoyChange.toFixed(1) + "%";
      // Month-over-month change for the delta
      const prev = items[1];
      const prevVal = prev ? parseFloat(prev.value) : latestVal;
      const momChange = ((latestVal - prevVal) / prevVal) * 100;
      change = (momChange >= 0 ? "+" : "") + momChange.toFixed(1) + "%";
      trend = Math.abs(yoyChange) < 0.1 ? "flat" : yoyChange > 0 ? "up" : "down";
      return { rawValue: yoyChange, period, change, trend, displayVal };
    } else {
      // Fallback: just show MoM change
      const prev = items[1];
      const prevVal = prev ? parseFloat(prev.value) : latestVal;
      const diff = latestVal - prevVal;
      change = (diff >= 0 ? "+" : "") + diff.toFixed(1);
      trend = Math.abs(diff) < 0.05 ? "flat" : diff > 0 ? "up" : "down";
      return { rawValue: latestVal, period, change, trend, displayVal: latestVal.toFixed(1) };
    }
  } catch (e) {
    console.error("BLS error " + seriesId + ":", e);
    return null;
  }
}

const SOURCE_URLS: Record<string,string> = {
  e1: "https://fred.stlouisfed.org/series/GAUR",
  e2: "https://fred.stlouisfed.org/series/GANAG",
  e3: "https://fred.stlouisfed.org/series/GABPPRIV",
  e4: "https://fred.stlouisfed.org/series/GAICLAIMS",
  e5: "https://fred.stlouisfed.org/series/GAAVGWK",
  e6: "https://www.bls.gov/regions/southeast/news-release/consumerpriceindex_south.htm",
  e7: "https://fred.stlouisfed.org/series/MORTGAGE30US",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // Try cache first
  if (!forceRefresh) {
    try {
      const cached = await supabaseSelect("ext_context");
      if (cached && cached.length > 0) {
        const ageHours = (Date.now() - new Date(cached[0].fetched_at).getTime()) / 3600000;
        if (ageHours < 24) {
          return NextResponse.json({
            metrics: cached.map((m: any) => ({ ...m, sourceUrl: SOURCE_URLS[m.id] || null })),
            source: "cache",
            cachedAt: cached[0].fetched_at,
          });
        }
      }
    } catch (e) { console.error("Cache read failed:", e); }
  }

  // Fetch all in parallel
  const now = new Date().toISOString();
  const [unemployment, nonfarm, permits, claims, wages, cpi, mortgage] = await Promise.all([
    fetchFRED("GAUR"),
    fetchFRED("GANAG"),
    fetchFRED("GABPPRIV"),
    fetchFRED("GAICLAIMS"),
    fetchFRED("GAAVGWK"),
    fetchBLS("CUURS35ASA0"),
    fetchFRED("MORTGAGE30US"),
  ]);

  const updates: any[] = [];

  if (unemployment) updates.push({
    id: "e1", label: "Georgia Unemployment Rate",
    val: unemployment.rawValue.toFixed(1) + "%",
    change: unemployment.change, trend: unemployment.trend, period: unemployment.period,
    src: "FRED / BLS LAUS", is_real: true, fetched_at: now,
    note: unemployment.rawValue < 4.3 ? "Below national avg (4.3%). Strong economic contrast vs Collins." : "Above national avg. Monitor for messaging impact.",
  });

  if (nonfarm) updates.push({
    id: "e2", label: "Georgia Nonfarm Jobs",
    val: (nonfarm.rawValue / 1000).toFixed(2) + "M",
    change: nonfarm.change, trend: nonfarm.trend, period: nonfarm.period,
    src: "FRED / BLS CES", is_real: true, fetched_at: now,
    note: "Total nonfarm payroll employment. Job growth underpins infrastructure investment messaging.",
  });

  if (permits) updates.push({
    id: "e3", label: "GA Housing Permits",
    val: Math.round(permits.rawValue).toLocaleString(),
    change: permits.change, trend: permits.trend, period: permits.period,
    src: "FRED / Census", is_real: true, fetched_at: now,
    note: "New privately owned housing units authorized. Ties to housing affordability messaging.",
  });

  if (claims) updates.push({
    id: "e4", label: "GA Initial Jobless Claims",
    val: Math.round(claims.rawValue).toLocaleString(),
    change: claims.change, trend: claims.trend, period: claims.period,
    src: "FRED / DOL", is_real: true, fetched_at: now,
    note: "Weekly initial unemployment claims. Rising trend signals economic stress.",
  });

  if (wages) updates.push({
    id: "e5", label: "GA Avg Weekly Wage",
    val: "$" + Math.round(wages.rawValue).toLocaleString(),
    change: wages.change, trend: wages.trend, period: wages.period,
    src: "FRED / BLS QCEW", is_real: true, fetched_at: now,
    note: "Average weekly wages all industries. Use in cost-of-living contrast messaging.",
  });

  if (cpi) updates.push({
    id: "e6", label: "Inflation Rate (CPI South)",
    val: (cpi as any).displayVal || cpi.rawValue.toFixed(1) + "%",
    change: cpi.change, trend: cpi.trend, period: cpi.period,
    src: "BLS CPI South", is_real: true, fetched_at: now,
    note: "South region CPI. Declining trend weakens Collins inflation attack narrative.",
  });

  if (mortgage) updates.push({
    id: "e7", label: "30-Year Mortgage Rate",
    val: mortgage.rawValue.toFixed(2) + "%",
    change: mortgage.change, trend: mortgage.trend, period: mortgage.period,
    src: "FRED / Freddie Mac", is_real: true, fetched_at: now,
    note: "Elevated rates drive housing affordability concerns in Atlanta suburbs.",
  });

  // Upsert to Supabase
  if (updates.length > 0) {
    try {
      // Clear ALL old rows using neq filter (Supabase requires a filter for DELETE)
      await fetch(SUPABASE_URL + "/rest/v1/ext_context?id=neq.NONE", {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          Prefer: "return=minimal",
        },
      });
      await supabaseUpsert("ext_context", updates);
    } catch (e) { console.error("Supabase write error:", e); }
  }

  // Read back
  let allMetrics = updates;
  try { allMetrics = await supabaseSelect("ext_context"); } catch (e) {}

  return NextResponse.json({
    metrics: allMetrics.map((m: any) => ({ ...m, sourceUrl: SOURCE_URLS[m.id] || null })),
    source: "live",
    fetchedAt: now,
    realCount: updates.length,
  });
}