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
  selector: 'app-audit-session',
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
  templateUrl: './audit-session.component.html',
  styleUrl: './audit-session.component.css'
})
export class AuditSessionComponent {
  usuarios = [
    { usuario: 'jdoe', rol: 'Profesor', entrada: '2025-09-16 08:30', salida: '' },
    { usuario: 'mlopez', rol: 'Estudiante', entrada: '2025-09-16 09:00 AM', salida: '2025-09-16 10:10 AM' },
    { usuario: 'agarcia', rol: 'Estudiante', entrada: '2025-09-16 07:45 AM', salida: '2025-09-16 11:30 AM' }
  ];
}
