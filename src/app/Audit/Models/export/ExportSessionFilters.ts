import { UserRole } from "../enums/UserRole";
import { ExportFormat } from "./ExportJobResponse";

export interface ExportSessionFilters {
  dateFrom: string;
  dateTo: string;

  userName?: string;
  userRole?: UserRole;
  exportFormat: string;
}