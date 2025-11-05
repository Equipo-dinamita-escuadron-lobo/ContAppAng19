import { UserRole } from "../enums/UserRole";

export interface SessionAuditFilters {
  dateFrom: string;  
  dateTo: string;
  userName?: string;
  userRole?: UserRole;
  page?: number;
  size?: number;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
}

