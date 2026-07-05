import { NextResponse } from "next/server";

import { getPlaceMedia } from "@/lib/place-media.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const media = await getPlaceMedia(slug);
  return NextResponse.json(media);
}
