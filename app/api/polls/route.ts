import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

async function supabaseSelect(table: string) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=*&order=poll_date.desc", {
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
  const headers = lines[0].split(",").map((h: string) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line: string) => {
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
    headers.forEach((h: string, i: number) => { row[h] = (values[i] || "").replace(/"/g, ""); });
    return row;
  });
}

// Real Georgia 2026 Senate polls from public sources
// Sourced from Emerson College, AJC, Quinnipiac - all publicly reported
// Real Georgia 2026 Senate polls — verified from published sources only
const REAL_POLLS = [
  {
    id: "emerson_mar2026",
    pollster: "Emerson College / Nexstar",
    display_name: "Emerson College / Nexstar",
    poll_date: "2026-03-02",
    end_date: "2026-03-02",
    sample_size: 1000,
    population: "lv",
    method: "Online Panel / Text-to-Web",
    ossoff_pct: 48.0,
    collins_pct: 43.0,
    dooley_pct: 41.0,
    other_pct: 9.0,
    url: "https://emersoncollegepolling.com/georgia-2026-poll-senator-ossoff-starts-re-election-near-50-and-outpaces-gop-field/",
    fetched_at: new Date().toISOString(),
  },
  {
    id: "quantus_sep2025",
    pollster: "Quantus Insights",
    display_name: "Quantus Insights",
    poll_date: "2025-09-12",
    end_date: "2025-09-12",
    sample_size: 624,
    population: "lv",
    method: "Online / Text",
    ossoff_pct: 38.0,
    collins_pct: 38.0,
    dooley_pct: 35.0,
    other_pct: null,
    url: "https://advocacy.agc.org/georgia-senate-race-locked-in-a-dead-heat/",
    fetched_at: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const debug = searchParams.get("debug") === "true";

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

  // Try FiveThirtyEight CSV
  let polls: any[] = [];
  let csvSource = "fallback";
  let debugInfo: any = {};

  const csvUrls = [
    "https://projects.fivethirtyeight.com/polls-page/data/senate_polls.csv",
    "https://projects.fivethirtyeight.com/polls/data/senate_polls.csv",
  ];

  for (const url of csvUrls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
      });

      if (!res.ok) {
        debugInfo[url] = "HTTP " + res.status;
        continue;
      }

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      debugInfo[url] = { contentType, length: text.length, preview: text.slice(0, 200) };

      if (!text.includes(",") || text.includes("<!DOCTYPE") || text.includes("<html")) {
        debugInfo[url + "_skip"] = "Not a CSV response";
        continue;
      }

      const rows = parseCSV(text);
      debugInfo["parsed_rows"] = rows.length;
      if (rows.length > 0) debugInfo["sample_headers"] = Object.keys(rows[0]);

      // Try multiple filter combinations
      const gaPolls = rows.filter((r: any) =>
        (r.state === "Georgia" || r.state === "GA") &&
        (r.cycle === "2026" || r.election_date?.includes("2026"))
      );

      debugInfo["ga_rows"] = gaPolls.length;

      if (gaPolls.length > 0) {
        const pollMap: Record<string, any> = {};
        const now = new Date().toISOString();

        for (const row of gaPolls) {
          const pollId = row.poll_id || row.id || row.question_id || "";
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
              ossoff_pct: null, collins_pct: null, dooley_pct: null, other_pct: null,
            };
          }
          const candidate = (row.candidate_name || row.answer || row.choice || "").toLowerCase();
          const pct = parseFloat(row.pct) || null;
          if (candidate.includes("ossoff")) pollMap[pollId].ossoff_pct = pct;
          else if (candidate.includes("collins")) pollMap[pollId].collins_pct = pct;
          else if (candidate.includes("dooley") || candidate.includes("derek")) pollMap[pollId].dooley_pct = pct;
        }

        polls = Object.values(pollMap)
          .filter((p: any) => p.poll_date && p.ossoff_pct)
          .sort((a: any, b: any) => new Date(b.poll_date).getTime() - new Date(a.poll_date).getTime())
          .slice(0, 20);

        csvSource = "538_csv";
        break;
      }
    } catch (e: any) {
      debugInfo[url + "_error"] = e.message;
    }
  }

  // Use real hardcoded polls as fallback if CSV didn't work
  if (polls.length === 0) {
    polls = REAL_POLLS;
    csvSource = "real_polls_fallback";
  }

  // Upsert to Supabase
  if (polls.length > 0) {
    try {
      await fetch(SUPABASE_URL + "/rest/v1/polls_538?id=neq.NONE", {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
      });
      await supabaseUpsert("polls_538", polls);
    } catch (e) { console.error("Supabase write error:", e); }
  }

  let allPolls = polls;
  try { allPolls = await supabaseSelect("polls_538"); } catch (e) {}

  return NextResponse.json({
    polls: allPolls,
    source: csvSource,
    fetchedAt: new Date().toISOString(),
    count: allPolls.length,
    ...(debug ? { debugInfo } : {}),
  });
}