import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

async function supabaseSelect(table: string) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=*&order=candidate.asc", {
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
  if (!res.ok) throw new Error("Supabase upsert failed: " + res.status);
}

// Parse follower count from Twitter/X public page HTML
// Twitter embeds follower count in meta tags and JSON-LD
function parseTwitterFollowers(html: string): number | null {
  // Try og:description which often contains follower count
  const descMatch = html.match(/property="og:description"[^>]*content="([^"]+)"/i);
  if (descMatch) {
    const desc = descMatch[1];
    const followerMatch = desc.match(/([\d,]+)\s*Followers/i);
    if (followerMatch) {
      return parseInt(followerMatch[1].replace(/,/g, ""));
    }
  }

  // Try Twitter's data-testid or JSON embedded data
  const jsonMatch = html.match(/"followers_count":(\d+)/);
  if (jsonMatch) return parseInt(jsonMatch[1]);

  // Try meta name="twitter:app:url"
  const countMatch = html.match(/([\d,.]+[KkMm]?)\s*[Ff]ollower/);
  if (countMatch) {
    const raw = countMatch[1];
    if (raw.toLowerCase().includes("k")) return Math.round(parseFloat(raw) * 1000);
    if (raw.toLowerCase().includes("m")) return Math.round(parseFloat(raw) * 1000000);
    return parseInt(raw.replace(/,/g, ""));
  }

  return null;
}

// Scrape a Twitter/X profile page
async function scrapeTwitter(handle: string, id: string, candidate: string): Promise<any | null> {
  const username = handle.replace("@", "");
  const url = "https://twitter.com/" + username;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) throw new Error("Twitter fetch failed: " + res.status);
    const html = await res.text();
    const followers = parseTwitterFollowers(html);

    return {
      id,
      candidate,
      platform: "twitter",
      handle,
      followers,
      fetched_at: new Date().toISOString(),
      source_url: url,
    };
  } catch (e) {
    console.error("Twitter scrape error for " + handle + ":", e);
    return null;
  }
}

// Scrape Instagram public page
async function scrapeInstagram(handle: string, id: string, candidate: string): Promise<any | null> {
  const username = handle.replace("@", "");
  const url = "https://www.instagram.com/" + username + "/";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
    });

    if (!res.ok) throw new Error("Instagram fetch failed: " + res.status);
    const html = await res.text();

    // Instagram embeds follower count in meta description and JSON
    let followers: number | null = null;

    const metaDesc = html.match(/property="og:description"[^>]*content="([^"]+)"/i);
    if (metaDesc) {
      const desc = metaDesc[1];
      const match = desc.match(/([\d,.]+[KkMm]?)\s*[Ff]ollower/);
      if (match) {
        const raw = match[1].replace(/,/g, "");
        if (raw.toLowerCase().includes("k")) followers = Math.round(parseFloat(raw) * 1000);
        else if (raw.toLowerCase().includes("m")) followers = Math.round(parseFloat(raw) * 1000000);
        else followers = parseInt(raw);
      }
    }

    // Try JSON embedded
    if (!followers) {
      const jsonMatch = html.match(/"edge_followed_by":\{"count":(\d+)\}/);
      if (jsonMatch) followers = parseInt(jsonMatch[1]);
    }

    return {
      id,
      candidate,
      platform: "instagram",
      handle,
      followers,
      fetched_at: new Date().toISOString(),
      source_url: url,
    };
  } catch (e) {
    console.error("Instagram scrape error for " + handle + ":", e);
    return null;
  }
}

const ACCOUNTS = [
  { id: "ossoff_twitter",    candidate: "ossoff",  platform: "twitter",   handle: "@ossoff" },
  { id: "ossoff_instagram",  candidate: "ossoff",  platform: "instagram", handle: "@jonossoff" },
  { id: "collins_twitter",   candidate: "collins", platform: "twitter",   handle: "@mikecollinsga" },
  { id: "collins_instagram", candidate: "collins", platform: "instagram", handle: "@mikecollinsga" },
  { id: "dooley_twitter",    candidate: "dooley",  platform: "twitter",   handle: "@dooleyga" },
  { id: "dooley_instagram",  candidate: "dooley",  platform: "instagram", handle: "@dooleyga" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  // Try cache (6 hours)
  if (!forceRefresh) {
    try {
      const cached = await supabaseSelect("social_stats");
      if (cached && cached.length > 0) {
        const ageHours = (Date.now() - new Date(cached[0].fetched_at).getTime()) / 3600000;
        if (ageHours < 6) {
          return NextResponse.json({ stats: cached, source: "cache", count: cached.length });
        }
      }
    } catch (e) { console.error("Cache read failed:", e); }
  }

  // Scrape all accounts in parallel
  const results = await Promise.all(
    ACCOUNTS.map(a =>
      a.platform === "twitter"
        ? scrapeTwitter(a.handle, a.id, a.candidate)
        : scrapeInstagram(a.handle, a.id, a.candidate)
    )
  );

  const successful = results.filter(r => r !== null);

  if (successful.length > 0) {
    try {
      await supabaseUpsert("social_stats", successful);
    } catch (e) { console.error("Supabase upsert error:", e); }
  }

  // Read back full table (includes seed data for any that failed)
  let allStats: any[] = successful;
  try { allStats = await supabaseSelect("social_stats"); } catch (e) {}

  return NextResponse.json({
    stats: allStats,
    source: "live",
    fetchedAt: new Date().toISOString(),
    scrapedCount: successful.length,
    failedCount: results.filter(r => r === null).length,
  });
}