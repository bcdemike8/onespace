import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Somebody's profile photo.
 *
 * Signed-in only. These are pictures of the people who work here, and a URL
 * that serves one to anybody who can guess a cuid is a URL that ends up in a
 * scraper. `getCurrentUser` rather than `requireUser` because a redirect to
 * the login page inside an <img> is a broken image, not a sign-in prompt.
 *
 * The bytes live in Postgres (see the User model). Callers append
 * ?v=<avatarUpdatedAt> so a new photo gets a new URL; that lets the response
 * be cached hard and still change the moment somebody uploads.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentUser();
  if (!viewer) return new NextResponse("Not found", { status: 404 });

  const { id } = await params;
  const photo = await db.userAvatar.findUnique({ where: { userId: id } });
  if (!photo) return new NextResponse("Not found", { status: 404 });

  const body = new Uint8Array(photo.data);

  return new NextResponse(body, {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(body.byteLength),
      // Private: a shared cache must never hand one person's photo to
      // another's browser. Immutable is safe because the version in the URL
      // changes whenever the photo does.
      "Cache-Control": "private, max-age=86400, immutable",
      ETag: `"${photo.updatedAt.getTime()}"`,
    },
  });
}
