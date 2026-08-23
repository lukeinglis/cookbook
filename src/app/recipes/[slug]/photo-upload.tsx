"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addPhoto } from "./actions";

export function PhotoUpload({
  recipeId,
  recipeSlug,
  kind,
}: {
  recipeId: string;
  recipeSlug: string;
  kind: "dish" | "source_card";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const { default: imageCompression } = await import(
        "browser-image-compression"
      );

      // Compress full image
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      });

      // Generate thumbnail
      const thumb = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });

      // Upload both to /api/upload
      const formData = new FormData();
      formData.append("file", compressed, `${Date.now()}-full.jpg`);
      formData.append("thumb", thumb, `${Date.now()}-thumb.jpg`);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      const { blobKey, thumbKey } = await res.json();

      // Save photo record
      const photoForm = new FormData();
      photoForm.set("recipeId", recipeId);
      photoForm.set("recipeSlug", recipeSlug);
      photoForm.set("blobKey", blobKey);
      photoForm.set("thumbKey", thumbKey);
      photoForm.set("kind", kind);

      const result = await addPhoto(photoForm);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Failed to upload photo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="inline-block">
      {/* CSS hide, never unmount — per PRD requirement */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
        // UNVERIFIED selector — needs manual E2E testing against the real site
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading
          ? "Uploading…"
          : kind === "dish"
          ? "Add photo"
          : "Add source card"}
      </Button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
