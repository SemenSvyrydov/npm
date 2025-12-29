"use client";

import { useEffect, useState } from "react";
import type { Module, Ticket } from "@/lib/types";
import ModuleView from "@/components/ModuleView";
import RequestPanel from "@/components/RequestPanel";

type MainAreaProps = {
  module: Module;
};

const normalizeTicketField = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
};

const extractDocIds = (data: unknown) => {
  const readDocId = (item: unknown): string | null => {
    if (!item || typeof item !== "object") {
      return null;
    }

    const record = item as Record<string, unknown>;
    const candidates = [
      record.docId,
      record.docID,
      record.docid,
      record.DOC_ID,
      record.DOCID,
    ];

    const value = candidates.find(
      (candidate) => candidate !== null && candidate !== undefined && candidate !== "",
    );

    if (value === null || value === undefined) {
      return null;
    }

    return String(value);
  };

  if (Array.isArray(data)) {
    return data
      .map(readDocId)
      .filter((docId): docId is string => Boolean(docId));
  }

  if (data && typeof data === "object") {
    const container = data as { documents?: unknown; data?: unknown };
    const candidate = Array.isArray(container.documents)
      ? container.documents
      : Array.isArray(container.data)
      ? container.data
      : [];

    return candidate
      .map(readDocId)
      .filter((docId): docId is string => Boolean(docId));
  }

  return [];
};

const mapTicket = (item: unknown): Ticket | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;

  return {
    TICKET_ID: normalizeTicketField(record.TICKET_ID),
    REF_ID: normalizeTicketField(record.REF_ID),
    CASE_NUMBER: normalizeTicketField(record.CASE_NUMBER),
    DESCRIPTION: normalizeTicketField(record.DESCRIPTION),
    DT_STATUS: normalizeTicketField(record.DT_STATUS),
    DELIVERED_AT: normalizeTicketField(record.DELIVERED_AT),
    USER_NAME: normalizeTicketField(record.USER_NAME),
    CODE: normalizeTicketField(record.CODE),
  };
};

const extractTickets = (data: unknown): Ticket[] => {
  const source = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { tickets?: unknown }).tickets)
    ? (data as { tickets?: unknown }).tickets
    : [];

  return source
    .map(mapTicket)
    .filter((ticket): ticket is Ticket => Boolean(ticket));
};

