"use client";

import { useLocale } from "@/lib/i18n";

type RequestProgressProps = {
  visible: boolean;
  loading: boolean;
  elapsedSeconds: number;
  currentDocRef: string | null;
  currentDocId: string | null;
  progress: {
    totalDocRefs: number;
    processedDocRefs: number;
    totalDocIds: number;
    processedDocIds: number;
    successDocRefs: number;
    successDocIds: number;
    errorCount: number;
  };
  errors: string[];
  emptyTickets: string[];
};

const calcPercent = (current: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

export default function RequestProgress({
  visible,
  loading,
  elapsedSeconds,
  currentDocRef,
  currentDocId,
  progress,
  errors,
  emptyTickets,
}: RequestProgressProps) {
  const { t } = useLocale();

  if (!visible) {
    return null;
  }

  const formatCount = (current: number, total: number) =>
    total > 0
      ? `${current} / ${total}`
      : t("common.placeholder");

  const docRefPercent = calcPercent(
    progress.processedDocRefs,
    progress.totalDocRefs,
  );
  const docIdPercent = calcPercent(
    progress.processedDocIds,
    progress.totalDocIds,
  );
  const reportReady = !loading;

  return (
    <section className="request-progress card">
      <header className="request-progress__header">
        <div>
          <h3>{t("requestProgress.title")}</h3>
          <p className="request-progress__subtitle">
            {loading ? t("requestProgress.running") : t("requestProgress.ready")}
          </p>
        </div>
        <div className="request-progress__meta">
          <span>
            {t("requestProgress.currentDocRef")} {" "}
            {currentDocRef
              ? currentDocRef
              : loading
              ? t("common.waiting")
              : t("common.placeholder")}
          </span>
          <span>
            {t("requestProgress.currentDocId")} {" "}
            {currentDocId ? currentDocId : t("common.placeholder")}
          </span>
          <span>
            {t("requestProgress.timer")} {" "}
            {loading
              ? t("common.secondsShort", { seconds: elapsedSeconds })
              : t("common.placeholder")}
          </span>
        </div>
      </header>

      <div className="request-progress__grid">
        <div className="request-progress__row">
          <div>
            <p className="request-progress__label">
              {t("requestProgress.docRefLabel")}
            </p>
            <p className="request-progress__count">
              {formatCount(progress.processedDocRefs, progress.totalDocRefs)}
            </p>
          </div>
          <div className="request-progress__bar">
            <div
              className="request-progress__bar-fill"
              style={{ width: `${docRefPercent}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="request-progress__percent">{docRefPercent}%</span>
        </div>

        <div className="request-progress__row">
          <div>
            <p className="request-progress__label">
              {t("requestProgress.docIdLabel")}
            </p>
            <p className="request-progress__count">
              {formatCount(progress.processedDocIds, progress.totalDocIds)}
            </p>
          </div>
          <div className="request-progress__bar">
            <div
              className="request-progress__bar-fill request-progress__bar-fill--secondary"
              style={{ width: `${docIdPercent}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="request-progress__percent">{docIdPercent}%</span>
        </div>
      </div>

      <div className="request-progress__stats">
        <span>
          {t("requestProgress.successDocRef", {
            count: progress.successDocRefs,
          })}
        </span>
        <span>
          {t("requestProgress.successDocId", {
            count: progress.successDocIds,
          })}
        </span>
        <span>
          {t("requestProgress.errors", { count: progress.errorCount })}
        </span>
      </div>

      {reportReady && (
        <div className="request-progress__report">
          <h4>{t("requestProgress.reportTitle")}</h4>
          <p>
            {t("requestProgress.reportDocRef", {
              current: progress.successDocRefs,
              total: progress.totalDocRefs,
            })}
          </p>
          <p>
            {t("requestProgress.reportDocId", {
              current: progress.successDocIds,
              total: progress.totalDocIds,
            })}
          </p>
          <p>
            {t("requestProgress.reportErrors", { count: errors.length })}
          </p>
          <p>
            {t("requestProgress.reportEmptyTickets", {
              count: emptyTickets.length,
            })}
          </p>
          {errors.length > 0 && (
            <ul className="request-progress__errors">
              {errors.map((errorItem, index) => (
                <li key={`${errorItem}-${index}`}>{errorItem}</li>
              ))}
            </ul>
          )}
          {emptyTickets.length > 0 && (
            <ul className="request-progress__empty">
              {emptyTickets.map((item, index) => (
                <li key={`${item}-${index}`}>
                  {t("requestProgress.emptyTicketsItem", { item })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
