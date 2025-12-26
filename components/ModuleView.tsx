import type { Module } from "@/lib/types";

type ModuleViewProps = {
  module: Module;
};

const sampleRows = [
  {
    status: "готово",
    owner: "аналитика",
    updatedAt: "сегодня"
  },
  {
    status: "в процессе",
    owner: "отчеты",
    updatedAt: "2 часа назад"
  }
];

export default function ModuleView({ module }: ModuleViewProps) {
  return (
    <section className="card">
      <h2>{module.name}</h2>
      <p>Результаты запросов по выбранному модулю.</p>
      <div>
        {module.requestTypes.map((requestType) => (
          <span key={requestType} className="request-pill">
            {requestType}
          </span>
        ))}
      </div>
      <table className="table">
        <thead>
          <tr>
            {module.resultSchema.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sampleRows.map((row) => (
            <tr key={`${row.owner}-${row.status}`}>
              <td>{row.status}</td>
              <td>{row.owner}</td>
              <td>{row.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
