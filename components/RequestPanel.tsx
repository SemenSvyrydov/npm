import type { Module } from "@/lib/types";

type RequestPanelProps = {
  module: Module;
  docRef: string;
  dbId: string;
  isLoading: boolean;
  onChangeDocRef: (value: string) => void;
  onChangeDbId: (value: string) => void;
  onSubmit: () => void;
};

export default function RequestPanel({
  module,
  docRef,
  dbId,
  isLoading,
  onChangeDocRef,
  onChangeDbId,
  onSubmit
}: RequestPanelProps) {
  return (
    <aside className="card">
      <h3>Контекстные действия</h3>
      <p>Настройки запросов для модуля: {module.name}.</p>
      <label className="form-field">
        DocRef (через запятую)
        <input
          type="text"
          value={docRef}
          onChange={(event) => onChangeDocRef(event.target.value)}
          placeholder="3461921, 3461922"
        />
      </label>
      <label className="form-field">
        DbId
        <input
          type="text"
          value={dbId}
          onChange={(event) =>
            onChangeDbId(event.target.value.replace(/\D/g, ""))
          }
          placeholder="318"
        />
      </label>
      <button
        type="button"
        className="tab-button tab-button--active"
        onClick={onSubmit}
        disabled={isLoading}
      >
        {isLoading ? "Загрузка..." : "Выполнить запрос"}
      </button>
    </aside>
  );
}
