"use client";

import { useState, type ChangeEvent } from "react";

import type { Module } from "@/lib/types";

type RequestPanelProps = {
  module: Module;
};

type InputsState = {
  docRef: string;
  dbId: string;
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

export default function RequestPanel({ module }: RequestPanelProps) {
  const [inputs, setInputs] = useState<InputsState>({ docRef: "", dbId: "" });
  const [tickets, setTickets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleChange = (field: keyof InputsState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setInputs((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    const docRefs = Array.from(
      new Set(
        inputs.docRef
      .split(",")
      .map((value) => value.trim())
            .filter(Boolean),
      ),
    );
    const dbId = inputs.dbId.trim();

    if (docRefs.length === 0) {
      setError("Укажите хотя бы один docRef.");
      setTickets([]);
      return;
    }

    if (!dbId) {
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
      for (const docRef of docRefs) {
        try {
          const documentsUrl = `/api/case/documents?${new URLSearchParams({
            docRef,
            dbId,
          }).toString()}`;

          const documentsResponse = await fetch(documentsUrl);
          if (!documentsResponse.ok) {
            throw new Error(`Ошибка документов: ${documentsResponse.status}`);
          }

          const documentsPayload = await documentsResponse.json();
          const docIds = extractDocIds(documentsPayload);

          if (docIds.length === 0) {
            results.push(`${docRef}: документы не найдены`);
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
                results.push(`${docRef} / ${docId}: билеты не найдены`);
                continue;
              }

              ticketItems.forEach((ticket) => {
                results.push(`${docRef} / ${docId}: ${ticket}`);
              });
            } catch (ticketError) {
              const message = ticketError instanceof Error ? ticketError.message : "Неизвестная ошибка";
              errors.push(`${docRef} / ${docId}: ${message}`);
            }
          }
        } catch (documentsError) {
          const message = documentsError instanceof Error ? documentsError.message : "Неизвестная ошибка";
          errors.push(`${docRef}: ${message}`);
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
    <aside className="card">
      <h3>Контекстные действия</h3>
      <p>Настройки запросов для модуля: {module.name}.</p>
      <ul>
        {module.requestTypes.map((requestType) => (
          <li key={requestType}>Сценарий: {requestType}</li>
        ))}
      </ul>

      <div className="request-panel__inputs">
        <label className="request-panel__label">
          docRef (через запятую)
          <textarea
            rows={3}
            value={inputs.docRef}
            onChange={handleChange("docRef")}
            placeholder="DOC-001, DOC-002"
          />
        </label>
        <label className="request-panel__label">
          dbId
          <input
            type="text"
            value={inputs.dbId}
            onChange={handleChange("dbId")}
            placeholder="1"
          />
        </label>
      </div>

      <button
        type="button"
        className="tab-button tab-button--active"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Запрос выполняется..." : "Выполнить запрос"}
      </button>

      {error && <p className="request-panel__error">{error}</p>}

      {hasSearched && !loading && tickets.length === 0 && !error && (
        <p className="request-panel__empty">Нет результатов.</p>
      )}

      {tickets.length > 0 && (
        <div className="request-panel__results">
          <h4>Результаты</h4>
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, index) => (
                <tr key={`${ticket}-${index}`}>
                  <td>{ticket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </aside>
  );
}
