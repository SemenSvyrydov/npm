import type { Module, Ticket } from "@/lib/types";

type ModuleViewProps = {
  module: Module;
  tickets: Ticket[];
};

const ticketColumns = [
  "Тікет ID",
  "REF_ID",
  "CASE_NUMBER",
  "DESCRIPTION",
  "DT_STATUS",
  "DELIVERED_AT",
  "USER_NAME",
  "CODE"
] as const;

export default function ModuleView({ module, tickets }: ModuleViewProps) {
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
            {ticketColumns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={ticketColumns.length}>Нет данных</td>
            </tr>
          ) : (
            tickets.map((ticket, index) => (
              <tr key={ticket.TICKET_ID || `${ticket.REF_ID}-${index}`}>
                <td>{ticket.TICKET_ID}</td>
                <td>{ticket.REF_ID}</td>
                <td>{ticket.CASE_NUMBER}</td>
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
