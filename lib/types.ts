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
