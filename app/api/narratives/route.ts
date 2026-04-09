import { NextResponse } from "next/server";
import { getReach, formatReach } from "./reach";

export const maxDuration = 30;

export async function GET() {
  try {
    const results = await Promise.all([
      "Jon Ossoff Georgia Senate",
      "Georgia Senate 2026",
    ].map(q =>
      fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`, { cache: "no-store" })
        .then(r => r.json()).then(d => d.articles || []).catch(() => [])
    ));

    const unique = Array.from(new Map(results.flat().map((a: any) => [a.url, {
      title: a.title,
      source: a.source?.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }])).values());

    const prompt = `Analyze these news articles about Georgia Senate 2026. Return ONLY a raw JSON array of 3-4 narratives, no markdown.

Articles:
${unique.slice(0, 10).map((a: any, i) => `${i+1}. "${a.title}" — ${a.source} — ${a.url}`).join("\n")}

For each narrative, include the URLs of the articles that support it in an "articleUrls" array.

Format: [{"id":"n1","label":"title","sentiment":"positive","vol":70,"vel":15,"detail":"Two sentences.","sources":[{"name":"Source","type":"newspaper","share":50,"reach":80}],"articleUrls":["https://..."]}]`;

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
    const narratives = JSON.parse(raw.slice(start, end + 1)).map((n: any) => ({
  ...n,
  sources: n.sources?.map((s: any) => ({
    ...s,
    reach: getReach(s.name),
    reachFormatted: formatReach(getReach(s.name)),
  })),
}));
    return NextResponse.json({ narratives, articleCount: unique.length, fetchedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}