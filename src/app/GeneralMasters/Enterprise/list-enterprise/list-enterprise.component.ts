import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import { EnterpriseService } from '../services/enterprise.service';
import { EnterpriseList } from '../models/EnterpriseList';
import { HeaderComponent } from '../../../Core/Components/Header/header.component';
import { MessageService } from 'primeng/api';

import {
  LocalStorageMethods,
  EntData,
} from '../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-list-enterprise',
  standalone: true,
  providers: [MessageService],
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    DialogModule,
    MenuModule,
    FormsModule,
    HeaderComponent,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DropdownModule,
  ],
  templateUrl: './list-enterprise.component.html',
  styleUrls: ['./list-enterprise.component.css'],
})
export class ListEnterpriseComponent implements OnInit {
  enterprises: EnterpriseList[] = [];
  filteredEnterprises: EnterpriseList[] = [];
  archivedEnterprises: EnterpriseList[] = [];

  // Estado para manejar el archivo seleccionado
  selectedJsonFile: File | null = null;
  showImportModal: boolean = false;

  selectedStatus: string = 'active';
  searchTerm: string = '';

  showPdfModal: boolean = false;
  selectedPdfFile: File | null = null;

  showInactivateModal: boolean = false;
  enterpriseToInactivate: EnterpriseList | null = null;

  showDeleteModal: boolean = false;
  enterpriseToDelete: EnterpriseList | null = null;

  menuItems: any[] = [];
  selectedEnterpriseForMenu: EnterpriseList | null = null;

  LocalStorageMethods = new LocalStorageMethods();
  entData: EntData | null = null;

  showShareModal = false;
  selectedEnterpriseToShare: EnterpriseList | null = null;
  emailList: string[] = [];
  newEmail: string = '';

  showExportLoadingModal: boolean = false;
  exportProgress: number = 0;
  exportEnterpriseName: string = '';
  private exportTimeout: any;
  private exportInterval: any;

  selectedZipFile: File | null = null;
  showImportLoadingModal: boolean = false;
  importProgress: number = 0;
  importEmpresaDestino: string = '';

  constructor(
    private enterpriseService: EnterpriseService,
    private router: Router,
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token'); // o como lo guardas
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Roles de realm:', payload.realm_access.roles);
      console.log('Roles de cliente:', payload.resource_access);
    }

