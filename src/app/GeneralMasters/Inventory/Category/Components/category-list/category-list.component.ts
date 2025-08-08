import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { Account } from '../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { ChartAccountService } from '../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Category } from '../../Models/Category';
import { CategoryService } from '../../Services/category.service';

// PrimeNG Imports
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputIcon } from "primeng/inputicon";
import { IconField } from "primeng/iconfield";
import { ReactiveFormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';

// Componente de detalles (si existe)
// import { CategoryDetailsComponent } from '../category-details/category-details.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    InputIcon,
    IconField,
    ReactiveFormsModule,
    ToggleSwitchModule,
    TagModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
})
export class CategoryListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  categories: Category[] = [];
  accounts: any[] = [];

  // Variables para el formulario reactivo
  form: FormGroup;

  // Variables eliminadas para doble clic - ya no se necesitan

  // Variables para modales
  dialog: any;
  displayDetailsModal = false;
  selectedCategory: Category | null = null;

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private chartAccountService: ChartAccountService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group(this.validationsAll());
  }

  validationsAll() {
    return {
      stringSearchCategory: [''],
    };
  }

  ngOnInit(): void {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    // Cargar primero las cuentas, luego las categorías
    this.getCuentas();
  }

  // Método para filtrar las categorías
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    // El filtrado se maneja automáticamente por PrimeNG Table
  }

  //cuentas
  getCuentas(): void {
    const enterpriseId = this.entData?.id || this.localStorageMethods.getIdEnterprise();
    
    if (!enterpriseId) {
      this.accounts = [];
      return;
    }
    
    this.chartAccountService.getListAccounts(enterpriseId).subscribe({
      next: (data: any[]) => {
        this.accounts = this.mapAccountToList(data);
        // Una vez que las cuentas están cargadas, cargar las categorías
        this.getCategories();
      },
      error: (error: any) => {
        this.accounts = [];
        // Aún así intentar cargar las categorías
        this.getCategories();
      }
    });
  }

  mapAccountToList(data: Account[]): Account[] {
    let result: Account[] = [];

    function traverse(account: Account) {
        // Clonamos el objeto cuenta sin los hijos
        let { children, ...accountWithoutChildren } = account;
        result.push(accountWithoutChildren as Account);

        // Llamamos recursivamente para cada hijo
        if (children && children.length > 0) {
            children.forEach((child: Account) => traverse(child));
        }
    }

    data.forEach(account => traverse(account));
    
    return result;
  }

  getCategoryName(id: number | string | null | undefined): string {
    // Si el ID es null, undefined, o 0, retornar un mensaje apropiado
    if (id === null || id === undefined || id === 0 || id === '0' || id === '') {
      return 'No asignado';
    }
    
    // Si las cuentas aún no están cargadas, mostrar mensaje de carga
    if (this.accounts.length === 0) {
      return 'Cargando...';
    }
    
    // Convertir a número si es string, manejando posibles errores
    let numericId: number;
    if (typeof id === 'string') {
      numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return 'ID inválido';
      }
    } else {
      numericId = id;
    }
    
    // Verificar si el ID existe en la lista de cuentas
    const account = this.accounts.find(cuenta => {
      // Asegurar comparación exacta de tipos
      return cuenta.id === numericId || cuenta.id === id;
    });
    
    if (!account) {
      return `No encontrado (ID: ${numericId})`;
    }
    
    // Retornar código y descripción de la cuenta
    const code = account.code || '';
    const description = account.description || 'Sin descripción';
    
    return code ? `${code} - ${description}` : description;
  }

  getCategories(): void {
    const enterpriseId = this.entData?.id || this.localStorageMethods.getIdEnterprise();
    
    if (!enterpriseId) {
      this.categories = [];
      return;
    }
    
    this.categoryService.getCategories(enterpriseId).subscribe({
      next: (data: Category[]) => {
        this.categories = data;
      },
      error: (error) => {
        this.categories = [];
      }
    });
  }

  // Método para redirigir a una ruta específica
  redirectTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  // Método para redirigir a la página de edición con un solo clic
  redirectToEdit(categoryId: string): void {
    this.router.navigate(['/gen-masters/inventory/categories/edit/', categoryId]);
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/inventory']);
  }

  // Método para recargar las cuentas si es necesario
  reloadAccounts(): void {
    this.getCuentas();
  }

  deleteCategory(categoryId: string): void {
    // Utilizando SweetAlert para mostrar un cuadro de diálogo de confirmación
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar esta categoría?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
      cancelButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim(),
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      // Si el usuario confirma la eliminación
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(categoryId).subscribe(
          (data: Category) => {
            this.getCategories();
            // Mostrar cuadro de diálogo de éxito
            Swal.fire({
              title: 'Eliminada con éxito',
              text: 'La categoría se ha eliminado correctamente.',
              icon: 'success',
              confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
              confirmButtonText: 'Aceptar'
            });
          },
          (error: any) => {
            // Mostrar cuadro de diálogo de error
            Swal.fire({
              title: 'Error al eliminar',
              text: 'Ha ocurrido un error al intentar eliminar la categoría.',
              icon: 'error',
              confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
              confirmButtonText: 'Aceptar'
            });
          }
        );
      }
    });
  }

  // Método para cambiar el estado de la categoría
  changeCategoryState(category: Category): void {
    this.categoryService.changeCategoryState(category.id).subscribe({
      next: () => {
        // Cambiar el estado localmente
        const currentState = this.isActive(category.state);
        category.state = currentState ? 'false' : 'true';
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado de la categoría "${category.name}" cambiado correctamente`
        });
      },
      error: (error: any) => {
        console.error('Error al cambiar el estado de la categoría:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado de la categoría'
        });
      }
    });
  }

  // Métodos para manejar el estado
  getStateSeverity(state: string): 'success' | 'danger' {
    if (!state) return 'danger';
    return (state === 'true' || state === '1' || state === 'ACTIVE' || state === 'active') ? 'success' : 'danger';
  }

  formatState(state: string): string {
    if (!state) return 'Inactivo';
    return (state === 'true' || state === '1' || state === 'ACTIVE' || state === 'active') ? 'Activo' : 'Inactivo';
  }

  isActive(state: string): boolean {
    if (!state) return false;
    return state === 'true' || state === '1' || state === 'ACTIVE' || state === 'active';
  }


}
