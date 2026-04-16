import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

async function supabaseSelect(table: string, filter = "") {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=*" + (filter ? "&" + filter : "") + "&order=poll_date.desc", {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
  });
  if (!res.ok) throw new Error("Supabase select failed: " + res.status);
  return res.json();
}

export async function GET() {
  try {
    const polls = await supabaseSelect("polls_538");

    if (!polls || polls.length === 0) {
      return NextResponse.json({ error: "No polls available", approval: null });
    }

    // Use last 90 days of polls
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const recent = polls.filter((p: any) =>
      p.ossoff_pct && new Date(p.poll_date) >= cutoff
    );

    const pool = recent.length > 0 ? recent : polls.slice(0, 5);

    // Weight by recency and sample size
    let totalWeight = 0;
    let ossoffWeighted = 0;
    let collinsWeighted = 0;
    let dooleyWeighted = 0;

    const now = Date.now();

    pool.forEach((p: any) => {
      const agedays = (now - new Date(p.poll_date).getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.exp(-agedays / 21); // half-life ~21 days
      const sampleWeight = p.sample_size ? Math.min(Math.sqrt(p.sample_size / 800), 1.5) : 1.0;
      const weight = recencyWeight * sampleWeight;

      totalWeight += weight;
      if (p.ossoff_pct) ossoffWeighted += p.ossoff_pct * weight;
      if (p.collins_pct) collinsWeighted += p.collins_pct * weight;
      if (p.dooley_pct) dooleyWeighted += p.dooley_pct * weight;
    });

    const ossoffAvg = totalWeight > 0 ? ossoffWeighted / totalWeight : null;
    const collinsAvg = totalWeight > 0 ? collinsWeighted / totalWeight : null;
    const dooleyAvg = totalWeight > 0 ? dooleyWeighted / totalWeight : null;

    // Build trend — one point per poll, sorted ascending
    const trend = [...pool]
      .sort((a: any, b: any) => new Date(a.poll_date).getTime() - new Date(b.poll_date).getTime())
      .map((p: any) => ({
        date: p.poll_date,
        pollster: p.display_name,
        ossoff: p.ossoff_pct,
        collins: p.collins_pct,
        dooley: p.dooley_pct,
        lead: p.ossoff_pct && p.collins_pct ? parseFloat((p.ossoff_pct - p.collins_pct).toFixed(1)) : null,
      }));

    // Compute rolling 7-day average for smooth trend line
    const smoothed = trend.map((point: any, i: number) => {
      const window = trend.slice(Math.max(0, i - 2), i + 1);
      const avg = (arr: any[], key: string) => {
        const vals = arr.filter(p => p[key] != null).map(p => p[key]);
        return vals.length > 0 ? parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)) : null;
      };
      return {
        ...point,
        ossoff_smooth: avg(window, "ossoff"),
        collins_smooth: avg(window, "collins"),
      };
    });

    // Net approval (ossoff - collins)
    const lead = ossoffAvg && collinsAvg ? parseFloat((ossoffAvg - collinsAvg).toFixed(1)) : null;

    // Delta vs previous blended signal
    const prevPool = pool.slice(1);
    let prevOssoff = null;
    let prevCollins = null;
    if (prevPool.length > 0) {
      const prevTotal = prevPool.reduce((s: number, p: any) => s + (p.ossoff_pct ? 1 : 0), 0);
      prevOssoff = prevTotal > 0 ? prevPool.filter((p: any) => p.ossoff_pct).reduce((s: number, p: any) => s + p.ossoff_pct, 0) / prevTotal : null;
      prevCollins = prevTotal > 0 ? prevPool.filter((p: any) => p.collins_pct).reduce((s: number, p: any) => s + p.collins_pct, 0) / prevTotal : null;
    }

    return NextResponse.json({
      ossoff: ossoffAvg ? parseFloat(ossoffAvg.toFixed(1)) : null,
      collins: collinsAvg ? parseFloat(collinsAvg.toFixed(1)) : null,
      dooley: dooleyAvg ? parseFloat(dooleyAvg.toFixed(1)) : null,
      lead,
      dOssoff: ossoffAvg && prevOssoff ? parseFloat((ossoffAvg - prevOssoff).toFixed(1)) : null,
      dLead: lead && prevOssoff && prevCollins ? parseFloat((lead - (prevOssoff - prevCollins)).toFixed(1)) : null,
      pollCount: pool.length,
      trend: smoothed,
      latestPoll: pool[0],
      computedAt: new Date().toISOString(),
    });

  } catch (e: any) {
    console.error("Approval computation error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}