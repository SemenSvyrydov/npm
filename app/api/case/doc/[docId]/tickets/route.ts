import { NextResponse } from "next/server";

const BASE_URL = "http://10.1.10.224:8080/api/case/doc";

type RouteContext = {
  params: {
    docId: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const targetUrl = new URL(`${BASE_URL}/${encodeURIComponent(params.docId)}/tickets`);
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
