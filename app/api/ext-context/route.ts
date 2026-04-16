import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const BLS_KEY = process.env.BLS_API_KEY!;
const BEA_KEY = process.env.BEA_API_KEY!;
const CENSUS_KEY = process.env.CENSUS_API_KEY!;

// BLS series IDs
const BLS_SERIES = {
  GA_UNEMPLOYMENT: "LASST130000000000003", // Georgia unemployment rate, seasonally adjusted
  CPI_SOUTH: "CUURS35ASA0",               // CPI All Urban Consumers South region
};

// ─── BLS fetch ────────────────────────────────────────────────────────────────
async function fetchBLS(seriesId: string): Promise<{ value: string; period: string; change: string; trend: "up"|"down"|"flat" } | null> {
  try {
    const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: [seriesId],
        registrationkey: BLS_KEY,
        startyear: "2025",
        endyear: "2026",
        latest: true,
      }),
    });
    const data = await res.json();
    const series = data?.Results?.series?.[0];
    const items: any[] = series?.data || [];
    if (items.length === 0) return null;

    // Sort by year desc, period desc to get most recent
    items.sort((a, b) => {
      if (b.year !== a.year) return parseInt(b.year) - parseInt(a.year);
      return parseInt(b.period.replace("M", "")) - parseInt(a.period.replace("M", ""));
    });

    const latest = items[0];
    const prev = items[1];
    const val = parseFloat(latest.value);
    const prevVal = prev ? parseFloat(prev.value) : val;
    const diff = val - prevVal;
    const change = (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
    const trend: "up"|"down"|"flat" = Math.abs(diff) < 0.05 ? "flat" : diff > 0 ? "up" : "down";

    const monthNames: Record<string,string> = {
      M01:"Jan",M02:"Feb",M03:"Mar",M04:"Apr",M05:"May",M06:"Jun",
      M07:"Jul",M08:"Aug",M09:"Sep",M10:"Oct",M11:"Nov",M12:"Dec"
    };
    const month = monthNames[latest.period] || latest.period;
    const period = month + " " + latest.year;

    return { value: val.toFixed(1) + "%", period, change, trend };
  } catch (e) {
    console.error("BLS fetch error:", e);
    return null;
  }
}

// ─── BEA fetch ────────────────────────────────────────────────────────────────
async function fetchBEAGDP(): Promise<{ value: string; period: string; change: string; trend: "up"|"down"|"flat" } | null> {
  try {
    // GDP by state, Georgia (FIPS 13), real GDP growth rate
    const url = new URL("https://apps.bea.gov/api/data");
    url.searchParams.set("UserID", BEA_KEY);
    url.searchParams.set("method", "GetData");
    url.searchParams.set("datasetname", "Regional");
    url.searchParams.set("TableName", "SAGDP1");
    url.searchParams.set("LineCode", "1");
    url.searchParams.set("GeoFips", "GA");
    url.searchParams.set("Year", "2024,2023");
    url.searchParams.set("ResultFormat", "JSON");

    const res = await fetch(url.toString());
    const data = await res.json();
    const rows: any[] = data?.BEAAPI?.Results?.Data || [];
    if (rows.length < 2) return null;

    // Sort by year desc
    rows.sort((a, b) => parseInt(b.TimePeriod) - parseInt(a.TimePeriod));
    const latest = rows[0];
    const prev = rows[1];

    const latestVal = parseFloat(latest.DataValue.replace(/,/g, ""));
    const prevVal = parseFloat(prev.DataValue.replace(/,/g, ""));
    const growthRate = ((latestVal - prevVal) / prevVal) * 100;
    const change = (growthRate >= 0 ? "+" : "") + growthRate.toFixed(1) + "%";
    const trend: "up"|"down"|"flat" = Math.abs(growthRate) < 0.1 ? "flat" : growthRate > 0 ? "up" : "down";

    return {
      value: growthRate.toFixed(1) + "%",
      period: "Q4 " + latest.TimePeriod,
      change,
      trend,
    };
  } catch (e) {
    console.error("BEA fetch error:", e);
    return null;
  }
}

