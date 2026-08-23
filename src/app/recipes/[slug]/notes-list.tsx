"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { togglePromoted } from "./actions";

type Note = {
  id: string;
  body: string;
  promoted: boolean;
  createdAt: string;
  cookId: string | null;
};

export function NotesList({
  notes,
  recipeId,
  recipeSlug,
}: {
  notes: Note[];
  recipeId: string;
  recipeSlug: string;
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Notes</h2>
        <Link href={`/recipes/${recipeSlug}/add-note`}>
          <Button>Add note</Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border p-4">
              <p className="text-lg">{note.body}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                {note.promoted && <Badge variant="secondary">Promoted</Badge>}
                <form
                  action={async () => {
                    await togglePromoted(note.id, !note.promoted, recipeSlug);
                  }}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    {note.promoted ? "Unpromote" : "Promote"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
