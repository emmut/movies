import { type NextRequest, NextResponse } from "next/server";
import { generateUrl } from "@imgproxy/imgproxy-js-core";
import { createHmac } from "crypto";
import { env } from "@/env";

function signPath(path: string): string {
  const key = Buffer.from(env.IMGPROXY_KEY, "hex");
  const salt = Buffer.from(env.IMGPROXY_SALT, "hex");
  const hmac = createHmac("sha256", key);
  hmac.update(salt);
  hmac.update(path);
  return hmac.digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const src = searchParams.get("src");
  const width = Number(searchParams.get("width"));
  const quality = searchParams.get("quality") ? Number(searchParams.get("quality")) : undefined;

  if (!src || !width) {
    return new NextResponse("Missing required params", { status: 400 });
  }

  const fullSrc = new URL(src, env.IMGPROXY_BASE_URL).toString();
  const encodedSrc = Buffer.from(fullSrc).toString("base64url");

  const path = generateUrl(
    { value: encodedSrc, type: "base64" },
    { width, quality },
  );

  const signature = signPath(path);
  return NextResponse.redirect(`${env.IMGPROXY_ENDPOINT}/${signature}${path}`);
}
