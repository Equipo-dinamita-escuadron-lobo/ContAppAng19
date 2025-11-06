import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';

// Interfaces
interface AuxiliaryBookHistory {
  id: number;
  bookName: string;
  generationDate: Date;
  user: string;
  status: 'Generando' | 'Completado' | 'Error';
}

interface LogEvent {
  status: string;
  date: Date;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-auxiliary-books-details',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, TimelineModule],
  templateUrl: './auxiliary-books-details.component.html',
  styleUrls: ['./auxiliary-books-details.component.css'],
})
export class AuxiliaryBooksDetailsComponent implements OnInit {
  bookDetails: AuxiliaryBookHistory | null = null;
  logs: LogEvent[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBookDetails(+id);
    }
  }

  loadBookDetails(id: number): void {
    // Simulación de llamada a un servicio para obtener los detalles
    const mockData: AuxiliaryBookHistory = {
      id: id,
      bookName: 'Libro Diario',
      generationDate: new Date(),
      user: 'admin@contapp.com',
      status: 'Completado',
    };
    this.bookDetails = mockData;

    // Simulación de logs
    this.logs = [
      {
        status: 'Solicitud Recibida',
        date: new Date(Date.now() - 5 * 60000),
        icon: 'pi pi-inbox',
        color: '#9C27B0',
        description: 'Se recibió la solicitud para generar el reporte.',
      },
      {
        status: 'Generando Reporte',
        date: new Date(Date.now() - 4 * 60000),
        icon: 'pi pi-cog',
        color: '#673AB7',
        description: 'El sistema comenzó a procesar los datos para el reporte.',
      },
      {
        status: 'Reporte Completado',
        date: new Date(),
        icon: 'pi pi-check',
        color: '#4CAF50',
        description:
          'El reporte se generó exitosamente y está listo para descargar.',
      },
    ];
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    if (status === 'Completado') return 'success';
    if (status === 'Generando') return 'info';
    if (status === 'Error') return 'danger';
    return 'warning';
  }
}