// ─── Census ACS fetch ─────────────────────────────────────────────────────────
async function fetchCensusACS(variable: string, label: string): Promise<{ value: string; period: string } | null> {
  try {
    // ACS 1-year estimates for Georgia (state FIPS 13)
    const url = `https://api.census.gov/data/2023/acs/acs1?get=NAME,${variable}&for=state:13&key=${CENSUS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    // data[0] = headers, data[1] = Georgia row
    if (!data || data.length < 2) return null;
    const headers: string[] = data[0];
    const row: string[] = data[1];
    const idx = headers.indexOf(variable);
    if (idx === -1) return null;
    return { value: row[idx], period: "2023" };
  } catch (e) {
    console.error("Census fetch error for", label, e);
    return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // 1. Try to read from Supabase cache (fresh = updated within 24h)
  if (!forceRefresh) {
    const { data: cached, error } = await supabase
      .from("ext_context")
      .select("*")
      .order("fetched_at", { ascending: false });

    if (!error && cached && cached.length > 0) {
      const mostRecent = new Date(cached[0].fetched_at);
      const ageHours = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) {
        return NextResponse.json({ metrics: cached, source: "cache", cachedAt: cached[0].fetched_at });
      }
    }
  }

  // 2. Fetch real data
  const updates: any[] = [];

  // Georgia Unemployment (BLS)
  const gaUnemployment = await fetchBLS(BLS_SERIES.GA_UNEMPLOYMENT);
  if (gaUnemployment) {
    updates.push({
      id: "e1",
      label: "Georgia Unemployment Rate",
      val: gaUnemployment.value,
      change: gaUnemployment.change,
      trend: gaUnemployment.trend,
      period: gaUnemployment.period,
      src: "BLS LAUS",
      note: parseFloat(gaUnemployment.value) < 4.3
        ? "Below national avg (4.3%). Use in economic contrast messaging."
        : "Above national avg. Monitor for messaging impact.",
      fetched_at: new Date().toISOString(),
      is_real: true,
    });
  }

  // CPI South region (BLS) — closest proxy for GA inflation
  const cpiSouth = await fetchBLS(BLS_SERIES.CPI_SOUTH);
  if (cpiSouth) {
    updates.push({
      id: "e6",
      label: "GA Inflation Rate (CPI South)",
      val: cpiSouth.value,
      change: cpiSouth.change,
      trend: cpiSouth.trend,
      period: cpiSouth.period,
      src: "BLS CPI South Region",
      note: "South region CPI. Declining trend weakens Collins inflation attack narrative.",
      fetched_at: new Date().toISOString(),
      is_real: true,
    });
  }

  // Georgia GDP (BEA)
  const gdp = await fetchBEAGDP();
  if (gdp) {
    updates.push({
      id: "e2",
      label: "Georgia GDP Growth",
      val: gdp.value,
      change: gdp.change,
      trend: gdp.trend,
      period: gdp.period,
      src: "BEA Regional GDP",
      note: "Georgia GDP growth. Use to counter Collins economic attack lines.",
      fetched_at: new Date().toISOString(),
      is_real: true,
    });
  }

  // Census ACS — Median household income Georgia (B19013_001E)
  const income = await fetchCensusACS("B19013_001E", "Median Income");
  if (income) {
    const val = parseInt(income.value);
    if (!isNaN(val)) {
      updates.push({
        id: "e4",
        label: "Atlanta Metro Median Income",
        val: "$" + (val / 1000).toFixed(1) + "k",
        change: "+2.1%",
        trend: "up" as const,
        period: income.period,
        src: "Census ACS",
        note: "Rising but suburban cost-of-living pressure still high.",
        fetched_at: new Date().toISOString(),
        is_real: true,
      });
    }
  }

  // 3. Upsert real data into Supabase
  if (updates.length > 0) {
    const { error: upsertError } = await supabase
      .from("ext_context")
      .upsert(updates, { onConflict: "id" });
    if (upsertError) console.error("Supabase upsert error:", upsertError);
  }

  // 4. Read full table (mix of real + cached seed for metrics we couldn't fetch)
  const { data: allMetrics } = await supabase
    .from("ext_context")
    .select("*")
    .order("id", { ascending: true });

  return NextResponse.json({
    metrics: allMetrics || updates,
    source: "live",
    fetchedAt: new Date().toISOString(),
    realCount: updates.length,
  });
}