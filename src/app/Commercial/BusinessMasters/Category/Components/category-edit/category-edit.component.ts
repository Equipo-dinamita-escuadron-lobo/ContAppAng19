import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// --- Importaciones Standalone y de PrimeNG ---
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
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
    DropdownModule,
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
    this.getCategoryDetails();
  }

  getCategoryDetails(): void {
    console.log('Iniciando getCategoryDetails()...');
    console.log('Formulario sin editar:', this.editForm.value);

    this.categoryService.getCategoryById(this.categoryId).subscribe(
      (category: Category) => {
        console.log('Categoría obtenida:', category);

        this.category = category;
        this.editForm.patchValue({
          name: category.name,
          description: category.description,
          inventory: category.inventoryId,
          cost: category.costId,
          sale: category.saleId,
          return: category.returnId
        });

        console.log('Formulario editado:', this.editForm.value);
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
    
    // Mapear los IDs correctamente
    const categoryData = {
      id: this.category.id,
      name: formData.name,
      description: formData.description,
      inventoryId: parseInt(formData.inventory, 10),
      costId: parseInt(formData.cost, 10),
      saleId: parseInt(formData.sale, 10),
      returnId: parseInt(formData.return, 10),
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
        this.router.navigate(['/commercial/business-masters/categories/list']); // Redirigir a la lista
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

  goBack(): void {
    this.router.navigate(['/commercial/business-masters/categories/list']);
  }
}
