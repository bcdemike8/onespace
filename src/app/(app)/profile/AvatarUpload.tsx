"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, type AvatarPerson } from "@/components/Avatar";
import { MAX_AVATAR_BYTES } from "@/lib/profile";
import { removeAvatarAction, setAvatarAction } from "@/app/actions/profile";

/**
 * Pick a photo, and send a small one.
 *
 * The resize happens here, in a canvas, before anything leaves the browser.
 * A photo straight off a phone is four thousand pixels wide and eight
 * megabytes, and every one of those bytes would otherwise cross the wire,
 * sit in Postgres, and come back down on every page that shows a face. 512
 * square at quality 0.85 is around eighty kilobytes and looks identical at
 * the sizes it is actually displayed.
 *
 * Doing it here also means no image library on the server — one fewer
 * dependency, and no native build to go wrong on a Railway deploy.
 */

const SIZE = 512;

async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  // Crop to a square from the middle, then scale. Letterboxing a portrait
  // photo into a circle gives you a head in the top third and two grey bars.
  const edge = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - edge) / 2;
  const sy = (bitmap.height - edge) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't resize images.");
  ctx.drawImage(bitmap, sx, sy, edge, edge, 0, 0, SIZE, SIZE);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("This browser couldn't read that image.");

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

export function AvatarUpload({ person }: { person: AvatarPerson }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Shown straight away, so the page doesn't sit still while it uploads. */
  const [preview, setPreview] = useState<string | null>(null);

  async function chosen(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("That isn't an image file.");
      return;
    }

    setBusy(true);
    try {
      const small = await shrink(file);
      if (small.size > MAX_AVATAR_BYTES) {
        setError("That photo is unusually large even after resizing. Try another.");
        return;
      }

      setPreview(URL.createObjectURL(small));

      const body = new FormData();
      body.set("avatar", small);
      const result = await setAvatarAction({}, body);
      if (result.error) {
        setError(result.error);
        setPreview(null);
        return;
      }
      start(() => router.refresh());
    } catch {
      setError("That image couldn't be read. A PNG or JPEG works best.");
      setPreview(null);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function remove() {
    setError(null);
    setBusy(true);
    setPreview(null);
    void removeAvatarAction({}, new FormData())
      .then((r) => {
        if (r.error) setError(r.error);
        else start(() => router.refresh());
      })
      .finally(() => setBusy(false));
  }

  const working = busy || pending;

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          width={72}
          height={72}
          className="h-[72px] w-[72px] shrink-0 rounded-full border border-ink-200 object-cover"
        />
      ) : (
        <Avatar person={person} size={72} />
      )}

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={working}
            onClick={() => input.current?.click()}
          >
            {working
              ? "Working…"
              : person.avatarUpdatedAt
                ? "Change photo"
                : "Upload a photo"}
          </button>
          {person.avatarUpdatedAt ? (
            <button
              type="button"
              className="btn-ghost btn-sm"
              disabled={working}
              onClick={remove}
            >
              Remove
            </button>
          ) : null}
        </div>

        <p className="mt-1 text-xs text-ink-500">
          Any image. It gets cropped square and shrunk to 512px in your browser
          before it is sent.
        </p>
        {error ? <p className="mt-1 text-xs text-bad-700">{error}</p> : null}

        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void chosen(file);
          }}
        />
      </div>
    </div>
  );
}
