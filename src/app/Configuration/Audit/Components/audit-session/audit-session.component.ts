import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  standalone: true,
  selector: 'app-audit-session',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    TagModule,
    ToggleSwitchModule,
    TooltipModule,
    ToastModule,
    InputIconModule,
    InputTextModule,
    IconFieldModule,
    DatePickerModule,
    DropdownModule,
  ],
  templateUrl: './audit-session.component.html',
  styleUrl: './audit-session.component.css'
})
export class AuditSessionComponent {

  filtro = {
    fechaInicio: null,
    fechaFin: null,
    rol: null,
    usuario: ''
  };

  roles = [
    { label: 'Todos', value: null },
    { label: 'Administrador', value: 'admin' },
    { label: 'Docente', value: 'docente' },
    { label: 'Estudiante', value: 'estudiante' }
  ];

  usuarios = [
    { usuario: 'jdoe', rol: 'Profesor', entrada: '2025-09-16 08:30', salida: '' },
    { usuario: 'mlopez', rol: 'Estudiante', entrada: '2025-09-16 09:00 AM', salida: '2025-09-16 10:10 AM' },
    { usuario: 'agarcia', rol: 'Estudiante', entrada: '2025-09-16 07:45 AM', salida: '2025-09-16 11:30 AM' }
  ];

  usuariosFiltrados: any[] = [];

  applyFilters() {
    // por ahora solo cargamos toda la lista estática
    this.usuariosFiltrados = [...this.usuarios];
  }

}
