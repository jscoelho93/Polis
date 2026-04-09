import { NextResponse } from "next/server";

export async function GET() {
  try {
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
        messages: [{ role: "user", content: `Return a JSON array of 2 political narratives. ONLY raw JSON, no markdown. Format: [{"id":"n1","label":"test","sentiment":"positive","vol":50,"vel":10,"detail":"test detail","sources":[{"name":"CNN","type":"broadcast","share":50,"reach":80}]}]` }],
      }),
    });
    const aiData = await aiRes.json();
    const text = aiData.content?.map((c: any) => c.text || "").join("") || "";
    return NextResponse.json({ raw: text, aiData });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
