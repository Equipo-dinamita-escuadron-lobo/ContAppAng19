import { OperationType } from "../enums/OperationType";
import { UserRole } from "../enums/UserRole";

export interface ExportOperationFilters {
  dateFrom: string;
  dateTo: string;

  moduleName?: string;
  affectedTable?: string;
  userName?: string;
  userRole?: UserRole;
  operationType?: OperationType;
  registerId?: string;
}