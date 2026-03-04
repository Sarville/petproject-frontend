export interface Wish {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedWishes {
  data: Wish[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type LogAction = "CREATE" | "UPDATE" | "DELETE";

export interface WishLog {
  id: string;
  action: LogAction;
  wishId: string;
  wishTitle: string;
  oldValues: { title: string; description: string | null } | null;
  newValues: { title: string; description: string | null } | null;
  createdAt: string;
}

export interface PaginatedLogs {
  data: WishLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestLog {
  id: string;
  method: string;
  url: string;
  body: string | null;
  createdAt: string;
}

export interface PaginatedRequestLogs {
  data: RequestLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
