"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Photo = {
  id: string;
  blobKey: string;
  thumbKey: string;
  createdAt: Date;
};

export function PhotoGallery({
  photos,
  title,
}: {
  photos: Photo[];
  title: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo.blobKey)}
            className="overflow-hidden rounded-lg"
          >
            <img
              src={photo.thumbKey}
              alt=""
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl p-0">
          {selected && (
            <img src={selected} alt="" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
