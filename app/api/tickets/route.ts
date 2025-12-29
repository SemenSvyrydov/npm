import { NextResponse } from "next/server";
import type { Ticket } from "@/lib/types";

type DocumentItem = {
  docId: string;
};

const API_BASE = "http://10.1.10.224:8080";
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const docRef = searchParams.get("docRef")?.trim() ?? "";
  const dbId = searchParams.get("dbId")?.trim() ?? "";

  if (!docRef || !dbId) {
    return NextResponse.json([], { status: 200 });
  }

  const refs = docRef
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const documentsRequests = refs.map((ref) => {
    const url = new URL(`${API_BASE}/api/case/documents`);
    url.searchParams.set("caseNum", "");
    url.searchParams.set("procNum", "");
    url.searchParams.set("docRef", ref);
    url.searchParams.set("docId", "");
    url.searchParams.set("courtName", "");
    url.searchParams.set("dbId", dbId);
    url.searchParams.set("procRef", "");
    url.searchParams.set("caseId", "");
    return fetchWithTimeout(url.toString()).then((response) => response.json());
  });

  const documentsResults = (await Promise.all(documentsRequests)) as DocumentItem[][];
  const docIds = documentsResults.flatMap((items) =>
    items.map((item) => item.docId).filter(Boolean)
  );

  if (docIds.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const ticketsRequests = docIds.map(async (docId) => {
    const response = await fetchWithTimeout(
      `${API_BASE}/api/case/doc/${docId}/tickets`
    );
    return (await response.json()) as Ticket[];
  });

  const ticketsResults = await Promise.all(ticketsRequests);
  const tickets = ticketsResults.flat();

  return NextResponse.json(tickets, { status: 200 });
}
