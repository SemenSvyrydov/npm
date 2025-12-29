"use client";

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
};

const formatCount = (current: number, total: number) =>
  total > 0 ? `${current} / ${total}` : "—";

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
}: RequestProgressProps) {
  if (!visible) {
    return null;
  }

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
          <h3>Прогресс запроса</h3>
          <p className="request-progress__subtitle">
            {loading ? "Выполняется..." : "Готово"}
          </p>
        </div>
        <div className="request-progress__meta">
          <span>
            Текущий docRef:{" "}
            {currentDocRef ? currentDocRef : loading ? "ожидание..." : "—"}
          </span>
          <span>Текущий docId: {currentDocId ? currentDocId : "—"}</span>
          <span>Таймер: {loading ? `${elapsedSeconds} сек.` : "—"}</span>
        </div>
      </header>

      <div className="request-progress__grid">
        <div className="request-progress__row">
          <div>
            <p className="request-progress__label">DocRef</p>
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
            <p className="request-progress__label">DocId</p>
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
        <span>Успехи docRef: {progress.successDocRefs}</span>
        <span>Успехи docId: {progress.successDocIds}</span>
        <span>Ошибки: {progress.errorCount}</span>
      </div>

      {reportReady && (
        <div className="request-progress__report">
          <h4>Отчет</h4>
          <p>
            Успешно обработано docRef: {progress.successDocRefs} из{" "}
            {progress.totalDocRefs}.
          </p>
          <p>
            Успешно обработано docId: {progress.successDocIds} из{" "}
            {progress.totalDocIds}.
          </p>
          <p>Количество ошибок: {errors.length}.</p>
          {errors.length > 0 && (
            <ul className="request-progress__errors">
              {errors.map((errorItem, index) => (
                <li key={`${errorItem}-${index}`}>{errorItem}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
