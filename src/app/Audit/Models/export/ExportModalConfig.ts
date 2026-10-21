import { Observable } from "rxjs";
import { ExportFormat, ExportType } from "./ExportJobResponse";
import { ExportAppliedFilter } from "./ExportAppliedFilter";


export interface ExportModalConfig {
  type: ExportType;
  title: string;
  infoMessage: string;         
  allowedFormats: ExportFormat[];
  currentFilters: () => Record<string, any>;
  appliedFilters?: () => ExportAppliedFilter[];
  showExtraFilters?: boolean;
  initiateExport: (format: ExportFormat, filters: any) => Observable<{ jobId: string }>;
}