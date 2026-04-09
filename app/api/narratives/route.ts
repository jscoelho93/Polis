import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  try {
    const newsRes = await fetch(
      `https://newsapi.org/v2/everything?q=Georgia+Senate+2026&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`,
      { cache: "no-store" }
    );
    const newsData = await newsRes.json();
    
    if (!newsData.articles) {
      return NextResponse.json({ error: "NewsAPI error", detail: newsData }, { status: 500 });
    }

    const articles = newsData.articles.slice(0, 8).map((a: any) => ({ title: a.title, source: a.source?.name }));

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: `Return a JSON array of 3 political narratives about Georgia Senate 2026 based on these articles: ${JSON.stringify(articles)}. Only raw JSON array, no markdown. Format: [{"id":"n1","label":"title","sentiment":"positive","vol":70,"vel":15,"detail":"Two sentences.","sources":[{"name":"Source","type":"newspaper","share":50,"reach":80}]}]` }],
      }),
    });

    const aiData = await aiRes.json();
    
    if (aiData.type === "error") {
      return NextResponse.json({ error: "AI error", detail: aiData }, { status: 500 });
    }

    const raw = aiData.content?.[0]?.text || "";
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    
    if (start === -1 || end === -1) {
      return NextResponse.json({ error: "Parse error", raw }, { status: 500 });
    }

    const narratives = JSON.parse(raw.slice(start, end + 1));
    return NextResponse.json({ narratives, articleCount: articles.length, fetchedAt: new Date().toISOString() });

  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}