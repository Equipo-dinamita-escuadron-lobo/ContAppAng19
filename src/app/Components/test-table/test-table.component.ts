import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-test-table',
  standalone: true,
  imports: [ButtonModule, CommonModule, TableModule],
  templateUrl: './test-table.component.html',
  styleUrl: './test-table.component.css',
})
export class TestTableComponent {
  cols: any[];
  terceros: any[];

  constructor() {
    this.cols = [
      { field: 'nombre', header: 'Nombre' },
      { field: 'tipoDocumento', header: 'Tipo Documento' },
      { field: 'numeroDocumento', header: 'Número Documento' },
      { field: 'telefono', header: 'Teléfono' },
      { field: 'correo', header: 'Correo Electrónico' },
    ];

    this.terceros = [
      {
        nombre: 'Juan Pérez',
        tipoDocumento: 'CC',
        numeroDocumento: '1012345678',
        telefono: '3123456789',
        correo: 'juan.perez@example.com',
      },
      {
        nombre: 'María Rodríguez',
        tipoDocumento: 'NIT',
        numeroDocumento: '900123456',
        telefono: '3145678901',
        correo: 'maria.rodriguez@empresa.com',
      },
      {
        nombre: 'Carlos Gómez',
        tipoDocumento: 'CE',
        numeroDocumento: 'E12345678',
        telefono: '3109876543',
        correo: 'carlos.gomez@example.org',
      },
    ];
  }
}
