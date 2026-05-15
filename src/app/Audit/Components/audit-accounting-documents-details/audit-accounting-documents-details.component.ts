import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { DocumentEventDetail } from '../../Models/documents/DocumentEventDetail';
import { AuditDocumentEventServiceService } from '../../Services/audit-document-event-service.service';
import {
  getAuditFieldLabel,  
  getAuditValueLabel,
  isAuditFieldVisible
} from '../../Models/config/document-field-config';

export interface DiffRow {
  field: string;
  before: any;
  after: any;
}

export interface DetailView {
  operationType:     string;
  userName:          string;
  userRoles:         string[];
  operationAt:       string;
  renderMode:        'snapshot' | 'diff';
  // Header
  headerEntries:     { key: string; value: any }[];   // snapshot
  headerDiffRows:    DiffRow[];                        // diff
  // Details
  diffDetailGroups:  { lineLabel: string; rows: DiffRow[] }[];  // diff
  snapshotRows:      { key: string; value: any }[][];            // snapshot
  // Totals
  totalsEntries:     { key: string; value: any }[];   // snapshot
  totalsDiffRows:    DiffRow[];                        // diff
  // Metadata — siempre plano
  metadataEntries:   { key: string; value: any }[];
}
/** Operaciones que usan diff en details */
const DIFF_OPERATIONS = new Set(['UPDATE', 'APPROVE']);

@Component({
  selector: 'app-audit-accounting-documents-details',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ToastModule, SkeletonModule],
  providers: [MessageService],
  templateUrl: './audit-accounting-documents-details.component.html',
  styleUrl: './audit-accounting-documents-details.component.css'
})
export class AuditAccountingDocumentsDetailsComponent implements OnInit{

  documentCode = '';
  detailViews: DetailView[] = [];
  loading = false;

  // Exponer helpers al template
  readonly getFieldLabel  = getAuditFieldLabel;
  readonly getValueLabel = getAuditValueLabel;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private auditService: AuditDocumentEventServiceService,
    private messageService: MessageService,
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.documentCode = params.get('documentCode') ?? '';
      if (this.documentCode) {
        this.loadDetails();
      }
    });
  }

  readonly operationLabels: Partial<Record<string, string>> = {
    CREATE: 'Creación',
    UPDATE: 'Actualización',
    APPROVE: 'Aprobación',
    VOID: 'Anulación',
    DELETE: 'Eliminación',
  };

  readonly operationSeverity: Partial<Record<string, string>> = {
    CREATE: 'success',
    UPDATE: 'info',
    APPROVE: 'success',
    VOID: 'warn',
    DELETE: 'danger',
  };
 
  loadDetails(): void {
    this.loading = true;
    this.auditService.getDocumentsEventsDetails(this.documentCode).subscribe({
      next: (data: DocumentEventDetail[]) => {
        this.detailViews = data.map(item => this.toDetailView(item));
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el historial del documento.',
        });
        this.loading = false;
      },
    });
  }

  goBack() {
    this.location.back();
  }
 
  formatInstant(value: string): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private toDetailView(item: DocumentEventDetail): DetailView {
    const data = item.documentData ?? {};

    const hasChanges =
      !!data.header?.changes ||
      !!data.totals?.changes ||
      data.details?.some((d: any) => d.changes);

    const isDiff = hasChanges;

    return {
      operationType: item.operationType,
      userName: item.userName,
      userRoles: item.userRoles ?? [],
      operationAt: item.operationAt,
      renderMode: isDiff ? 'diff' : 'snapshot',

      headerEntries: !isDiff ? this.toEntries(data.header) : [],
      headerDiffRows: isDiff
        ? this.extractChanges(data.header?.['changes'] ?? {})
        : [],

      diffDetailGroups: isDiff
        ? this.toDiffDetailGroups(data.details)
        : [],

      snapshotRows: !isDiff
        ? this.toSnapshotRows(data.details)
        : [],

      totalsEntries: !isDiff
        ? this.toEntries(data.totals)
        : [],

      totalsDiffRows: isDiff
        ? this.totalsDiffRows(data.totals)
        : [],

      metadataEntries: this.toEntries(data.metadata),
    };
  }

  /** Map<string,any> → [{key, value}] filtrando campos ocultos */
  private toEntries(map: Record<string, any> | null | undefined): { key: string; value: any }[] {
    if (!map) return [];
    return Object.entries(map)
      .filter(([key]) => isAuditFieldVisible(key))
      .map(([key, value]) => ({ key, value }));
  }

  /**
   * Para update y approve details = [{field, before, after}, ...]
   * Filtramos campos ocultos también en el nombre del field.
   */
  private toDiffRows(details: Record<string, any>[] | null | undefined): DiffRow[] {
    if (!details?.length) return [];
    return details
      .filter(d => d['field'] !== undefined && isAuditFieldVisible(d['field']))
      .map(d => ({
        field:  d['field'],
        before: d['before'],
        after:  d['after'],
      }));
  }

  /** Para totals diff */
  totalsDiffRows(totals: Record<string, any> | null | undefined): DiffRow[] {
    if (!totals?.['changes']) return [];
    return this.extractChanges(totals['changes']);
  }

  /**
   * Para crear, anular y eliminar: details = [{...campos libres}, ...]
   * Cada elemento del array es una fila (línea del documento).
   */
  private toSnapshotRows(details: Record<string, any>[] | null | undefined): { key: string; value: any }[][] {
    if (!details?.length) return [];
    return details.map(row =>
      Object.entries(row)
        .filter(([key]) => isAuditFieldVisible(key))
        .map(([key, value]) => ({ key, value }))
    );
  }

  /**
   * Para diff de details: cada item puede tener campos planos + un objeto "changes"
   * Retorna un array de grupos: [{lineLabel, rows: DiffRow[]}]
   */
  toDiffDetailGroups(details: Record<string, any>[] | null | undefined):
    { lineLabel: string; rows: DiffRow[] }[] {
    if (!details?.length) return [];
    return details.map((item, idx) => {
      const label = item['invoiceCode'] ?? item['invoiceId'] ?? item['productId'] ?? `Línea ${idx + 1}`;
      const rows  = item['changes'] ? this.extractChanges(item['changes']) : [];
      return { lineLabel: String(label), rows };
    });
  }

  /** Extrae {field, before, after} desde un objeto changes: {campo: {before, after}} */
  private extractChanges(changes: Record<string, any>): DiffRow[] {
    if (!changes) return [];
    return Object.entries(changes)
      .filter(([key]) => isAuditFieldVisible(key))
      .map(([key, val]) => ({
        field:  key,
        before: val['before'],
        after:  val['after'],
      }));
  }

  /** Encabezados de columna dinámicos para la tabla snapshot de details */
  getSnapshotColumns(rows: { key: string; value: any }[][]): string[] {
    if (!rows.length) return [];
    // Tomamos las claves de la primera fila como cabeceras
    return rows[0].map(e => e.key);
  }

  isDiff(item: DetailView): boolean {
    return item.renderMode === 'diff';
  }
}
