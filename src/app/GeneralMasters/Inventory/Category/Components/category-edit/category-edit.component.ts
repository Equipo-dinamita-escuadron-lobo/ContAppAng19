import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// --- Importaciones Standalone y de PrimeNG ---
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { CategoryService } from '../../Services/category.service';
import { Category } from '../../Models/Category';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { ChartAccountService } from '../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Account } from '../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Esencial para formularios reactivos en componentes Standalone
    RouterModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    ToastModule
  ],
  templateUrl: './category-edit.component.html',
  styleUrl: './category-edit.component.css'
})
export class CategoryEditComponent implements OnInit {
  categoryId: string = '';
  category: Category = {} as Category;
  editForm: FormGroup;
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  formSubmitAttempt = false;
  loading = false;
  
  // Propiedad para guardar datos originales
  private originalCategoryData!: Category;
  
  // Cuentas
  accounts: any[] = [];
  inventory: any[] = [];
  cost: any[] = [];
  sale: any[] = [];
  return: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder,
    private router: Router,
    private chartAccountService: ChartAccountService,
  ) {
    // Inicializa el formulario en el constructor para asegurar que esté disponible inmediatamente
    this.editForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      inventory: [null, Validators.required],
      cost: [null, Validators.required],
      sale: [null, Validators.required],
      return: [null, Validators.required]
    });
  }
  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    if (!this.entData) {
      console.error("No se encontró el ID de la empresa. No se pueden cargar los datos del formulario.");
      Swal.fire('Error', 'No se pudo identificar la empresa. Vuelva a iniciar sesión.', 'error');
    } else {
      this.route.params.subscribe(params => {
        this.categoryId = params['id'];
        this.loadInitialData();
      });
    }
  }

  loadInitialData(): void {
    this.getCuentas();
    // Los detalles de la categoría se cargarán después de que las cuentas estén disponibles
  }

  getCategoryDetails(): void {
    console.log('Iniciando getCategoryDetails()...');
    console.log('Formulario sin editar:', this.editForm.value);
    console.log('Cuentas disponibles:', this.accounts);

    this.categoryService.getCategoryById(this.categoryId).subscribe(
      (category: Category) => {
        console.log('Categoría obtenida:', category);

        this.category = category;
        // Guardar los datos originales para comparación
        this.originalCategoryData = { ...category };
        
        // Buscar las cuentas correspondientes por ID
        const inventoryAccount = this.accounts.find(acc => acc.id === category.inventoryId || acc.id === Number(category.inventoryId));
        const costAccount = this.accounts.find(acc => acc.id === category.costId || acc.id === Number(category.costId));
        const saleAccount = this.accounts.find(acc => acc.id === category.saleId || acc.id === Number(category.saleId));
        const returnAccount = this.accounts.find(acc => acc.id === category.returnId || acc.id === Number(category.returnId));

        console.log('Buscando cuenta de inventario con ID:', category.inventoryId, 'tipo:', typeof category.inventoryId);
        console.log('Buscando cuenta de costo con ID:', category.costId, 'tipo:', typeof category.costId);
        console.log('Buscando cuenta de venta con ID:', category.saleId, 'tipo:', typeof category.saleId);
        console.log('Buscando cuenta de devolución con ID:', category.returnId, 'tipo:', typeof category.returnId);
        console.log('Tipos de IDs de cuentas disponibles:', this.accounts.slice(0, 3).map(acc => ({ id: acc.id, tipo: typeof acc.id })));

        this.editForm.patchValue({
          name: category.name,
          description: category.description,
          inventory: inventoryAccount || null,
          cost: costAccount || null,
          sale: saleAccount || null,
          return: returnAccount || null
        });

        console.log('Formulario editado:', this.editForm.value);
        console.log('Cuenta de inventario encontrada:', inventoryAccount);
        console.log('Cuenta de costo encontrada:', costAccount);
        console.log('Cuenta de venta encontrada:', saleAccount);
        console.log('Cuenta de devolución encontrada:', returnAccount);
      },
      (error: any) => {
        console.error('Error obteniendo detalles de la categoría: ', error);
      }
    );
  }

    //cuentas
   // Cuentas
  getCuentas(): void {
    console.log('Cargando cuentas en edición con entData:', this.entData);
    const enterpriseId = this.entData?.id || this.localStorageMethods.getIdEnterprise();
    console.log('Enterprise ID para cuentas en edición:', enterpriseId);
    this.chartAccountService.getListAccounts(enterpriseId).subscribe({
      next: (data: any[]) => {
        console.log('Cuentas recibidas en edición:', data);
        this.accounts = this.mapAccountToList(data);
        this.cost = this.accounts;
        this.inventory = this.accounts;
        this.sale = this.accounts;
        this.return = this.accounts;
        console.log('Cuentas mapeadas en edición:', this.accounts);
        console.log('Primeras 5 cuentas como ejemplo:', this.accounts.slice(0, 5));
        
        // Ahora que las cuentas están cargadas, obtener los detalles de la categoría
        this.getCategoryDetails();
      },
      error: (error: any) => {
        console.error('Error al obtener las cuentas en edición:', error);
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
get filteredAccounts() {
if (this.accounts) {
  return this.accounts.filter(account =>
    `${account.code} - ${account.description}`.toLowerCase()
  );
}
return [];
}

customSearchFn(term: string, item: any) {
term = term.toLowerCase();
return item.code.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
}


    validationsAll() {
      return {
        stringSearchCategory: [''],
      };
    }

  onSubmit(): void {
    this.formSubmitAttempt = true;
    if (this.editForm.invalid) {
      Swal.fire('Formulario Inválido', 'Por favor, revise todos los campos requeridos.', 'warning');
      // Marcar todos los campos como "tocados" para mostrar los errores
      this.editForm.markAllAsTouched();
      return;
    }

    const formData = { ...this.editForm.value };
    
    // Verificar si hubo cambios
    const hasChanges = this.hasFormChanges(formData);

    if (!hasChanges) {
      Swal.fire({
        title: 'Sin cambios',
        text: 'No se han detectado cambios en la categoría.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    // Mapear los IDs correctamente desde los objetos de cuentas seleccionados
    const categoryData = {
      id: this.category.id,
      name: formData.name,
      description: formData.description,
      inventoryId: formData.inventory?.id || null,
      costId: formData.cost?.id || null,
      saleId: formData.sale?.id || null,
      returnId: formData.return?.id || null,
      enterpriseId: this.entData?.id || this.localStorageMethods.getIdEnterprise(),
      state: this.category.state
    };

    console.log('Datos de categoría a actualizar:', categoryData);

    this.categoryService.updateCategory(categoryData).subscribe({
      next: () => {
        Swal.fire({
          title: 'Actualización exitosa',
          text: 'Se ha actualizado la categoría con éxito.',
          icon: 'success',
          confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
        });
        this.router.navigate(['/gen-masters/inventory/categories/list']); // Redirigir a la lista
      },
      error: (err: any) => {
        console.error('Error al actualizar la categoría:', err);
        Swal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error al actualizar la categoría.',
          icon: 'error',
          confirmButtonColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
        });
      }
    });
  }

  // Método para verificar si hubo cambios en el formulario
  private hasFormChanges(formData: any): boolean {
    if (!this.originalCategoryData) return false;
    
    return (
      formData.name !== this.originalCategoryData.name ||
      formData.description !== this.originalCategoryData.description ||
      formData.inventory?.id !== this.originalCategoryData.inventoryId ||
      formData.cost?.id !== this.originalCategoryData.costId ||
      formData.sale?.id !== this.originalCategoryData.saleId ||
      formData.return?.id !== this.originalCategoryData.returnId
    );
  }

  // Método público para verificar si hubo cambios (usado en el template)
  hasChanges(): boolean {
    if (!this.originalCategoryData) return false;
    const formData = this.editForm.value;
    return this.hasFormChanges(formData);
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/inventory/categories/list']);
  }
}
