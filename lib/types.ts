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
  resultSchema?: string[];
};

export type Ticket = {
  TICKET_ID: string;
  REF_ID: string;
  IDDOC: string;
  CASE_NUMBER: string | null;
  PROC_NUMBER: string | null;
  DESCRIPTION: string;
  DOC_CREATEDAT: string;
  DT_CREATED_AT: string;
  DT_STATUS: string;
  DELIVERED_AT: string;
  USER_ID: string;
  CODE: string;
  USER_NAME: string;
  USER_LINKED_AT: string;
  isPrivate: number;
  PROC_ID: string;
  IDDOCTYPE: string;
};