export default function MainArea({ module }: MainAreaProps) {
  const [docRef, setDocRef] = useState("");
  const [dbId, setDbId] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentDocRef, setCurrentDocRef] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentStartedAt, setCurrentStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!loading || currentStartedAt === null) {
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(Math.floor((Date.now() - currentStartedAt) / 1000));
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - currentStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loading, currentStartedAt]);

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    timeoutMs: number,
  ) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const runWithConcurrency = async <Item,>(
    items: Item[],
    limit: number,
    worker: (item: Item) => Promise<void>,
  ) => {
    const queue = [...items];
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item === undefined) {
          return;
        }
        await worker(item);
      }
    });

    await Promise.all(workers);
  };

  const handleDocRefChange = (value: string) => {
    setDocRef(value);
  };

  const handleDbIdChange = (value: string) => {
    setDbId(value.replace(/\D/g, ""));
  };

  const handleSubmit = async () => {
    const docRefs = Array.from(
      new Set(
        docRef
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    );
    const normalizedDbId = dbId.trim();

    if (docRefs.length === 0) {
      setError("Укажите хотя бы один docRef.");
      setTickets([]);
      return;
    }

    if (!normalizedDbId) {
      setError("Укажите dbId для поиска.");
      setTickets([]);
      return;
    }

    setLoading(true);
    setError(null);
    setTickets([]);
    setHasSearched(true);
    setCurrentDocRef(null);
    setCurrentDocId(null);
    setCurrentStartedAt(Date.now());

    const errors: string[] = [];
    const collectedTickets: Ticket[] = [];
    const timeoutMs = 15000;
    const concurrencyLimit = 3;

    try {
      await runWithConcurrency(docRefs, concurrencyLimit, async (docRefValue) => {
        try {
          setCurrentDocRef(docRefValue);
          setCurrentDocId(null);
          setCurrentStartedAt(Date.now());
          const documentsUrl = `/api/case/documents?${new URLSearchParams({
            caseNum: "",
            procNum: "",
            docRef: docRefValue,
            docId: "",
            courtName: "",
            dbId: normalizedDbId,
            procRef: "",
            caseId: "",
          }).toString()}`;

          const documentsStart = performance.now();
          console.info("Документы: старт запроса", {
            docRef: docRefValue,
            dbId: normalizedDbId,
            documentsUrl,
            startedAtMs: documentsStart,
          });
          const documentsResponse = await fetchWithTimeout(
            documentsUrl,
            undefined,
            timeoutMs,
          );
          console.info("Документы: ответ", {
            docRef: docRefValue,
            dbId: normalizedDbId,
            documentsUrl,
            status: documentsResponse.status,
            elapsedMs: performance.now() - documentsStart,
            contentLength: documentsResponse.headers.get("content-length"),
          });
          if (!documentsResponse.ok) {
            throw new Error(`Ошибка документов: ${documentsResponse.status}`);
          }

          const documentsParseStart = performance.now();
          console.info("Документы: чтение JSON", {
            docRef: docRefValue,
            dbId: normalizedDbId,
            documentsUrl,
            startedAtMs: documentsParseStart,
          });
          const documentsPayload = await documentsResponse.json();
          console.info("Документы: JSON прочитан", {
            docRef: docRefValue,
            dbId: normalizedDbId,
            documentsUrl,
            elapsedMs: performance.now() - documentsParseStart,
          });
          const docIds = extractDocIds(documentsPayload);

          if (docIds.length === 0) {
            return;
          }

          for (const docId of docIds) {
            try {
              setCurrentDocRef(docRefValue);
              setCurrentDocId(docId);
              setCurrentStartedAt(Date.now());
              const ticketsStart = performance.now();
              console.info("Билеты: старт запроса", {
                docRef: docRefValue,
                dbId: normalizedDbId,
                docId,
                documentsUrl,
                startedAtMs: ticketsStart,
              });
              const ticketsResponse = await fetchWithTimeout(
                `/api/case/doc/${docId}/tickets`,
                undefined,
                timeoutMs,
              );
              console.info("Билеты: ответ", {
                docRef: docRefValue,
                dbId: normalizedDbId,
                docId,
                status: ticketsResponse.status,
                elapsedMs: performance.now() - ticketsStart,
                contentLength: ticketsResponse.headers.get("content-length"),
              });
              if (!ticketsResponse.ok) {
                throw new Error(`Ошибка билетов: ${ticketsResponse.status}`);
              }

              const ticketsParseStart = performance.now();
              console.info("Билеты: чтение JSON", {
                docRef: docRefValue,
                dbId: normalizedDbId,
                docId,
                startedAtMs: ticketsParseStart,
              });
              const ticketsPayload = await ticketsResponse.json();
              console.info("Билеты: JSON прочитан", {
                docRef: docRefValue,
                dbId: normalizedDbId,
                docId,
                elapsedMs: performance.now() - ticketsParseStart,
              });
              const ticketItems = extractTickets(ticketsPayload);

              console.info("Билеты: завершение запроса", {
                docRef: docRefValue,
                dbId: normalizedDbId,
                docId,
                ticketsCount: ticketItems.length,
              });
              if (ticketItems.length === 0) {
                continue;
              }

              collectedTickets.push(...ticketItems);
            } catch (ticketError) {
              const message =
                ticketError instanceof Error
                  ? ticketError.message
                  : "Неизвестная ошибка";
              errors.push(`${docRefValue} / ${docId}: ${message}`);
            }
          }
        } catch (documentsError) {
          const message =
            documentsError instanceof Error
              ? documentsError.message
              : "Неизвестная ошибка";
          errors.push(`${docRefValue}: ${message}`);
        }
      });
    } finally {
      setLoading(false);
      setCurrentDocRef(null);
      setCurrentDocId(null);
    }

    if (errors.length > 0) {
      setError(errors.join(" | "));
    }

    setTickets(collectedTickets);
  };

  return (
    <main>
      {hasSearched && (
        <div className="request-status">
          <p>
            Текущий docRef:{" "}
            {currentDocRef ? currentDocRef : loading ? "ожидание..." : "—"}
          </p>
          <p>Текущий docId: {currentDocId ? currentDocId : "—"}</p>
          <p>Таймер: {loading ? `${elapsedSeconds} сек.` : "—"}</p>
        </div>
      )}
      <div className="main-grid">
        <ModuleView module={module} tickets={tickets} />
        <RequestPanel
          module={module}
          docRef={docRef}
          dbId={dbId}
          loading={loading}
          error={error}
          tickets={tickets}
          hasSearched={hasSearched}
          onDocRefChange={handleDocRefChange}
          onDbIdChange={handleDbIdChange}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
