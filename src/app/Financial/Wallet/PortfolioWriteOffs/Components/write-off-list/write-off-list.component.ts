import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, debounceTime, forkJoin } from 'rxjs';

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
import { Client } from '../../../CashReceipts/Model';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';

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

  // Lógica para clientes
  private clientsMap = new Map<number, string>();
  clientSuggestions: Client[] = [];
  allClients: Client[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private portfolioWriteOffService: PortfolioWriteOffService,
    private cashReceiptService: CashReceiptService, // Reemplazar con el servicio real de clientes
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
    //this.loadWriteOffs();
    this.loadInitialData();
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
      client: [null], 
      startDate: [null],
      endDate: [null],
      status: [null],
    });
  }

  /**
   * Carga los castigos de cartera desde el servicio y los asigna a las propiedades correspondientes.
   */
  private loadInitialData(): void {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) return;

    forkJoin({
      writeOffs: this.portfolioWriteOffService.getWriteOffsByEnterprise(enterpriseId),
      clients: this.cashReceiptService.getClients('') 
    }).subscribe({
      next: ({ writeOffs, clients }) => {
        // 1. Guardar todos los clientes y crear un mapa para búsqueda rápida
        this.allClients = clients;
        this.clientsMap = new Map(clients.map(c => [c.id, c.name]));

        // 2. Enriquecer los castigos con el nombre del cliente
        this.allWriteOffs = writeOffs.map(wo => ({
          ...wo,
          thirdName: this.clientsMap.get(wo.thirdId) || 'Cliente no encontrado'
        }));

        this.filteredWriteOffs = this.allWriteOffs;
        console.log('Datos iniciales cargados y enriquecidos:', this.allWriteOffs);
      },
      error: (err) => console.error('Error al cargar datos iniciales:', err),
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

    if (filters.client && filters.client.id) {
      tempWriteOffs = tempWriteOffs.filter(wo => wo.thirdId === filters.client.id);
    }

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

  //Método para la búsqueda en el autoComplete
  searchClient(event: any): void {
    const query = event.query.toLowerCase();
    this.clientSuggestions = this.allClients.filter(
      client => client.name.toLowerCase().includes(query)
    );
  }

  goToCreateWriteOff(): void {
    this.router.navigate(['/financial/wallet/write-offs/creation']);
  }

  viewDetails(writeOff: PortfolioWriteOffView): void {
    this.router.navigate(['/financial/wallet/write-offs/details/', writeOff.id]);
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
