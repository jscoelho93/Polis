import { NextResponse } from "next/server";

const KEYWORDS = [
  "Jon Ossoff Georgia",
  "Mike Collins Georgia Senate",
  "Georgia Senate 2026",
  "Georgia politics",
];

async function fetchNews(query: string) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
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

    const prompt = `Analyze these news articles about Georgia Senate 2026 and return ONLY a JSON array with no markdown, no explanation, no backticks. Just the raw JSON array starting with [ and ending with ].

Articles:
${unique.slice(0, 15).map((a, i) => `${i+1}. "${a.title}" — ${a.source}`).join("\n")}

Return this exact format:
[{"id":"n1","label":"short narrative title","sentiment":"positive","vol":72,"vel":18,"detail":"Two sentence summary of this narrative.","sources":[{"name":"Source Name","type":"newspaper","share":50,"reach":80}]},{"id":"n2","label":"another narrative","sentiment":"negative","vol":45,"vel":12,"detail":"Two sentence summary.","sources":[{"name":"Source Name","type":"broadcast","share":60,"reach":75}]}]

Rules: sentiment must be positive, negative, mixed, or neutral. vol is 0-100. vel is -30 to 30. Include 3 to 5 narratives total.`;

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
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: "[" }
        ],
      }),
    });

    const aiData = await aiRes.json();
    const text = "[" + (aiData.content?.map((c: any) => c.text || "").join("") || "");
    const narratives = JSON.parse(text);

    return NextResponse.json({ 
      narratives, 
      articleCount: unique.length,
      fetchedAt: new Date().toISOString() 
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
