import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

async function supabaseSelect(table: string, query = "*") {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=" + query + "&order=poll_date.desc", {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
  });
  if (!res.ok) throw new Error("Supabase select failed: " + res.status);
  return res.json();
}

async function supabaseUpsert(table: string, rows: any[]) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error("Supabase upsert failed: " + res.status + " " + await res.text());
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; }
      else if (line[i] === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += line[i]; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || "").replace(/"/g, ""); });
    return row;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // Try cache first (1 hour)
  if (!forceRefresh) {
    try {
      const cached = await supabaseSelect("polls_538");
      if (cached && cached.length > 0) {
        const ageHours = (Date.now() - new Date(cached[0].fetched_at).getTime()) / 3600000;
        if (ageHours < 1) {
          return NextResponse.json({ polls: cached, source: "cache", count: cached.length });
        }
      }
    } catch (e) { console.error("Cache read failed:", e); }
  }

  // Fetch from 538
  try {
    const res = await fetch("https://projects.fivethirtyeight.com/polls-page/data/senate_polls.csv", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Polis/1.0)" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("538 fetch failed: " + res.status);

    const csv = await res.text();
    const rows = parseCSV(csv);

    // Filter Georgia 2026 Senate
    const gaPolls = rows.filter(r =>
      r.state === "Georgia" &&
      r.cycle === "2026" &&
      r.office_type === "U.S. Senate" &&
      r.stage === "general"
    );

    if (gaPolls.length === 0) {
      // Try broader filter if strict one returns nothing
      const broadPolls = rows.filter(r =>
        (r.state === "Georgia" || r.state === "GA") &&
        r.cycle === "2026"
      );
      console.log("Broad filter found:", broadPolls.length, "polls");
    }

    // Group by poll_id to get candidate percentages per poll
    const pollMap: Record<string, any> = {};
    const now = new Date().toISOString();

    for (const row of gaPolls) {
      const pollId = row.poll_id || row.id || "";
      if (!pollId) continue;

      if (!pollMap[pollId]) {
        pollMap[pollId] = {
          id: pollId,
          pollster: row.pollster || row.display_name || "Unknown",
          display_name: row.display_name || row.pollster || "Unknown",
          poll_date: row.end_date || row.created_at?.split("T")[0] || "",
          end_date: row.end_date || "",
          sample_size: parseInt(row.sample_size) || null,
          population: row.population || row.population_full || "",
          method: row.methodology || row.mode || "",
          url: row.url || "",
          fetched_at: now,
          ossoff_pct: null,
          collins_pct: null,
          dooley_pct: null,
          other_pct: null,
        };
      }

      const candidate = (row.candidate_name || row.answer || "").toLowerCase();
      const pct = parseFloat(row.pct) || null;

      if (candidate.includes("ossoff")) pollMap[pollId].ossoff_pct = pct;
      else if (candidate.includes("collins")) pollMap[pollId].collins_pct = pct;
      else if (candidate.includes("dooley")) pollMap[pollId].dooley_pct = pct;
    }

    const polls = Object.values(pollMap)
      .filter(p => p.poll_date && p.ossoff_pct)
      .sort((a, b) => new Date(b.poll_date).getTime() - new Date(a.poll_date).getTime())
      .slice(0, 20); // Keep last 20 polls

    if (polls.length > 0) {
      // Delete old rows and insert fresh
      await fetch(SUPABASE_URL + "/rest/v1/polls_538?id=neq.NONE", {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
      });
      await supabaseUpsert("polls_538", polls);
    }

    // Read back
    let allPolls = polls;
    try { allPolls = await supabaseSelect("polls_538"); } catch (e) {}

    return NextResponse.json({
      polls: allPolls,
      source: "live",
      fetchedAt: now,
      count: allPolls.length,
      rawRows: gaPolls.length,
    });

  } catch (e: any) {
    console.error("Polls fetch error:", e);
    // Return cached data on error
    try {
      const cached = await supabaseSelect("polls_538");
      return NextResponse.json({ polls: cached, source: "cache_fallback", error: e.message });
    } catch {
      return NextResponse.json({ polls: [], source: "error", error: e.message }, { status: 500 });
    }
  }
}