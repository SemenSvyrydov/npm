"use client";

import type { Module, Ticket } from "@/lib/types";
import { CASE_API_TIMEOUT_SECONDS } from "@/lib/timeouts";

type RequestPanelProps = {
  module: Module;
  docRef: string;
  dbId: string;
  loading: boolean;
  error: string | null;
  tickets: Ticket[];
  hasSearched: boolean;
  onDocRefChange: (value: string) => void;
  onDbIdChange: (value: string) => void;
  onSubmit: () => void;
};

export default function RequestPanel({
  module,
  docRef,
  dbId,
  loading,
  error,
  tickets,
  hasSearched,
  onDocRefChange,
  onDbIdChange,
  onSubmit,
}: RequestPanelProps) {
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
        <p className="request-panel__empty">Нет результатов.</p>
      )}

      {tickets.length > 0 && (
        <div className="request-panel__results">
          <h4>Результаты</h4>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
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
