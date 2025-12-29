"use client";

import { useState } from "react";
import type { Module, Ticket } from "@/lib/types";
import { CASE_API_TIMEOUT_SECONDS } from "@/lib/timeouts";

type RequestPanelProps = {
  module: Module;
  docRef: string;
  dbId: string;
  docRefConcurrency: number;
  loading: boolean;
  error: string | null;
  tickets: Ticket[];
  hasSearched: boolean;
  onDocRefChange: (value: string) => void;
  onDbIdChange: (value: string) => void;
  onDocRefConcurrencyChange: (value: number) => void;
  onSubmit: () => void;
};

export default function RequestPanel({
  module,
  docRef,
  dbId,
  docRefConcurrency,
  loading,
  error,
  tickets,
  hasSearched,
  onDocRefChange,
  onDbIdChange,
  onDocRefConcurrencyChange,
  onSubmit,
}: RequestPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const handleCopyTickets = async () => {
    if (tickets.length === 0) {
      return;
    }

    const ticketIds = tickets
      .map((ticket) => ticket.TICKET_ID)
      .filter(Boolean)
      .join(", ");

    if (!ticketIds) {
      return;
    }

    try {
      await navigator.clipboard.writeText(ticketIds);
      setCopyState("success");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (copyError) {
      console.error(copyError);
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  return (
    <aside className="card">
      <h3>Контекстные действия</h3>
      <p>Настройки запросов для модуля: {module.name}.</p>

      <div className="request-panel__inputs">
        <label className="request-panel__label">
          docRef (через запятую)
          <textarea
            value={docRef}
            onChange={(event) => onDocRefChange(event.target.value)}
            placeholder="DOC-001, DOC-002"
            rows={4}
          />
        </label>
        <label className="request-panel__label">
          dbId
          <input
            type="text"
            value={dbId}
            onChange={(event) => onDbIdChange(event.target.value)}
            inputMode="numeric"
            pattern="\\d*"
            placeholder="1"
          />
        </label>
        <label className="request-panel__label">
          Кол-во одновременно обрабатываемых docRef
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={docRefConcurrency}
            onChange={(event) =>
              onDocRefConcurrencyChange(Number(event.target.value))
            }
            placeholder="1"
          />
          <span className="request-panel__hint">
            Допустимый диапазон: от 1 до 10, по умолчанию 1.
          </span>
        </label>
      </div>

      <button
        type="button"
        className="tab-button tab-button--active"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Запрос выполняется..." : "Выполнить запрос"}
      </button>
      <p className="request-panel__hint">
        Долгие запросы могут выполняться до {CASE_API_TIMEOUT_SECONDS} сек. —
        это нормально.
      </p>

      {error && <p className="request-panel__error">{error}</p>}

      {hasSearched && !loading && tickets.length === 0 && !error && (
        <p className="request-panel__empty">Нет результатів.</p>
      )}

      {tickets.length > 0 && (
        <div className="request-panel__results">
          <div className="request-panel__results-header">
            <h4>Тікети</h4>
            <button
              type="button"
              className="tab-button"
              onClick={handleCopyTickets}
            >
              {copyState === "success"
                ? "Скопійовано"
                : copyState === "error"
                ? "Помилка копіювання"
                : "Скопіювати всі TICKET_ID"}
            </button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Тікет ID</th>

                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={`${ticket.TICKET_ID}-${ticket.REF_ID}-${index}`}>
                    <td>{ticket.TICKET_ID}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </aside>
  );
}
