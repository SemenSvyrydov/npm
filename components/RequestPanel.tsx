"use client";

import { useState } from "react";
import type { Module, Ticket } from "@/lib/types";
import { CASE_API_TIMEOUT_SECONDS } from "@/lib/timeouts";
import { locales, useLocale } from "@/lib/i18n";

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

const localeLabels = {
  ru: "language.ru",
  uk: "language.uk",
} as const;

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
  const { locale, setLocale, t } = useLocale();
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
      <div className="request-panel__header">
        <h3>{t("requestPanel.title")}</h3>
        <div className="request-panel__locale">
          <span>{t("language.label")}</span>
          <div className="request-panel__locale-buttons">
            {locales.map((option) => (
              <button
                key={option}
                type="button"
                className={`tab-button ${
                  locale === option ? "tab-button--active" : ""
                }`}
                onClick={() => setLocale(option)}
              >
                {t(localeLabels[option])}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p>
        {t("requestPanel.settings", {
          module: module.name,
        })}
      </p>

      <div className="request-panel__inputs">
        <label className="request-panel__label">
          {t("requestPanel.docRefLabel")}
          <textarea
            value={docRef}
            onChange={(event) => onDocRefChange(event.target.value)}
            placeholder={t("requestPanel.docRefPlaceholder")}
            rows={4}
          />
        </label>
        <label className="request-panel__label">
          {t("requestPanel.dbIdLabel")}
          <input
            type="text"
            value={dbId}
            onChange={(event) => onDbIdChange(event.target.value)}
            inputMode="numeric"
            pattern="\\d*"
            placeholder={t("requestPanel.dbIdPlaceholder")}
          />
        </label>
      </div>

      <button
        type="button"
        className="tab-button tab-button--active"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading
          ? t("requestPanel.submitLoading")
          : t("requestPanel.submitIdle")}
      </button>
      <p className="request-panel__hint">
        {t("requestPanel.hint", { seconds: CASE_API_TIMEOUT_SECONDS })}
      </p>

      {error && <p className="request-panel__error">{error}</p>}

      {hasSearched && !loading && tickets.length === 0 && !error && (
        <p className="request-panel__empty">{t("requestPanel.noResults")}</p>
      )}

      {tickets.length > 0 && (
        <div className="request-panel__results">
          <div className="request-panel__results-header">
            <h4>{t("requestPanel.ticketsTitle")}</h4>
            <button
              type="button"
              className={`tab-button request-panel__copy-button ${
                copyState === "success"
                  ? "request-panel__copy-button--success"
                  : copyState === "error"
                  ? "request-panel__copy-button--error"
                  : ""
              }`}
              onClick={handleCopyTickets}
            >
              {copyState === "success"
                ? t("requestPanel.copySuccess")
                : copyState === "error"
                ? t("requestPanel.copyError")
                : t("requestPanel.copyAll")}
            </button>
          </div>
          <p className="request-panel__results-count">
            {t("requestPanel.ticketsCount", { count: tickets.length })}
          </p>
          <p className="request-panel__results-hint">
            {t("requestPanel.copyHint")}
          </p>
        </div>
      )}
    </aside>
  );
}
