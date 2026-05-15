import { AuditDateType } from "../enums/AuditDateType";
import { DocumentEventAudit } from "./DocumentEventAudit";
import { DocumentEventFilters } from "./DocumentEventFilters";

export interface AuditDocumentsState {
  documents: DocumentEventAudit[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  sortField: string;
  sortOrder: number;

  lastAppliedFilters: DocumentEventFilters | null;

  hasSearched: boolean;
}