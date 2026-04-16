import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const results: any = {
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? "SET (" + process.env.SUPABASE_URL.slice(0, 30) + "...)" : "MISSING",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "SET (length " + process.env.SUPABASE_ANON_KEY.length + ")" : "MISSING",
      BLS_API_KEY: process.env.BLS_API_KEY ? "SET (length " + process.env.BLS_API_KEY.length + ")" : "MISSING",
      BEA_API_KEY: process.env.BEA_API_KEY ? "SET (length " + process.env.BEA_API_KEY.length + ")" : "MISSING",
      CENSUS_API_KEY: process.env.CENSUS_API_KEY ? "SET (length " + process.env.CENSUS_API_KEY.length + ")" : "MISSING",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "SET" : "MISSING",
    },
    supabase: null as any,
    bls: null as any,
  };

  // Test Supabase
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    const { data, error, count } = await supabase
      .from("ext_context")
      .select("id", { count: "exact" });
    results.supabase = error
      ? { error: error.message, code: error.code }
      : { ok: true, rowCount: count, ids: data?.map((r: any) => r.id) };
  } catch (e: any) {
    results.supabase = { error: e.message };
  }

  // Test BLS
  try {
    const res = await fetch(
      "https://api.bls.gov/publicAPI/v2/timeseries/data/LASST130000000000003?registrationkey=" +
        process.env.BLS_API_KEY +
        "&startyear=2026&endyear=2026"
    );
    const data = await res.json();
    results.bls = {
      status: res.status,
      responseStatus: data?.status,
      message: data?.message,
      hasData: !!(data?.Results?.series?.[0]?.data?.length),
    };
  } catch (e: any) {
    results.bls = { error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}