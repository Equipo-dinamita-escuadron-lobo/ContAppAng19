import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  standalone: true,
  selector: 'app-audit-accounting-documents',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ToggleSwitchModule,
    TooltipModule,
    DropdownModule,
    DatePickerModule
  ],
  templateUrl: './audit-accounting-documents.component.html',
  styleUrl: './audit-accounting-documents.component.css'
})
export class AuditAccountingDocumentsComponent {

  documentsData = [
    {numeroDocumento: 'DC-2025-008',razonSocial: 'Proveedor Global SAS',credito: 520000,debito: 520000,fecha: '2025-09-21',empresa: '900111222',usuarioCreacion: 'jlopez',fechaCreacion: '2025-09-21 09:10:00',usuarioModificacion: null,fechaModificacion: null,usuarioAprobacion: 'mrojas',fechaAprobacion: '2025-09-21 10:05:00',usuarioAnulacion: null,fechaAnulacion: null,estado: 'aprobado',tercero: 'T-01001'},
    {numeroDocumento: 'DC-2025-007',razonSocial: 'Cliente Innovatech Ltda.',credito: 150000,debito: 150000,fecha: '2025-09-20',empresa: '900222333',usuarioCreacion: 'cmoreno',fechaCreacion: '2025-09-20 14:00:00',usuarioModificacion: 'cmoreno',fechaModificacion: '2025-09-20 16:20:00', usuarioAprobacion: null,fechaAprobacion: null,usuarioAnulacion: null,fechaAnulacion: null,estado: 'en elaboración',tercero: 'T-01002'},
    {numeroDocumento: 'DC-2025-006',razonSocial: 'Servicios Financieros S.A.',credito: 275000,debito: 275000,fecha: '2025-09-19',empresa: '900333444',usuarioCreacion: 'agarcia',fechaCreacion: '2025-09-19 11:40:00',usuarioModificacion: null,fechaModificacion: null,usuarioAprobacion: 'jlopez',fechaAprobacion: '2025-09-19 12:15:00',usuarioAnulacion: null,fechaAnulacion: null,estado: 'aprobado',tercero: 'T-01003'},
    {numeroDocumento: 'DC-2025-005',razonSocial: 'Transportes Rápidos LTDA',credito: 430000,debito: 430000,fecha: '2025-09-18',empresa: '900444555',usuarioCreacion: 'mrojas',fechaCreacion: '2025-09-18 08:25:00',usuarioModificacion: null,fechaModificacion: null,usuarioAprobacion: null,fechaAprobacion: null,usuarioAnulacion: 'admin',fechaAnulacion: '2025-09-18 10:50:00',estado: 'anulado',tercero: 'T-01004'},
    {numeroDocumento: 'DC-2025-004',razonSocial: 'Proveedor Logística S.A.S.',credito: 360000,debito: 360000,fecha: '2025-09-17',empresa: '900555666',usuarioCreacion: 'cmoreno',fechaCreacion: '2025-09-17 09:30:00',usuarioModificacion: 'cmoreno',fechaModificacion: '2025-09-17 11:00:00',usuarioAprobacion: null,fechaAprobacion: null,usuarioAnulacion: null,fechaAnulacion: null,estado: 'en elaboración',tercero: 'T-01005'},
    {numeroDocumento: 'DC-2025-003',razonSocial: 'Cliente Mercantil SAS',credito: 120000,debito: 120000,fecha: '2025-09-16',empresa: '900666777',usuarioCreacion: 'agarcia',fechaCreacion: '2025-09-16 13:15:00',usuarioModificacion: null,fechaModificacion: null,usuarioAprobacion: 'mrojas',fechaAprobacion: '2025-09-16 14:00:00',usuarioAnulacion: null,fechaAnulacion: null,estado: 'aprobado',tercero: 'T-01006'},
    {numeroDocumento: 'DC-2025-002',razonSocial: 'Proveedor Insumos Médicos',credito: 500000,debito: 500000,fecha: '2025-09-15',empresa: '900777888',usuarioCreacion: 'jlopez',fechaCreacion: '2025-09-15 08:00:00',usuarioModificacion: null,fechaModificacion: null,usuarioAprobacion: null,fechaAprobacion: null,usuarioAnulacion: 'supervisor',fechaAnulacion: '2025-09-15 09:45:00',estado: 'anulado',tercero: 'T-01007'},
    {numeroDocumento: 'DC-2025-001',razonSocial: 'Cliente Consultoría LTDA',credito: 210000,debito: 210000,fecha: '2025-09-14',empresa: '900888999',usuarioCreacion: 'cmoreno',fechaCreacion: '2025-09-14 10:10:00',usuarioModificacion: 'cmoreno',fechaModificacion: '2025-09-14 11:30:00',usuarioAprobacion: null,fechaAprobacion: null,usuarioAnulacion: null,fechaAnulacion: null,estado: 'en elaboración',tercero: 'T-01008'}
  ];


  filtro = {
    fechaInicio: null,
    fechaFin: null,
    usuario: '',
    tipoDocumento: null,
    estado: null,
    operacion: null,
    companyCode: ''
  };

  tiposDocumentos = [

  ];

  estados = [
    { label: 'Todos', value: null },
    { label: 'en elaboración', value: 'en elaboración' },
    { label: 'aprobado', value: 'aprobado' },
    { label: 'anulado', value: 'anulado' }
  ];

  operaciones = [
    { label: 'Todos', value: null },
    { label: 'creación', value: 'creación' },
    { label: 'modificación', value: 'modificación' },
    { label: 'eliminación', value: 'eliminación' },
    { label: 'anulación', value: 'anulación' }
  ];

  roles = [
    { label: 'Todos', value: null },
    { label: 'Administrador', value: 'admin' },
    { label: 'Docente', value: 'docente' },
    { label: 'Estudiante', value: 'estudiante' }
  ];

  documentsFilters: any[] = [];

  applyFilters() {
    // por ahora solo cargamos toda la lista estática
    this.documentsFilters = [...this.documentsData];
  }
}
