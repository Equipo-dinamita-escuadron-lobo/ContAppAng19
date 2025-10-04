import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, debounceTime } from 'rxjs';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PortfolioWriteOffService } from '../../Services/portfolio-write-off.service';
import { PortfolioWriteOffView, WriteOffStatus } from '../../Models';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-write-off-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    AutoCompleteModule,
    CalendarModule,
    DropdownModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './write-off-list.component.html',
  styleUrl: './write-off-list.component.css'
})
export class WriteOffListComponent {

  // Propiedades de datos
  allWriteOffs: PortfolioWriteOffView[] = [];
  filteredWriteOffs: PortfolioWriteOffView[] = [];

  // Formulario y filtros
  filterForm!: FormGroup;
  statusOptions: { label: string; value: WriteOffStatus }[];
  private filterSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private portfolioWriteOffService: PortfolioWriteOffService,
    private localStorageMethods: LocalStorageMethods
  ) {
    this.statusOptions = [
      { label: 'Pendiente', value: WriteOffStatus.PENDING_CONFIRMATION },
      { label: 'Confirmado', value: WriteOffStatus.CONFIRMED },
      { label: 'Anulado', value: WriteOffStatus.VOIDED },
    ];
  }

  ngOnInit(): void {
    this.initFilterForm();
    this.loadWriteOffs();
    this.setupAutoFiltering();
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  /**
   * Aplica los filtros del formulario a la lista de castigos de cartera.
   * Filtra por cliente, rango de fechas y estado.
   */
  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      client: [null], // TODO: Reemplazar con el modelo de cliente cuando esté disponible
      startDate: [null],
      endDate: [null],
      status: [null],
    });
  }

  /**
   * Carga los castigos de cartera desde el servicio y los asigna a las propiedades correspondientes.
   */
  private loadWriteOffs(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    this.portfolioWriteOffService.getWriteOffsByEnterprise(enterpriseId).subscribe({
      next: (data) => {
        this.allWriteOffs = data;
        this.filteredWriteOffs = data;
      },
      error: (err) => console.error('Error al cargar castigos de cartera:', err),
    });
  }

  /**
   * Configura la suscripción al formulario de filtros para aplicar los filtros automáticamente con un debounce.
   */
  private setupAutoFiltering(): void {
    this.filterSubscription = this.filterForm.valueChanges
      .pipe(debounceTime(400))
      .subscribe(() => this.applyFilters());
  }

  /**
   * Aplica los filtros del formulario a la lista de castigos de cartera.
   */
  applyFilters(): void {
    const filters = this.filterForm.value;
    let tempWriteOffs = [...this.allWriteOffs];

    // TODO: Lógica de filtro por cliente
    // if (filters.client && filters.client.id) {
    //   tempWriteOffs = tempWriteOffs.filter(wo => wo.clientId === filters.client.id);
    // }

    if (filters.startDate) {
      tempWriteOffs = tempWriteOffs.filter(wo => wo.writeOffDate >= filters.startDate);
    }
    if (filters.endDate) {
      const inclusiveEndDate = new Date(filters.endDate);
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
      tempWriteOffs = tempWriteOffs.filter(wo => wo.writeOffDate < inclusiveEndDate);
    }
    if (filters.status) {
      tempWriteOffs = tempWriteOffs.filter(wo => wo.status === filters.status);
    }

    this.filteredWriteOffs = tempWriteOffs;
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  goToCreateWriteOff(): void {
    // TODO: Reemplazar con la ruta correcta
    this.router.navigate(['/financial/wallet/write-offs/creation']);
  }

  viewDetails(writeOff: PortfolioWriteOffView): void {
    // TODO: Reemplazar con la ruta correcta
    this.router.navigate(['/financial/wallet/write-offs', writeOff.id]);
  }

  getStatusSeverity(status: WriteOffStatus): 'success' | 'warning' | 'danger' {
    switch (status) {
      case WriteOffStatus.CONFIRMED: return 'success';
      case WriteOffStatus.PENDING_CONFIRMATION: return 'warning';
      case WriteOffStatus.VOIDED: return 'danger';
      default: return 'warning';
    }
  }

  getStatusLabel(status: WriteOffStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : 'Desconocido';
  }
}
