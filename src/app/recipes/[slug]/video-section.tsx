"use client";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Video = {
  id: string;
  url: string;
  provider: string;
  providerVideoId: string;
  title: string;
  channel: string;
  label: string | null;
  position: number;
};

export function VideoSection({ videos }: { videos: Video[] }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-2xl font-semibold">Videos</h2>
      <div className="space-y-4">
        {videos.map((video, idx) => (
          <VideoEmbed key={video.id} video={video} defaultOpen={idx === 0} />
        ))}
      </div>
    </section>
  );
}

function VideoEmbed({ video, defaultOpen }: { video: Video; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-accent">
        <div>
          {video.label && (
            <span className="text-sm font-medium text-muted-foreground">{video.label} — </span>
          )}
          <span className="font-medium">{video.title}</span>
          <span className="ml-2 text-sm text-muted-foreground">{video.channel}</span>
        </div>
        <span className="text-muted-foreground">{open ? "▼" : "▶"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: "56.25%" }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${video.providerVideoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
