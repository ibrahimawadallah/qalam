export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  try {
    const audioRes = await fetch(targetUrl, {
      headers: {
        accept: "audio/mpeg, audio/*, */*",
        "user-agent": "Mozilla/5.0",
      },
    });

    if (!audioRes.ok || !audioRes.body) {
      return new Response("Audio not available", { status: audioRes.status ?? 502 });
    }

    const contentType = audioRes.headers.get("content-type") ?? "audio/mpeg";
    const headers = new Headers({
      "content-type": contentType,
      "cache-control": "public, max-age=86400",
      "access-control-allow-origin": "*",
    });

    const contentLength = audioRes.headers.get("content-length");
    if (contentLength) {
      headers.set("content-length", contentLength);
    }

    return new Response(audioRes.body, { headers });
  } catch {
    return new Response("Audio fetch failed", { status: 502 });
  }
}
