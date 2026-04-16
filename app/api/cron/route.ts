import { NextResponse } from "next/server";

// This route is called by Vercel Cron daily at 6am ET
// It triggers the ext-context route with force refresh
export async function GET(request: Request) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? "https://" + process.env.VERCEL_URL
      : "http://localhost:3000";

    const res = await fetch(baseUrl + "/api/ext-context?refresh=true");
    const data = await res.json();

    return NextResponse.json({
      ok: true,
      realCount: data.realCount || 0,
      fetchedAt: data.fetchedAt,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}