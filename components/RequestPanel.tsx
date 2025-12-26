import type { Module } from "@/lib/types";

type RequestPanelProps = {
  module: Module;
};

export default function RequestPanel({ module }: RequestPanelProps) {
  return (
    <aside className="card">
      <h3>Контекстные действия</h3>
      <p>Настройки запросов для модуля: {module.name}.</p>
      <ul>
        {module.requestTypes.map((requestType) => (
          <li key={requestType}>Сценарий: {requestType}</li>
        ))}
      </ul>
      <button type="button" className="tab-button tab-button--active">
        Выполнить запрос
      </button>
    </aside>
  );
}
