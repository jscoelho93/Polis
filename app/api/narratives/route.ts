import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getReach, formatReach } from "./reach";

export const maxDuration = 30;

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  try {
    const [newsApiResults, guardianResults] = await Promise.all([
      Promise.all([
        "Jon Ossoff Georgia Senate",
        "Mike Collins Georgia Senate",
        "Georgia Senate race 2026",
        "Georgia politics Ossoff",
        "Collins inflation Georgia",
      ].map(q =>
        fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${process.env.NEWS_API_KEY}`, { cache: "no-store" })
          .then(r => r.json()).then(d => (d.articles || []).map((a: any) => ({ title: a.title, source: a.source?.name, url: a.url, publishedAt: a.publishedAt }))).catch(() => [])
      )),
      Promise.all([
        "Jon Ossoff",
        "Georgia Senate 2026",
        "Mike Collins Georgia",
        "Georgia politics",
        "Georgia Medicaid",
      ].map(q =>
        fetch(`https://content.guardianapis.com/search?q=${encodeURIComponent(q)}&api-key=${process.env.GUARDIAN_API_KEY}&page-size=50&show-fields=headline&order-by=newest`, { cache: "no-store" })
          .then(r => r.json()).then(d => (d.response?.results || []).map((a: any) => ({ title: a.webTitle, source: "The Guardian", url: a.webUrl, publishedAt: a.webPublicationDate }))).catch(() => [])
      )),
    ]);

    const all = [...newsApiResults.flat(), ...guardianResults.flat()];
    const unique = Array.from(new Map(all.map((a: any) => [a.url, {
      title: a.title,
      source: a.source?.name || "The Guardian",
      url: a.url,
      publishedAt: a.publishedAt,
    }])).values());

    const prompt = `You are a political intelligence analyst for Sen. Jon Ossoff's 2026 Georgia Senate campaign. Analyze these ${unique.length} news articles and cluster them into 4-6 SPECIFIC Georgia-focused narratives. Each narrative must be directly relevant to the Georgia Senate race.

Articles:
${unique.slice(0, 40).map((a: any, i) => `${i+1}. [${a.source}] "${a.title}" — ${a.url}`).join("\n")}

Rules:
- Every narrative must mention Georgia, Ossoff, Collins, or a Georgia-specific issue
- Label must be specific and actionable (e.g. "Collins votes against Savannah port funding" not "Republican issues")
- sentiment must be positive, negative, mixed, or neutral FROM OSSOFF'S PERSPECTIVE
- Include only articles genuinely relevant to Georgia 2026
- List article indices in "articleIndices" (0-based) and URLs in "articleUrls"

Return ONLY a raw JSON array, no markdown:
[{"id":"n1","label":"specific Georgia-focused title","sentiment":"positive","detail":"Two sentences specific to Georgia 2026.","articleIndices":[0,2,4],"articleUrls":["url1","url2"]}]`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const raw = aiData.content?.[0]?.text || "";
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON: " + raw.slice(0, 200));

    const clusters = JSON.parse(raw.slice(start, end + 1));
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const { data: yesterdaySnapshots } = await supabase
      .from("narrative_snapshots")
      .select("label, article_count")
      .gte("fetched_at", yesterday + "T00:00:00Z")
      .lt("fetched_at", today + "T00:00:00Z");

    const narratives = clusters.map((n: any) => {
      const indices: number[] = n.articleIndices || [];
      const narrativeArticles = indices.map((i: number) => unique[i]).filter(Boolean);
      const vol = narrativeArticles.length;

      const sourceCounts: Record<string, number> = {};
      narrativeArticles.forEach((a: any) => {
        if (a.source) sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1;
      });

      const sources = Object.entries(sourceCounts).map(([name, count]) => ({
        name,
        type: "newspaper",
        count,
        share: Math.round((count / Math.max(vol, 1)) * 100),
        reach: getReach(name),
        reachFormatted: formatReach(getReach(name)),
      })).sort((a, b) => b.count - a.count);

      const yesterdayMatch = yesterdaySnapshots?.find(s =>
        s.label.toLowerCase().includes(n.label.toLowerCase().slice(0, 20)) ||
        n.label.toLowerCase().includes(s.label.toLowerCase().slice(0, 20))
      );
      const yesterdayCount = yesterdayMatch?.article_count || 0;
      const vel = vol - yesterdayCount;

      return { ...n, vol, vel, sources, articleUrls: n.articleUrls || [] };
    }).sort((a: any, b: any) => b.vol - a.vol);

    const snapshots = narratives.map((n: any) => ({
      narrative_id: n.id,
      label: n.label,
      article_count: n.vol,
      sentiment: n.sentiment,
      sources: n.sources,
      fetched_at: new Date().toISOString(),
    }));

    await supabase.from("narrative_snapshots").insert(snapshots);

    return NextResponse.json({
      narratives,
      articleCount: unique.length,
      fetchedAt: new Date().toISOString(),
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}