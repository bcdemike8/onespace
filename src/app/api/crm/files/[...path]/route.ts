import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canPreview, safeFilename } from "@/lib/crm/files";

export const dynamic = "force-dynamic";

/**
 * One file off a deal.
 *
 * Signed-in only, and never trusting what the browser called the file when
 * it was uploaded. Two rules do the work:
 *
 *   - Only a PDF or a raster image is served inline. Anything else is sent
 *     as an attachment, so it downloads instead of running. A file served
 *     from our origin runs in our origin — an uploaded .html or .svg could
 *     otherwise read the session of whoever opened it.
 *   - nosniff, so a browser cannot decide a .txt is really HTML and render
 *     it anyway. That check is the whole point of the first rule.
 *
 * ?download=1 forces the attachment path for anything, which is what the
 * Download button uses.
 *
 * The URL is /api/crm/files/<id>/<name>. The name is decoration and is
 * ignored — but Chrome's PDF viewer titles its window after the last path
 * segment, so without it somebody reading an order form sees a cuid where
 * the file name should be.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const viewer = await getCurrentUser();
  if (!viewer) return new NextResponse("Not found", { status: 404 });

  const [id] = (await params).path;
  if (!id) return new NextResponse("Not found", { status: 404 });
  const file = await db.dealFile.findUnique({
    where: { id },
    select: { name: true, mimeType: true, body: { select: { data: true } } },
  });
  if (!file?.body) return new NextResponse("Not found", { status: 404 });

  const wantsDownload =
    new URL(request.url).searchParams.get("download") !== null;
  const inline = canPreview(file.mimeType) && !wantsDownload;

  const body = new Uint8Array(file.body.data);

  return new NextResponse(body, {
    headers: {
      // An octet-stream downloads and never renders, which is exactly what
      // a type we won't preview should do.
      "Content-Type": inline ? file.mimeType : "application/octet-stream",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeFilename(file.name)}"`,
      "X-Content-Type-Options": "nosniff",
      // Belt and braces for the one thing we do render inline: a PDF with a
      // script in it gets no origin to use it against.
      "Content-Security-Policy": "sandbox; default-src 'none'; object-src 'none'",
      "Cache-Control": "private, max-age=300",
    },
  });
}
