import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const thumb = formData.get("thumb") as File | null;

  if (!file || !thumb) {
    return NextResponse.json({ error: "file and thumb required" }, { status: 400 });
  }

  const [fullBlob, thumbBlob] = await Promise.all([
    put(file.name, file, { access: "public" }),
    put(thumb.name, thumb, { access: "public" }),
  ]);

  return NextResponse.json({
    blobKey: fullBlob.url,
    thumbKey: thumbBlob.url,
  });
}
