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
        description: a.description,
        source: a.source?.name,
        url: a.url,
        publishedAt: a.publishedAt,
        keyword,
      })));
    }

    const unique = Array.from(new Map(allArticles.map(a => [a.url, a])).values());

    const prompt = `You are Polis, a political intelligence AI. Analyze these ${unique.length} news articles about Georgia Senate 2026 politics and cluster them into 3-5 narratives.

Articles:
${unique.slice(0, 20).map((a, i) => `${i+1}. "${a.title}" — ${a.source} (${a.publishedAt?.slice(0,10)})`).join("\n")}

Return ONLY valid JSON array:
[{"id":"n1","label":"narrative title","sentiment":"positive|negative|mixed|neutral","vol":0-100,"vel":-30-30,"detail":"2 sentence summary","sources":[{"name":"source name","type":"newspaper|broadcast|social|blog","share":0-100,"reach":0-100}]}]

Base vol on number of articles covering it. Base vel on whether coverage is growing or fading. Be specific to Georgia 2026.`;

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
    const text = aiData.content?.map((c: any) => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const narratives = JSON.parse(clean);

    return NextResponse.json({ 
      narratives, 
      articleCount: unique.length,
      fetchedAt: new Date().toISOString() 
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