    this.getEnterprises();
    this.getArchivedEnterprises();
  }

  /* ==================== FETCH ==================== */
  // getEnterprises() {
  //   this.enterpriseService.getEnterprisesActive().subscribe({
  //     next: (data: EnterpriseList[]) => {
  //       console.log('Enterprises fetched:', data);
  //       this.enterprises = data;
  //       this.filteredEnterprises = [...this.enterprises];
  //     },
  //     error: (err) => console.error('Error fetching enterprises:', err),
  //   });
  // }

  getEnterprises() {
    this.enterpriseService.getEnterprisesActive('Profesor').subscribe({
      next: (data: EnterpriseList[]) => {
        console.log('Enterprises fetched:', data);
        this.enterprises = data;
        this.filteredEnterprises = [...this.enterprises];
      },
      error: (err) => console.error('Error fetching enterprises:', err),
    });
  }

  getArchivedEnterprises() {
    this.enterpriseService.getEnterprisesInactive().subscribe({
      next: (data: EnterpriseList[]) => {
        this.archivedEnterprises = data;
      },
      error: (err) =>
        console.error('Error fetching archived enterprises:', err),
    });
  }

  /* ==================== FILTROS ==================== */
  filterEnterprises() {
    if (!this.searchTerm) {
      this.filteredEnterprises = [...this.enterprises];
    } else {
      this.filteredEnterprises = this.enterprises.filter((e) =>
        e.name.toLowerCase().includes(this.searchTerm.toLowerCase()),
      );
    }
  }

  selectEnterpriseStatus() {
    if (this.selectedStatus === 'active') {
      this.getEnterprises();
    } else if (this.selectedStatus === 'inactive') {
      this.getArchivedEnterprises();
    }
  }

  /* ==================== MENÚ DE TRES PUNTOS ==================== */
  openMenu(enterprise: EnterpriseList, menu: any, event: Event) {
    this.selectedEnterpriseForMenu = enterprise;
    this.menuItems = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.editEnterprise(this.selectedEnterpriseForMenu!),
      },
      {
        label: 'Duplicar',
        icon: 'pi pi-copy',
        command: () =>
          this.duplicateEnterprise(this.selectedEnterpriseForMenu!),
      },
      {
        label: 'Exportar',
        icon: 'pi pi-download',
        command: () => this.startExport(this.selectedEnterpriseForMenu!),
      },
      {
        label: 'Compartir',
        icon: 'pi pi-save',
        command: () => this.shareEnterprise(this.selectedEnterpriseForMenu!),
      },
      {
        label: 'Inactivar',
        icon: 'pi pi-folder',
        command: () => this.InactiveEnterprise(this.selectedEnterpriseForMenu!),
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.deleteEnterprise(this.selectedEnterpriseForMenu!),
      },
    ];
    menu.toggle(event);
  }

  /* ==================== SELECCIÓN ==================== */
  saveSelectedEnterprise(enterprise: EnterpriseList) {
    if (enterprise.id == null) return;

    this.entData = {
      id: String(enterprise.id),
      name: enterprise.name,
      nit: enterprise.nit,
      logo: enterprise.logo ?? '',
    };

    this.LocalStorageMethods.saveEnterpriseData(this.entData);
  }

  onCreateEnterprise(): void {
    this.router.navigate(['/enterprise/create']);
  }

  onListSubjects(): void {
    this.router.navigate(['/subjects/list']);
  }

  /* ==================== PROCESOS DE COPIA ==================== */
  goToCopyProcesses(): void {
    this.router.navigate(['/enterprise/copy-processes']);
  }

  /* ==================== ABRIR ARCHIVADAS ==================== */
  openArchivedEnterpriseFolder() {
    // Navega al componente de archivadas
    this.router.navigate(['/enterprise/archive']);
  }

  /* ==================== PDF ==================== */
  showPdfRutModal(): void {
    this.showPdfModal = true;
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    this.selectedPdfFile = null;
  }

  onPdfFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdfFile = file;
    } else {
      console.error('Por favor selecciona un archivo PDF válido');
      this.selectedPdfFile = null;
    }
  }

  createEnterpriseFromPdf(): void {
    if (!this.selectedPdfFile) return;

    const formData = new FormData();
    formData.append('pdf', this.selectedPdfFile);

    this.http
      .post(`${environment.API_URL}enterprises/create-from-pdf`, formData)
      .subscribe({
        next: () => {
          this.closePdfModal();
          this.getEnterprises();
        },
        error: (err) => console.error('Error al crear empresa desde PDF:', err),
      });
  }

  /* ==================== ACCIONES ==================== */
  editEnterprise(enterprise: EnterpriseList) {
    this.saveSelectedEnterprise(enterprise);
    this.router.navigate(['/enterprise/edit']);
  }

  duplicateEnterprise(enterprise: EnterpriseList) {
    if (!enterprise.id) return;

    // Obtener los datos de la empresa a duplicar
    this.enterpriseService.getEnterpriseById(String(enterprise.id)).subscribe({
      next: (data) => {
        // Transformar los datos para cumplir con el formato esperado por el backend
        const duplicatedEnterprise = {
          name: `${data.name} (copia)`,
          nit: data.nit,
          dv: data.dv,
          phone: data.phone,
          branch: data.branch,
          email: data.email,
          logo: data.logo,
          mainActivity: data.mainActivity,
          secondaryActivity: data.secondaryActivity,
          taxLiabilities: data.taxLiabilities.map((t: any) => t.id || t), // Extraer IDs
          // state: data.state,
          taxPayerType: data.taxPayerType.id || data.taxPayerType, // Extraer ID
          enterpriseType: data.enterpriseType.id || data.enterpriseType, // Extraer ID
          personType: {
            type: data.personType.type,
            name: data.personType.name,
            surname: data.personType.surname,
            bussinessName: data.personType.bussinessName,
          },
          location: {
            address: data.location.address,
            city: data.location.city.id || data.location.city, // Extraer ID
            department: data.location.department.id || data.location.department, // Extraer ID
            country: data.location.country.id || data.location.country, // Extraer ID
          },
        };

        console.log('Datos enviados para duplicar:', duplicatedEnterprise);

        // Enviar los datos duplicados para crear una nueva empresa
        this.enterpriseService
          .createEnterprise(duplicatedEnterprise)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Duplicada',
                detail: `${data.name} fue duplicada exitosamente.`,
              });
              this.getEnterprises(); // Actualizar la lista de empresas
            },
            error: (err) => {
              console.error('Error al duplicar empresa:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo duplicar la empresa. Verifica los datos.',
              });
            },
          });
      },
      error: (err) =>
        console.error('Error al obtener datos de la empresa:', err),
    });
  }

  backupEnterprise(enterprise: EnterpriseList) {
    if (!enterprise.id) return;

    // Obtener los datos de la empresa
    this.enterpriseService.getEnterpriseById(String(enterprise.id)).subscribe({
      next: (data) => {
        // Transformar los datos para cumplir con el formato esperado por el backend
        const enterpriseData = {
          name: data.name,
          nit: data.nit,
          dv: data.dv,
          phone: data.phone,
          branch: data.branch,
          email: data.email,
          logo: data.logo,
          mainActivity: data.mainActivity,
          secondaryActivity: data.secondaryActivity,
          taxLiabilities: data.taxLiabilities.map((t: any) => t.id || t), // Extraer IDs
          // state: data.state,
          taxPayerType: data.taxPayerType.id || data.taxPayerType, // Extraer ID
          enterpriseType: data.enterpriseType.id || data.enterpriseType, // Extraer ID
          personType: {
            type: data.personType.type,
            name: data.personType.name,
            surname: data.personType.surname,
            bussinessName: data.personType.bussinessName,
          },
          location: {
            address: data.location.address,
            city: data.location.city.id || data.location.city, // Extraer ID
            department: data.location.department.id || data.location.department, // Extraer ID
            country: data.location.country.id || data.location.country, // Extraer ID
          },
        };

        // Crear un archivo JSON y descargarlo
        const jsonString = JSON.stringify(enterpriseData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.name}.json`; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Copia de seguridad',
          detail: `Se descargó la copia de seguridad de ${data.name}.`,
        });
      },
      error: (err) => {
        console.error('Error al obtener datos de la empresa:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar la copia de seguridad.',
        });
      },
    });
  }

  openArchivedEnterprise(enterprise: EnterpriseList) {
    this.saveSelectedEnterprise(enterprise);
    this.router.navigate(['/enterprise/archive']);
  }

  /* ==================== COMPARTIR EMPRESA ==================== */
  shareEnterprise(enterprise: EnterpriseList) {
    if (!enterprise.id) return;

    this.selectedEnterpriseToShare = enterprise;
    this.showShareModal = true; // 👈 abre el modal
  }

  /* ==================== AGREGAR CORREO ==================== */
  addEmail() {
    if (!this.newEmail.trim()) return;

    // Validar formato del correo
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.newEmail)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Correo inválido',
        detail: 'Por favor ingresa un correo válido.',
      });
      return;
    }

    // Evitar duplicados
    if (this.emailList.includes(this.newEmail.trim())) {
      this.messageService.add({
        severity: 'info',
        summary: 'Duplicado',
        detail: 'Este correo ya fue agregado.',
      });
      return;
    }

    this.emailList.push(this.newEmail.trim());
    this.newEmail = '';
  }

  /* ==================== ELIMINAR CORREO ==================== */
  removeEmail(index: number) {
    this.emailList.splice(index, 1);
  }

  /* ==================== CANCELAR COMPARTIR ==================== */
  closeShareModal() {
    this.showShareModal = false;
    this.emailList = [];
    this.newEmail = '';
    this.selectedEnterpriseToShare = null;
  }

  /* ==================== CONFIRMAR COMPARTIR ==================== */
  confirmShare() {
    if (!this.selectedEnterpriseToShare?.id) return;

    const payload = {
      enterpriseId: this.selectedEnterpriseToShare.id,
      emails: this.emailList,
    };

    // Aquí puedes conectar con el backend
    this.enterpriseService.shareEnterprise(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Compartida',
          detail: 'La empresa fue compartida exitosamente.',
        });
        this.closeShareModal();
      },
      error: (err) => {
        console.error('Error al compartir empresa:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo compartir la empresa.',
        });
      },
    });
  }

  /* ==================== INACTIVAR ==================== */
  InactiveEnterprise(enterprise: EnterpriseList) {
    this.enterpriseToInactivate = enterprise;
    this.showInactivateModal = true;
  }

  cancelInactivate() {
    this.enterpriseToInactivate = null;
    this.showInactivateModal = false;
  }

  confirmInactivate() {
    if (!this.enterpriseToInactivate || !this.enterpriseToInactivate.id) return;

    this.enterpriseService
      .archiveEnterprise(String(this.enterpriseToInactivate.id))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Inactivada',
            detail: `La empresa ${this.enterpriseToInactivate?.name} fue inactivada exitosamente.`,
          });
          this.showInactivateModal = false;
          this.enterpriseToInactivate = null;
          this.getEnterprises();
          this.getArchivedEnterprises();
        },
        error: (err) => {
          console.error('Error al inactivar la empresa:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo inactivar la empresa.',
          });
        },
      });
  }

  /* ==================== ELIMINAR ==================== */
  deleteEnterprise(enterprise: EnterpriseList) {
    this.enterpriseToDelete = enterprise;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.enterpriseToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.enterpriseToDelete || !this.enterpriseToDelete.id) return;

    this.enterpriseService
      .deleteEnterpriseHard(String(this.enterpriseToDelete.id))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: `La empresa ${this.enterpriseToDelete?.name} fue Eliminada exitosamente.`,
          });
          this.showDeleteModal = false;
          this.enterpriseToDelete = null;
          this.getEnterprises();
          this.getArchivedEnterprises();
        },
        error: (err) => {
          console.error('Error al eliminar la empresa:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la empresa.',
          });
        },
      });
  }
  // confirmDelete(){
  //   if (!enterprise.id) return;

  //   this.enterpriseService
  //     .deleteEnterpriseHard(String(enterprise.id))
  //     .subscribe({
  //       next: () => {
  //         this.enterprises = this.enterprises.filter(
  //           (e) => e.id !== enterprise.id
  //         );
  //         this.filteredEnterprises = this.filteredEnterprises.filter(
  //           (e) => e.id !== enterprise.id
  //         );

  //         this.messageService.add({
  //           severity: 'success',
  //           summary: 'Eliminada',
  //           detail: `La empresa ${enterprise.name} fue eliminada permanentemente.`,
  //         });
  //       },
  //       error: (err) => {
  //         console.error('Error al eliminar la empresa:', err);
  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Error',
  //           detail: 'No se pudo eliminar la empresa.',
  //         });
  //       },
  //     });
  // }

  // == ================== EXPORTAR EMPRESA ==================== */

  // exportEnterprise(enterprise: EnterpriseList) {
  //   if (!enterprise.id) return;

  //   // Llamar al nuevo método que retorna el JSON listo para exportar
  //   this.enterpriseService
  //     .getEnterpriseExportData(String(enterprise.id))
  //     .subscribe({
  //       next: (data) => {
  //         // TODO: Validar estructura si es necesario
  //         const jsonString = JSON.stringify(data, null, 2);
  //         const blob = new Blob([jsonString], { type: 'application/json' });
  //         const url = window.URL.createObjectURL(blob);
  //         const a = document.createElement('a');
  //         a.href = url;
  //         a.download = `${data.name || 'empresa'}.json`;
  //         a.click();
  //         window.URL.revokeObjectURL(url);
  //       },
  //       error: (err) => {
  //         console.error('Error al obtener los datos de la empresa:', err);
  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Error',
  //           detail: 'No se pudo exportar la empresa.',
  //         });
  //       },
  //     });
  // }

  exportEnterprise(enterprise: EnterpriseList) {
    this.exportEnterpriseName = enterprise.name || 'empresa';
    this.showExportLoadingModal = true;
    this.exportProgress = 0;

    const totalDuration = 4000; // 4 segundos
    const intervalTime = 100; // cada 100 ms
    const increment = 100 / (totalDuration / intervalTime);

    if (this.exportInterval) {
      clearInterval(this.exportInterval);
    }

    if (this.exportTimeout) {
      clearTimeout(this.exportTimeout);
    }

    this.exportInterval = setInterval(() => {
      this.exportProgress += increment;

      if (this.exportProgress >= 100) {
        this.exportProgress = 100;
        clearInterval(this.exportInterval);
      }
    }, intervalTime);

    this.exportTimeout = setTimeout(() => {
      this.showExportLoadingModal = false;
      this.exportProgress = 0;
    }, totalDuration);
  }

  onImportEnterprise(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip';

    input.addEventListener('change', (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      this.selectedZipFile = file;
      this.confirmImport();
    });

    input.click();
  }

  confirmImport(): void {
    if (!this.selectedZipFile) return;

    const empresaDestino = crypto.randomUUID();
    this.importProgress = 10;
    this.showImportLoadingModal = true;

    this.enterpriseService
      .restoreFromZipUpload(this.selectedZipFile, empresaDestino)
      .subscribe({
        next: (process) => {
          this.importProgress = 20;

          const pollingInterval = setInterval(() => {
            this.enterpriseService.getCopyProcessStatus(process.idProceso).subscribe({
              next: (updated) => {
                if (updated.estado === 'EN_PROCESO' && updated.faseActual) {
                  this.importProgress = Math.min(20 + (updated.faseActual * 18), 90);
                }
                if (updated.estado === 'COMPLETADO') {
                  clearInterval(pollingInterval);
                  this.importProgress = 100;
                  setTimeout(() => {
                    this.showImportLoadingModal = false;
                    this.selectedZipFile = null;
                    this.importEmpresaDestino = '';
                    this.messageService.add({
                      severity: 'success',
                      summary: 'Importación completada',
                      detail: 'La empresa fue restaurada correctamente.',
                    });
                  }, 500);
                } else if (
                  updated.estado === 'ERROR' ||
                  updated.estado === 'FALLIDO' ||
                  updated.estado === 'CANCELADO'
                ) {
                  clearInterval(pollingInterval);
                  this.showImportLoadingModal = false;
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error de importación',
                    detail: updated.errorResumen || `El proceso terminó con estado: ${updated.estado}`,
                  });
                }
              },
              error: () => {
                clearInterval(pollingInterval);
                this.showImportLoadingModal = false;
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudo consultar el estado del proceso.',
                });
              },
            });
          }, 2000);
        },
        error: (err) => {
          this.showImportLoadingModal = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error de importación',
            detail: 'No se pudo subir el archivo ZIP.',
          });
          console.error('Error al importar ZIP:', err);
        },
      });
  }


  /* ==================== exportacion  ==================== */
  /* ==================== exportacion  ==================== */
  showExportErrorModal: boolean = false;

  onImageError(event: any) {
    console.error('Error loading image:', event);
  }

  onImageLoad(enterprise: EnterpriseList) {
    console.log(
      'Imagen cargada correctamente:',
      enterprise.name,
      enterprise.logo,
    );
  }

  startExport(enterprise: EnterpriseList) {
    if (!enterprise.id) return;

    this.exportEnterpriseName = enterprise.name || 'empresa';
    this.exportProgress = 0;
    this.showExportLoadingModal = true;
    this.showExportErrorModal = false;

    // Crear proceso BACKUP
    this.enterpriseService.startBackupProcess(String(enterprise.id)).subscribe({
      next: (process) => {
        // Incrementar progreso mientras se espera
        let progress = 10;
        this.exportProgress = progress;

        // Polling para esperar a que se complete
        const pollingInterval = setInterval(() => {
          this.enterpriseService.getCopyProcessStatus(process.idProceso).subscribe({
            next: (updatedProcess) => {
              // Progreso real basado en faseActual (1-4 fases = 20-95%)
              if (updatedProcess.estado === 'EN_PROCESO' && updatedProcess.faseActual) {
                this.exportProgress = Math.min(20 + (updatedProcess.faseActual * 18), 90);
              }

              if (updatedProcess.estado === 'COMPLETADO') {
                clearInterval(pollingInterval);
                this.exportProgress = 100;
                setTimeout(() => {
                  this.downloadBackup(process.idProceso, enterprise.name || 'empresa');
                }, 500);
              } else if (
                updatedProcess.estado === 'ERROR' ||
                updatedProcess.estado === 'FALLIDO' ||
                updatedProcess.estado === 'CANCELADO'
              ) {
                clearInterval(pollingInterval);
                this.showExportLoadingModal = false;
                this.showExportErrorModal = true;

                const detalle = updatedProcess.errorResumen || `El proceso terminó con estado: ${updatedProcess.estado}`;
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error de exportación',
                  detail: detalle,
                });
              }
            },
            error: (err) => {
              clearInterval(pollingInterval);
              this.showExportLoadingModal = false;
              this.showExportErrorModal = true;

              console.error('Error al consultar estado del proceso:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo consultar el estado del proceso.',
              });
            },
          });
        }, 2000);
      },
      error: (err) => {
        this.showExportLoadingModal = false;
        this.showExportErrorModal = true;

        console.error('Error al iniciar backup:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de exportación',
          detail: 'No se pudo iniciar el proceso de backup.',
        });
      },
    });
  }

  downloadBackup(processId: string, enterpriseName: string) {
    this.enterpriseService.downloadCopyProcessBackup(processId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${enterpriseName}-backup.zip`;
          a.click();
          window.URL.revokeObjectURL(url);

          this.showExportLoadingModal = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Exportación completada',
            detail: `Se descargó el backup de ${enterpriseName}`,
          });
        }
      },
      error: (err) => {
        this.showExportLoadingModal = false;
        this.showExportErrorModal = true;

        console.error('Error al descargar backup:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de descarga',
          detail: 'No se pudo descargar el archivo de backup.',
        });
      },
    });
  }

  closeExportErrorModal() {
    this.showExportErrorModal = false;
    this.exportProgress = 0;
    this.exportEnterpriseName = '';
  }

  retryExport() {
    this.showExportErrorModal = false;
    this.exportProgress = 0;
  }
}
