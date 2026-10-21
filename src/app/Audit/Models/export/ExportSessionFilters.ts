
import { ExportFormat } from "./ExportJobResponse";

export interface ExportSessionFilters {
  dateFrom: string;
  dateTo: string;

  userName?: string;
  userRole?: string;
  exportFormat: string;
}