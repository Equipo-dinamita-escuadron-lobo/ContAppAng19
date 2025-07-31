import { Component, OnInit, ViewChild } from '@angular/core';

import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { Account } from '../../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { ChartAccountService } from '../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Category } from '../../Models/Category';
import { CategoryService } from '../../Services/category.service';


import { CommonModule } from '@angular/common';
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



@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    InputIcon,
    IconField
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
})
export class CategoryListComponent implements OnInit {
  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;
  categories: Category[] = [];
  accounts: any[] = [];



  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private chartAccountService: ChartAccountService,
    private localstorageMethods: LocalStorageMethods
  ) { }

  ngOnInit(): void {
    this.entData = this.localstorageMethods.loadEnterpriseData();
    this.getCategories();
    this.getCuentas();
    console.log('Categorías obtenidas:', this.categories);
  }
  //cuentas
  getCuentas(): void {
    const enterpriseId = this.entData?.id || this.localstorageMethods.getIdEnterprise();
    console.log('Enterprise ID para cuentas en lista:', enterpriseId);
    this.chartAccountService.getListAccounts(enterpriseId).subscribe(
      (data: any[]) => {
        this.accounts = this.mapAccountToList(data);
        console.log('Cuentas cargadas:', this.accounts);
      },
      (error: any) => {
        console.error('Error al obtener las cuentas:', error);
        this.accounts = [];
      }
    );
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

  getCategoryName(id: number): string {
    const account = this.accounts.find(cuenta => cuenta.id === id);
    return account ? account.description : 'No encontrado';
  }


  getCategories(): void {
    const enterpriseId = this.localstorageMethods.getIdEnterprise();
    this.categoryService.getCategories(enterpriseId).subscribe({
      next: (data: Category[]) => {
        this.categories = data;
        console.log('Categorías obtenidas:', this.categories);
      },
      error: (error) => {
        console.error('Error al obtener las categorías:', error);
        this.categories = [];
      }
    });
  }


  // Método para redirigir a una ruta específica
  redirectTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  redirectToEdit(categoryId: string): void {
    this.router.navigate(['/commercial/business-masters/categories/edit/', categoryId]);
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
            console.log('Categoría eliminada con éxito: ', data);
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
            console.error('Error al eliminar la categoría: ', error);
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




}
