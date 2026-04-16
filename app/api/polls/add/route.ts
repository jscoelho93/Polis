import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const poll = await request.json();

    // Validate required fields
    if (!poll.pollster || !poll.poll_date || !poll.ossoff_pct) {
      return NextResponse.json({ error: "pollster, poll_date and ossoff_pct are required" }, { status: 400 });
    }

    // Ensure id is set
    if (!poll.id) poll.id = "manual_" + Date.now();
    poll.fetched_at = new Date().toISOString();

    const res = await fetch(SUPABASE_URL + "/rest/v1/polls_538", {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify([poll]),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error("Supabase insert failed: " + err);
    }

    return NextResponse.json({ ok: true, id: poll.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}