import { NextResponse } from "next/server";
import { getReach, formatReach } from "./reach";

export const maxDuration = 30;

export async function GET() {
  try {
    const results = await Promise.all([
      "Jon Ossoff Georgia Senate",
      "Georgia Senate 2026",
    ].map(q =>
      fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`, { cache: "no-store" })
        .then(r => r.json()).then(d => d.articles || []).catch(() => [])
    ));

    const allArticles = results.flat().map((a: any) => ({
      title: a.title,
      source: a.source?.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    const unique = Array.from(new Map(allArticles.map((a: any) => [a.url, a])).values());
    const totalArticles = unique.length;

    const prompt = `Analyze these ${totalArticles} news articles about Georgia Senate 2026. Cluster them into 3-4 narratives. Return ONLY a raw JSON array, no markdown.

Articles:
${unique.slice(0, 15).map((a: any, i) => `${i+1}. [${a.source}] "${a.title}" — ${a.url}`).join("\n")}

For each narrative, list the exact article numbers (from the list above) that belong to it in an "articleIndices" array (0-based), and list the article URLs in "articleUrls".

Format: [{"id":"n1","label":"title","sentiment":"positive","detail":"Two sentences.","articleIndices":[0,2,4],"articleUrls":["url1","url2"]}]`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const raw = aiData.content?.[0]?.text || "";
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON: " + raw.slice(0, 200));

    const clusters = JSON.parse(raw.slice(start, end + 1));

    const narratives = clusters.map((n: any) => {
      // Get actual articles for this narrative
      const indices: number[] = n.articleIndices || [];
      const narrativeArticles = indices.map((i: number) => unique[i]).filter(Boolean);
      
      // Real volume = actual article count
      const vol = narrativeArticles.length;

      // Real source counts
      const sourceCounts: Record<string, number> = {};
      narrativeArticles.forEach((a: any) => {
        if (a.source) sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1;
      });

      // Real source shares
      const sources = Object.entries(sourceCounts).map(([name, count]) => ({
        name,
        type: "newspaper",
        count,
        share: Math.round((count / Math.max(vol, 1)) * 100),
        reach: getReach(name),
        reachFormatted: formatReach(getReach(name)),
      })).sort((a, b) => b.count - a.count);

      // Velocity placeholder until we have Supabase
      const vel = Math.round((vol / Math.max(totalArticles, 1)) * 40) - 5;

      return {
        ...n,
        vol,
        vel,
        sources,
        articleUrls: n.articleUrls || [],
      };
    }).sort((a: any, b: any) => b.vol - a.vol);

    return NextResponse.json({ 
      narratives, 
      articleCount: totalArticles, 
      fetchedAt: new Date().toISOString() 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}