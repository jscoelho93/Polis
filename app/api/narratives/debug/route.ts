import { NextResponse } from "next/server";

const KEYWORDS = [
  "Jon Ossoff Georgia",
  "Mike Collins Georgia Senate",
  "Georgia Senate 2026",
  "Georgia politics",
];

async function fetchNews(query: string) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();
  return data.articles || [];
}

export async function GET() {
  try {
    const allArticles: any[] = [];
    for (const keyword of KEYWORDS) {
      const articles = await fetchNews(keyword);
      allArticles.push(...articles.map((a: any) => ({
        title: a.title,
        source: a.source?.name,
        publishedAt: a.publishedAt,
      })));
    }

    const unique = Array.from(new Map(allArticles.map(a => [a.title, a])).values());

    const prompt = `Analyze these ${unique.length} news articles about Georgia Senate 2026 politics. Return ONLY a raw JSON array, no markdown, no explanation, no code blocks.

Articles:
${unique.slice(0, 15).map((a, i) => `${i+1}. "${a.title}" — ${a.source}`).join("\n")}

Return 3 to 5 narrative objects in this exact format, starting directly with [ :
[{"id":"n1","label":"short title","sentiment":"positive","vol":72,"vel":18,"detail":"Two sentence summary.","sources":[{"name":"Source","type":"newspaper","share":50,"reach":80}]}]`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const raw = aiData.content?.map((c: any) => c.text || "").join("") || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array found in response");
    const narratives = JSON.parse(clean.slice(start, end + 1));

    return NextResponse.json({
      narratives,
      articleCount: unique.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}