import { NextResponse } from "next/server";

const BASE_URL = "http://10.1.10.224:8080/api/case/doc";

export async function GET(
  _request: Request,
  context: { params: { docId: string } },
) {
  try {
    const targetUrl = new URL(
      `${BASE_URL}/${encodeURIComponent(context.params.docId)}/tickets`,
    );

    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    const body = response.body ?? (await response.text());

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
