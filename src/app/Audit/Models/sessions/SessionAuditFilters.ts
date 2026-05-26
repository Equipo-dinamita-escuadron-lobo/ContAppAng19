
export interface SessionAuditFilters {
  dateFrom: string;  
  dateTo: string;
  userName?: string;
  userRole?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
}

