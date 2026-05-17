import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';

import { RolesWithPermissions } from '../../Models/Permission';
import { PermissionsService } from '../../Services/permission.service';

// PDF
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

type PermissionDto = { name: string };
type Grouped = { module: string; permissions: PermissionDto[] };
type RoleVM = RolesWithPermissions & { groupedPermissions: Grouped[] };

@Component({
  selector: 'app-permission-list',
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    DropdownModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.css',
})
export class PermissionListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly permissionsService = inject(PermissionsService);
  private readonly messageService = inject(MessageService);

  // Datos provenientes del servicio, enriquecidos con 'groupedPermissions'
  rolesWithPermissions: RoleVM[] = [];
  loading = false;

  // Selectores
  rolesOptions: { label: string; value: string }[] = [];
  moduleOptionsForRole: { label: string; value: string }[] = [];

  selectedRoleName: string | null = null;
  selectedModule: string | null = null;

  // Resultado filtrado (para el módulo seleccionado)
  displayedPermissions: PermissionDto[] = [];

  ngOnInit(): void {
    this.getRolesWithPermissions();
  }

  getRolesWithPermissions(): void {
    this.loading = true;
    this.permissionsService.getRolesWithPermissions().subscribe({
      next: (data) => {
        const safe = Array.isArray(data) ? data : [];
        this.rolesWithPermissions = safe.map((role) => ({
          ...role,
          groupedPermissions: this.groupPermissions(role.permissions),
        }));

        // Llenar selector de perfiles (solo los que tienen permisos)
        this.rolesOptions = this.rolesWithPermissions
          .filter((r) => (r.groupedPermissions?.length ?? 0) > 0)
          .map((r) => ({ label: r.role, value: r.role }))
          .sort((a, b) =>
            a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }),
          );

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar roles con permisos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los roles con permisos.',
        });
        this.loading = false;
      },
    });
  }

  /** Agrupa permisos por módulo y los ordena alfabéticamente */
  private groupPermissions(permissions: PermissionDto[]): Grouped[] {
    const grouped: Record<string, PermissionDto[]> = {};

    permissions.forEach((perm) => {
      const module = this.findModuleForPermission(perm.name);
      (grouped[module] ||= []).push(perm);
    });

    // Ordenar permisos dentro de cada módulo
    Object.keys(grouped).forEach((m) => {
      grouped[m].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      );
    });

    // Ordenar módulos
    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
      .map((module) => ({ module, permissions: grouped[module] }));
  }

  private findModuleForPermission(permissionName: string): string {
    const modules = [
      'Unidades de Medida',
      'Empresas',
      'Tipos de Productos',
      'Categorias',
      'Productos',
      'Terceros',
      'Inventario PEPS',
      'Catalogo de Cuentas',
      'Bancos',
      'Cuentas Bancarias',
      'Recibos de Caja Cartera',
      'Centros de Costo',
      'Clases de Documentos',
      'Tipos de Documentos',
      'Centro de Ayuda',
      'Metodos de Pago',
      'Impuestos',
      'Castigos de Cartera',
      'Tipos de Identificacion',
      'Etiquetas no Comerciales',
      'Tipos de Terceros',
      'Calendario Contable',
    ];

    const match = modules.find((m) =>
      permissionName.toLowerCase().includes(m.toLowerCase()),
    );
    if (match) return match;

    const words = permissionName.split(' ');
    return words.length > 1
      ? words.slice(-2).join(' ')
      : words[words.length - 1];
  }

  /** Cuando cambia el perfil */
  onRoleChange(): void {
    this.selectedModule = null;
    this.displayedPermissions = [];

    if (!this.selectedRoleName) {
      this.moduleOptionsForRole = [];
      return;
    }

    const role = this.rolesWithPermissions.find(
      (r) => r.role === this.selectedRoleName,
    );
    const modules: string[] = (role?.groupedPermissions?.map((g) => g.module) ??
      []) as string[];

    const uniqueModules: string[] = Array.from(new Set<string>(modules));

    this.moduleOptionsForRole = uniqueModules.map((m: string) => ({
      label: m,
      value: m,
    }));
  }

  /** Cuando cambia el módulo (solo actualiza el panel de resultados) */
  onModuleChange(): void {
    if (!this.selectedRoleName || !this.selectedModule) {
      this.displayedPermissions = [];
      return;
    }

    const role = this.rolesWithPermissions.find(
      (r) => r.role === this.selectedRoleName,
    );
    const group = role?.groupedPermissions?.find(
      (g) => g.module === this.selectedModule,
    );
    this.displayedPermissions = group?.permissions ?? [];
  }

  /** Navega al flujo de creación de permisos */
  assignPermissions(): void {
    this.router.navigate(['/configuration/permissions/create']);
  }

  /** Edita en contexto del perfil seleccionado */
  editSelected(): void {
    if (!this.selectedRoleName) return;
    this.router.navigate([
      '/configuration/permissions/edit',
      this.selectedRoleName,
    ]);
  }

  /** Exporta TODOS los permisos del perfil (todos los módulos) a PDF, agrupando módulo con rowSpan y separadores */
  exportProfilePermissionsToPDF(): void {
    if (!this.selectedRoleName) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin perfil',
        detail: 'Selecciona un perfil para exportar.',
      });
      return;
    }

    const role = this.rolesWithPermissions.find(
      (r) => r.role === this.selectedRoleName,
    );

    if (!role || !(role.groupedPermissions?.length > 0)) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin permisos',
        detail: 'Este perfil no tiene permisos asignados.',
      });
      return;
    }

    // Filas con marca de inicio de bloque y tamaño del bloque (para rowSpan)
    type Row = {
      module: string;
      permiso: string;
      _isFirst: boolean;
      _rowSpan: number;
    };

    const rows: Row[] = [];
    const groupEndRowIdxs: number[] = []; // para dibujar línea gruesa al final del módulo

    role.groupedPermissions.forEach((g) => {
      if (!g?.permissions?.length) return;

      // primera fila del módulo
      rows.push({
        module: g.module,
        permiso: g.permissions[0].name,
        _isFirst: true,
        _rowSpan: g.permissions.length,
      });

      // resto de filas del mismo módulo
      for (let i = 1; i < g.permissions.length; i++) {
        rows.push({
          module: g.module,
          permiso: g.permissions[i].name,
          _isFirst: false,
          _rowSpan: 0,
        });
      }

      groupEndRowIdxs.push(rows.length - 1);
    });

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

    // Encabezado
    const title = `Permisos por perfil`;
    const subtitle = `Perfil: ${this.selectedRoleName}`;
    const date = new Date().toLocaleString('es-CO');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 40, 40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 40, 60);
    doc.text(`Fecha: ${date}`, 40, 78);

    // Tabla con grid + rowSpan + separadores por módulo
    autoTable(doc, {
      startY: 100,
      theme: 'grid', // bordes para todas las celdas
      columns: [
        { header: 'Módulo', dataKey: 'module' },
        { header: 'Permisos', dataKey: 'permiso' },
      ],
      body: rows as unknown as RowInput[],
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 6,
        lineWidth: 0.4,
        valign: 'top',
      },
      headStyles: {
        fillColor: [0, 86, 179], // tu color primario si quieres
        textColor: 255,
        lineWidth: 0.6,
      },
      // sin zebra para que el separador se aprecie mejor
      // alternateRowStyles: undefined,
      columnStyles: {
        module: { cellWidth: 180 },
        permiso: { cellWidth: 'auto' },
      },

      didParseCell: (data) => {
        if (data.section === 'body' && data.column.dataKey === 'module') {
          const raw = data.row.raw as unknown as Row;
          if (raw._isFirst) {
            data.cell.rowSpan = raw._rowSpan;
            data.cell.text = [raw.module];
            data.cell.styles.fontStyle = 'bold'; // módulo en negrita
          } else {
            data.cell.text = [''];
          }
        }
      },

      didDrawCell: (data) => {
        if (data.section !== 'body') return;

        const isLastRowOfGroup = groupEndRowIdxs.includes(data.row.index);
        if (!isLastRowOfGroup) return;

        // Forzamos los tipos de tabla a any para evitar errores de TS
        const table: any = data.table;
        const y = data.cell.y + data.cell.height;
        const x1 = table?.startX ?? 40;
        const x2 = (table?.startX ?? 40) + (table?.width ?? 500);

        const prevWidth = (doc as any).getLineWidth?.() ?? 0.4;
        doc.setLineWidth(1.2);
        doc.setDrawColor(0);
        doc.line(x1, y, x2, y);
        doc.setLineWidth(prevWidth);
      },

      didDrawPage: () => {
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.getWidth();
        const pageHeight = pageSize.getHeight();
        doc.setFontSize(9);
        doc.setTextColor(120);
        const pageText = `Página ${doc.getNumberOfPages()}`;
        doc.text(
          pageText,
          pageWidth - 40 - doc.getTextWidth(pageText),
          pageHeight - 20,
        );
      },

      margin: { left: 40, right: 40 },
    });

    const safeFile = this.selectedRoleName.replace(/[^\w\-]+/g, '_');
    doc.save(`permisos_${safeFile}.pdf`);

    this.messageService.add({
      severity: 'success',
      summary: 'PDF generado',
      detail:
        'Se exportaron los permisos agrupados por módulo con separadores.',
    });
  }
}
