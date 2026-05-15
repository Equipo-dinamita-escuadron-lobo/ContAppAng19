import { UserRole } from "../enums/UserRole";
import { OperationType } from "../enums/OperationType";

export interface OperationAuditFilters {
  dateFrom: string;     
  dateTo: string;       
  moduleName?: string;
  affectedTable?: string;
  userName?: string;
  userRole?: UserRole;    
  operationType?: OperationType; 
  registerId?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
}