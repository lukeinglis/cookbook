export function buildRawText(qty: string, unit: string, item: string, prepNote: string): string {
  const parts = [qty, unit, item].filter(Boolean).join(" ");
  if (prepNote) return `${parts}, ${prepNote}`;
  return parts;
}

export function extractYouTubeVideoId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}
