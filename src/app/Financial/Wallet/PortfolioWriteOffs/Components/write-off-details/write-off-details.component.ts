import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PortfolioWriteOffView, WriteOffStatus } from '../../Models';
import { PortfolioWriteOffService } from '../../Services/portfolio-write-off.service';
import { CashReceiptService } from '../../../CashReceipts/Service/cash-receipt.service';
import { of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-write-off-details',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './write-off-details.component.html',
  styleUrl: './write-off-details.component.css',
  providers: [ConfirmationService, MessageService]
})
export class WriteOffDetailsComponent {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private portfolioWriteOffService: PortfolioWriteOffService,
    private cashReceiptService: CashReceiptService) { }

  // Propiedades de estado y enum de estatus
  writeOff?: PortfolioWriteOffView;
  isLoading = true;
  isProcessing = false;
  WriteOffStatus = WriteOffStatus;

  ngOnInit(): void {
    this.loadAndEnrichWriteOffDetails();
  }

  /**
   * Carga los detalles del castigo desde el servicio basado en el ID de la URL.
   * Si no se encuentra el ID, redirige a la lista de castigos.
   */
  private loadAndEnrichWriteOffDetails(): void {
    this.isLoading = true;
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/financial/wallet/write-offs']);
      return;
    }

    this.portfolioWriteOffService.getWriteOffById(+id).pipe(
      // 1. Obtenemos el castigo
      tap(writeOffData => {
        // Guardamos temporalmente los datos
        this.writeOff = writeOffData;
      }),
      // 2. Usamos switchMap para encadenar la siguiente llamada a la API
      switchMap(writeOffData => {
        if (writeOffData && writeOffData.thirdId) {
          return this.cashReceiptService.getClientById(writeOffData.thirdId);
        }
        return of(null);
      })
    ).subscribe({
      next: (client) => {
        if (this.writeOff && client) {
          this.writeOff.thirdName = client.name;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar y enriquecer el detalle del castigo:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información completa del castigo.' });
        this.isLoading = false;
      }
    });
  }
  

  /**
   * Muestra un diálogo de confirmación antes de proceder con la acción de confirmación del castigo.
   * Si el usuario acepta, se llama a `executeConfirmation` para realizar la acción.
   */
  confirmAction(): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea confirmar este castigo? Esta acción es irreversible y afectará la contabilidad.',
      header: 'Confirmación de Castigo',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.executeConfirmation();
      }
    });
  }

  /**
   * Ejecuta la acción de confirmación del castigo llamando al servicio correspondiente.
   * @returns void
   */
  private executeConfirmation(): void {
    if (!this.writeOff) return;
    this.isProcessing = true;
    this.portfolioWriteOffService.confirmWriteOff(this.writeOff.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'El castigo ha sido confirmado correctamente.' });
        this.loadAndEnrichWriteOffDetails();
        this.isProcessing = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar el castigo.' });
        console.error(err);
        this.isProcessing = false;
      }
    });
  }

  /**
   * Muestra un diálogo de confirmación antes de proceder con la acción de anulación del castigo.
   * Si el usuario acepta, se llama a `executeVoid` para realizar la acción.
   * @returns void
   */
  voidAction(): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea anular este castigo? Se revertirán los cambios en la contabilidad y las facturas asociadas.',
      header: 'Anulación de Castigo',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.executeVoid();
      }
    });
  }

  /**
   * Ejecuta la acción de anulación del castigo llamando al servicio correspondiente.
   * @returns void
   */
  private executeVoid(): void {
    if (!this.writeOff) return;
    this.isProcessing = true;
    this.portfolioWriteOffService.voidWriteOff(this.writeOff.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Anulado', detail: 'El castigo ha sido anulado correctamente.' });
        this.loadAndEnrichWriteOffDetails(); // Recargar los datos
        this.isProcessing = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo anular el castigo.' });
        console.error(err);
        this.isProcessing = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/financial/wallet/write-offs']);
  }

  // Helpers para la plantilla
  getStatusSeverity(status: WriteOffStatus): string {
    const severityMap = {
      [WriteOffStatus.CONFIRMED]: 'success',
      [WriteOffStatus.PENDING_CONFIRMATION]: 'warning',
      [WriteOffStatus.VOIDED]: 'danger'
    };
    return severityMap[status] || 'warning';
  }

  getStatusLabel(status: WriteOffStatus): string {
    const labelMap = {
      [WriteOffStatus.CONFIRMED]: 'Confirmado',
      [WriteOffStatus.PENDING_CONFIRMATION]: 'Pendiente',
      [WriteOffStatus.VOIDED]: 'Anulado'
    };
    return labelMap[status] || 'Desconocido';
  }
}
