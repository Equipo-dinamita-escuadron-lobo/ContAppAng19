import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  standalone: true,
  selector: 'app-audit-operations',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    TagModule,
    ToggleSwitchModule,
    ConfirmDialog,
    TooltipModule,
    ToastModule,
    InputIconModule,
    InputTextModule,
    IconFieldModule,
  ],
  templateUrl: './audit-operations.component.html',
  styleUrl: './audit-operations.component.css'
})
export class AuditOperationsComponent {
  operaciones = [
    { usuario: 'jdoe', rol: 'Docente', fecha: '09/16/2025 08:15 AM', empresa: '900123456', tabla: 'usuarios', codigo: 'USR001', operacion: 'creación', datos: 'USR001 - Juan Pérez' },
    { usuario: 'mlopez', rol: 'Docente', fecha: '09/16/2025 09:20 AM', empresa: '900123456', tabla: 'productos', codigo: 'PRD001', operacion: 'modificación', datos: 'PRD001 - Laptop Dell' },
    { usuario: 'agarcia', rol: 'Estudiante', fecha: '09/16/2025 10:05 AM', empresa: '900987654', tabla: 'terceros', codigo: 'TER001', operacion: 'creación', datos: 'TER001 - Carlos Gómez' },
    { usuario: 'bfernandez', rol: 'Estudiante', fecha: '09/16/2025 11:45 AM', empresa: '900654321', tabla: 'empresa', codigo: 'EMP001', operacion: 'eliminación', datos: 'EMP001 - Compañía XYZ' },
    { usuario: 'lrodriguez', rol: 'Estudiante', fecha: '09/16/2025 12:10 PM', empresa: '900555222', tabla: 'productos', codigo: 'PRD002', operacion: 'anulación', datos: 'PRD002 - Teclado Logitech' },
    { usuario: 'mcastro', rol: 'Estudiante', fecha: '09/16/2025 01:30 PM', empresa: '900222111', tabla: 'usuarios', codigo: 'USR002', operacion: 'modificación', datos: 'USR002 - Ana Torres' },
    { usuario: 'jsanchez', rol: 'Estudiante', fecha: '09/16/2025 02:05 PM', empresa: '900777333', tabla: 'tipo producto', codigo: 'TPO001', operacion: 'creación', datos: 'TPO001 - Electrónicos' },
    { usuario: 'arodriguez', rol: 'Estudiante', fecha: '09/16/2025 02:50 PM', empresa: '900888444', tabla: 'productos', codigo: 'PRD003', operacion: 'creación', datos: 'PRD003 - Silla Gamer' },
    { usuario: 'dmartinez', rol: 'Estudiante', fecha: '09/16/2025 03:40 PM', empresa: '900321123', tabla: 'terceros', codigo: 'TER002', operacion: 'modificación', datos: 'TER002 - María Ruiz' },
    { usuario: 'hgutierrez', rol: 'Estudiante', fecha: '09/16/2025 04:25 PM', empresa: '900456789', tabla: 'usuarios', codigo: 'USR003', operacion: 'eliminación', datos: 'USR003 - Pedro López' },
    { usuario: 'cvalencia', rol: 'Estudiante', fecha: '09/16/2025 05:15 PM', empresa: '900147258', tabla: 'empresa', codigo: 'EMP002', operacion: 'creación', datos: 'EMP002 - Servicios ABC' },
    { usuario: 'jperez', rol: 'Estudiante', fecha: '09/16/2025 06:10 PM', empresa: '900963852', tabla: 'productos', codigo: 'PRD004', operacion: 'modificación', datos: 'PRD004 - Monitor Samsung' },
    { usuario: 'fcardenas', rol: 'Estudiante', fecha: '09/16/2025 07:25 PM', empresa: '900159357', tabla: 'tipo producto', codigo: 'TPO002', operacion: 'eliminación', datos: 'TPO002 - Hogar' },
    { usuario: 'mramirez', rol: 'Estudiante', fecha: '09/16/2025 08:05 PM', empresa: '900753159', tabla: 'terceros', codigo: 'TER003', operacion: 'creación', datos: 'TER003 - Luis Herrera' },
    { usuario: 'rquintero', rol: 'Estudiante', fecha: '09/16/2025 09:00 PM', empresa: '900852456', tabla: 'productos', codigo: 'PRD005', operacion: 'anulación', datos: 'PRD005 - Mouse Razer' },
  ];
}
