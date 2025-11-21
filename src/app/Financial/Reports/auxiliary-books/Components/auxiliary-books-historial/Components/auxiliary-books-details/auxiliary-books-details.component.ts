import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { AuxiliaryBooksServiceService } from '../../../../Services/auxiliary-books-service.service';

@Component({
  selector: 'app-auxiliary-books-details',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, TimelineModule],
  templateUrl: './auxiliary-books-details.component.html',
  styleUrls: ['./auxiliary-books-details.component.css'],
})
export class AuxiliaryBooksDetailsComponent implements OnInit {
  bookDetails: any = null;
  logs: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private auxiliaryBookService: AuxiliaryBooksServiceService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('publicId');

    if (id) {
      this.loadBookDetails(id);
    }
  }

  loadBookDetails(publicId: string): void {
    this.bookDetails = this.auxiliaryBookService
      .getLogsByPublicId(publicId)
      .subscribe({
        next: (response) => {
          this.bookDetails = response.data[0].auxiliaryBook;
          this.logs = response.data;
          console.log('Imprimiendo deatlles de libro: ', this.bookDetails);
          console.log('Imprimiendo logs: ', this.logs);
        },
        error: (err) => {
          console.error('Error al cargar los detalles del libro auxiliar', err);
        },
      });
  }

  getLastLogStatus(): any {
    if (this.logs && this.logs.length > 0) {
      return this.logs[this.logs.length - 1].etypeEvent;
    }
  }

  getStatusSeverity(status: any): 'success' | 'warning' | 'danger' | 'info' {
    if (status.includes('SUCCESS')) return 'success';
    if (status.includes('GENERATING')) return 'info';
    if (status.includes('ERROR')) return 'danger';
    return 'warning';
  }
}
