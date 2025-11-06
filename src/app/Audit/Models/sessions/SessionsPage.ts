import { SessionAudit } from "./SessionAudit";

export interface SessionsPage {
  sessions: SessionAudit[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
