export type Tab = {
  id: string;
  title: string;
  moduleId: string;
  isActive: boolean;
};

export type Module = {
  id: string;
  name: string;
  requestTypes: string[];
  resultSchema: string[];
};

export type Ticket = {
  TICKET_ID: string;
  REF_ID: string;
  CASE_NUMBER: string;
  DESCRIPTION: string;
  DT_STATUS: string;
  DELIVERED_AT: string;
  USER_NAME: string;
  CODE: string;
};
