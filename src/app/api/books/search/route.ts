import { NextRequest, NextResponse } from "next/server";

const SCRAPER_BASE_URL =
  process.env.NEXT_PUBLIC_SCRAPER_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  try {
    const url = `${SCRAPER_BASE_URL}/books/search?q=${encodeURIComponent(q.trim())}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "No se pudo conectar con el scrapper." },
      { status: 502 }
    );
  }
}
