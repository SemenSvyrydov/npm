import { NextResponse } from "next/server";

const DOCUMENTS_URL = "http://10.1.10.224:8080/api/case/documents";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const targetUrl = new URL(DOCUMENTS_URL);

    requestUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    const body = await response.text();

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
