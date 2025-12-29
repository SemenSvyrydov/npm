"use client";

import type { Module, Ticket } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

type ModuleViewProps = {
  module: Module;
  tickets: Ticket[];
};

export default function ModuleView({ module, tickets }: ModuleViewProps) {
  const { t } = useLocale();

  const ticketColumns = [
    t("ticketColumns.ticketId"),
    t("ticketColumns.refId"),
    t("ticketColumns.caseNumber"),
    t("ticketColumns.description"),
    t("ticketColumns.dtStatus"),
    t("ticketColumns.deliveredAt"),
    t("ticketColumns.userName"),
    t("ticketColumns.code"),
  ] as const;

  return (
    <section className="card">
      <h2>{module.name}</h2>
      <p>{t("moduleView.description")}</p>
      <div>
        {module.requestTypes.map((requestType) => (
          <span key={requestType} className="request-pill">
            {requestType}
          </span>
        ))}
      </div>
      <div className="table-wrapper">
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
                <td colSpan={ticketColumns.length}>
                  {t("moduleView.noTickets")}
                </td>
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
      </div>
    </section>
  );
}
