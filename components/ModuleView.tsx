import type { Module, Ticket } from "@/lib/types";

type ModuleViewProps = {
  module: Module;
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
};

export default function ModuleView({
  module,
  tickets,
  isLoading,
  error
}: ModuleViewProps) {
  return (
    <section className="card">
      <h2>{module.name}</h2>
      <p>Результаты запросов по выбранному модулю.</p>
      {error ? <p className="error-text">{error}</p> : null}
      {isLoading ? <p>Загрузка данных...</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>ID квитівки</th>
            <th>REF</th>
            <th>Номер дела</th>
            <th>Описание</th>
            <th>Статус</th>
            <th>Доставлено</th>
            <th>Получатель</th>
            <th>Код</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={8}>Нет данных</td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr key={ticket.TICKET_ID}>
                <td>{ticket.TICKET_ID}</td>
                <td>{ticket.REF_ID}</td>
                <td>{ticket.CASE_NUMBER ?? "-"}</td>
                <td>{ticket.DESCRIPTION}</td>
                <td>{ticket.DT_STATUS}</td>
                <td>{ticket.DELIVERED_AT}</td>
                <td>{ticket.USER_NAME}</td>
                <td>{ticket.CODE}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
