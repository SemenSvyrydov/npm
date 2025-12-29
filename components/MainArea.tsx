"use client";

import { useState } from "react";
import type { Module } from "@/lib/types";
import ModuleView from "@/components/ModuleView";
import RequestPanel from "@/components/RequestPanel";

type MainAreaProps = {
  module: Module;
};

const normalizeString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
};

const extractDocIds = (data: unknown) => {
  if (Array.isArray(data)) {
    return data
      .map((item) => (typeof item === "object" && item !== null ? item : null))
      .map((item) => (item as { docId?: string | number } | null)?.docId)
      .filter((docId): docId is string | number => Boolean(docId))
      .map((docId) => docId.toString());
  }

  if (data && typeof data === "object") {
    const container = data as { documents?: unknown; data?: unknown };
    const candidate = Array.isArray(container.documents)
      ? container.documents
      : Array.isArray(container.data)
      ? container.data
      : [];

    return candidate
      .map((item) => (typeof item === "object" && item !== null ? item : null))
      .map((item) => (item as { docId?: string | number } | null)?.docId)
      .filter((docId): docId is string | number => Boolean(docId))
      .map((docId) => docId.toString());
  }

  return [];
};

const extractTickets = (data: unknown) => {
  if (Array.isArray(data)) {
    return data.map(normalizeString);
  }

  if (data && typeof data === "object") {
    const container = data as { tickets?: unknown };
    if (Array.isArray(container.tickets)) {
      return container.tickets.map(normalizeString);
    }
  }

  return [];
};

export default function MainArea({ module }: MainAreaProps) {
  const [docRef, setDocRef] = useState("");
  const [dbId, setDbId] = useState("");
  const [tickets, setTickets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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

    const results: string[] = [];
    const errors: string[] = [];

    try {
      for (const docRefValue of docRefs) {
        try {
          const documentsUrl = `/api/case/documents?${new URLSearchParams({
            docRef: docRefValue,
            dbId: normalizedDbId,
          }).toString()}`;

          const documentsResponse = await fetch(documentsUrl);
          if (!documentsResponse.ok) {
            throw new Error(`Ошибка документов: ${documentsResponse.status}`);
          }

          const documentsPayload = await documentsResponse.json();
          const docIds = extractDocIds(documentsPayload);

          if (docIds.length === 0) {
            results.push(`${docRefValue}: документы не найдены`);
            continue;
          }

          for (const docId of docIds) {
            try {
              const ticketsResponse = await fetch(`/api/case/doc/${docId}/tickets`);
              if (!ticketsResponse.ok) {
                throw new Error(`Ошибка билетов: ${ticketsResponse.status}`);
              }

              const ticketsPayload = await ticketsResponse.json();
              const ticketItems = extractTickets(ticketsPayload);

              if (ticketItems.length === 0) {
                results.push(`${docRefValue} / ${docId}: билеты не найдены`);
                continue;
              }

              ticketItems.forEach((ticket) => {
                results.push(`${docRefValue} / ${docId}: ${ticket}`);
              });
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
      }
    } finally {
      setLoading(false);
    }

    if (errors.length > 0) {
      setError(errors.join(" | "));
    }

    setTickets(results);
  };

  return (
    <main>
      <div className="main-grid">
        <ModuleView module={module} />
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
