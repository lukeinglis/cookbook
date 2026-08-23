import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAuthenticated = await verifySession();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  let videoId = "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!videoId) {
    return NextResponse.json({ error: "Could not extract video ID" }, { status: 400 });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch video metadata" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({
      title: data.title,
      author_name: data.author_name,
      videoId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 502 });
  }
}
