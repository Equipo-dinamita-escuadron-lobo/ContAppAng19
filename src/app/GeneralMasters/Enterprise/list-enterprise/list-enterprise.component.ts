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

  selectedStatus: string = 'active';
  searchTerm: string = '';

  showPdfModal: boolean = false;
  selectedPdfFile: File | null = null;

  showDeleteModal: boolean = false;
  enterpriseToDelete: EnterpriseList | null = null;

  menuItems: any[] = [];
  selectedEnterpriseForMenu: EnterpriseList | null = null;

  LocalStorageMethods = new LocalStorageMethods();
  entData: EntData | null = null;

  constructor(
    private enterpriseService: EnterpriseService,
    private router: Router,
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.getEnterprises();
    this.getArchivedEnterprises();
  }

  /* ==================== FETCH ==================== */
  getEnterprises() {
    this.enterpriseService.getEnterprisesActive().subscribe({
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
        e.name.toLowerCase().includes(this.searchTerm.toLowerCase())
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
        label: 'Copia de seguridad',
        icon: 'pi pi-save',
        command: () => this.backupEnterprise(this.selectedEnterpriseForMenu!),
      },
      {
        label: 'Archivar',
        icon: 'pi pi-folder',
        command: () => this.archiveEnterprise(this.selectedEnterpriseForMenu!),
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () =>
          this.confirmDeleteEnterprise(this.selectedEnterpriseForMenu!),
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

  archiveEnterprise(enterprise: EnterpriseList) {
    if (!enterprise.id) return;

    // 1️⃣ Eliminar de la lista de activas
    this.enterprises = this.enterprises.filter((e) => e.id !== enterprise.id);
    this.filteredEnterprises = this.filteredEnterprises.filter(
      (e) => e.id !== enterprise.id
    );

    // 2️⃣ Agregar a la lista de archivadas
    this.archivedEnterprises.push(enterprise);

    // 3️⃣ Mensaje de éxito
    this.messageService.add({
      severity: 'success',
      summary: 'Archivado',
      detail: `${enterprise.name} fue archivada.`,
    });

    // ✅ El badge {{ archivedEnterprises.length }} se actualizará automáticamente
  }

  confirmDeleteEnterprise(enterprise: EnterpriseList) {
    this.enterpriseToDelete = enterprise;
    this.showDeleteModal = true;
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
        this.enterpriseService.createEnterprise(duplicatedEnterprise).subscribe({
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
      error: (err) => console.error('Error al obtener datos de la empresa:', err),
    });
  }

  backupEnterprise(enterprise: EnterpriseList) {
    if (!enterprise.id) return;
    this.enterpriseService.backupEnterprise(String(enterprise.id)).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copia de seguridad creada',
          detail: `${enterprise.name} fue respaldada correctamente.`,
        });
      },
      error: (err) => console.error('Error al hacer copia de seguridad:', err),
    });
  }

  cancelDelete() {
    this.enterpriseToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.enterpriseToDelete || !this.enterpriseToDelete.id) return;

    this.enterpriseService
      .deleteEnterprise(String(this.enterpriseToDelete.id))
      .subscribe({
        next: () => {
          console.log('Empresa eliminada:', this.enterpriseToDelete?.name);
          this.showDeleteModal = false;
          this.enterpriseToDelete = null;
          this.getEnterprises();
          this.getArchivedEnterprises();
        },
        error: (err) => console.error('Error al eliminar empresa:', err),
      });
  }

  openArchivedEnterprise(enterprise: EnterpriseList) {
    this.saveSelectedEnterprise(enterprise);
    this.router.navigate(['/enterprise/archive']);
  }

  /* ==================== LOGO ==================== */
  onImageError(event: any) {
    console.error('Error loading image:', event);
  }

  onImageLoad(enterprise: EnterpriseList) {
    console.log(
      'Imagen cargada correctamente:',
      enterprise.name,
      enterprise.logo
    );
  }
}
