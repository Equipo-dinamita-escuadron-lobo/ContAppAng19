import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CategoryService } from '../../Services/category.service';
import { CategoryValidationMessagesService } from '../../Services/category-validation-messages.service';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { ChartAccountService } from '../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Account } from '../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';

@Component({
  selector: 'app-category-creation',
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
  templateUrl: './category-creation.component.html',
  styleUrls: ['./category-creation.component.css'],
})
export class CategoryCreationComponent implements OnInit {
  categoryForm: FormGroup;
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  formSubmitAttempt = false;

  // Cuentas
  accounts: any[] = [];
  inventory: any[] = [];
  cost: any[] = [];
  sale: any[] = [];
  return: any[] = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly categoryService: CategoryService,
    private readonly router: Router,
    private readonly chartAccountService: ChartAccountService,
    private readonly messageService: MessageService,
    public readonly categoryValidationMessagesService: CategoryValidationMessagesService
  ) {
    // Inicializa el formulario en el constructor para asegurar que esté disponible inmediatamente
    this.categoryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      inventory: [null, Validators.required],
      cost: [null, Validators.required],
      sale: [null, Validators.required],
      return: [null, Validators.required],
    });
  }


  ngOnInit(): void {
    this.entData = this.localStorageMethods.getIdEnterprise();
    if (!this.entData) {
      console.error("No se encontró el ID de la empresa. No se pueden cargar los datos del formulario.");
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar la empresa. Vuelva a iniciar sesión.'
      });
    } else {
      this.loadInitialData();
    }
  }

  loadInitialData(): void {
    this.getCuentas();
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;
    if (this.categoryForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: 'Por favor, revise todos los campos requeridos.'
      });
      // Marcar todos los campos como "tocados" para mostrar los errores
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formData = { ...this.categoryForm.value };
    
    // Mapear los IDs correctamente
    const categoryData = {
      name: formData.name,
      description: formData.description,
      inventoryId: formData.inventory,
      costId: formData.cost,
      saleId: formData.sale,
      returnId: formData.return,
      enterpriseId: this.entData?.id || this.localStorageMethods.getIdEnterprise(),
      state: true 
    };

    this.categoryService.createCategory(categoryData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Se ha creado la categoría con éxito.'
        });
        this.router.navigate(['/gen-masters/inventory/categories/list']); 
      },
      error: (err: any) => {
        console.error('Error al crear la categoría:', err);
        if (err.error?.message) {
          this.messageService.add({
            severity: 'error',
            summary: 'Registro Duplicado',
            detail: err.error.message
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Ha ocurrido un error al crear la categoría.'
          });
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/gen-masters/inventory/categories/list']);
  }

  // Cuentas
  getCuentas(): void {
    const enterpriseId = this.entData?.id || this.localStorageMethods.getIdEnterprise();
    this.chartAccountService.getListAuxiliaryAccounts(enterpriseId).subscribe({
      next: (data: any[]) => {
        this.accounts = this.mapAccountToList(data);
        this.cost = this.accounts;
        this.inventory = this.accounts;
        this.sale = this.accounts;
        this.return = this.accounts;
      },
      error: (error: any) => {
        console.error('Error al obtener las cuentas auxiliares:', error);
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
            for (const child of children) {
              traverse(child);
            }
        }
    }

    for (const account of data) {
      traverse(account);
    }
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

}
