import { OperationType } from "../enums/OperationType";

export interface ExportOperationFilters {
  dateFrom: string;
  dateTo: string;

  moduleName?: string;
  affectedTable?: string;
  userName?: string;
  userRole?: string;
  operationType?: OperationType;
  registerId?: string;
}