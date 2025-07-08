import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auxiliary-books-list',
  imports: [CommonModule],
  templateUrl: './auxiliary-books-list.component.html',
  styleUrl: './auxiliary-books-list.component.css',
})
export class AuxiliaryBooksListComponent {
  auxiliaryBooks = [
    {
      name: 'Libro de Inventarios y Balances',
      route: '/financial/reports/auxiliary-books/inventory-and-balances',
      description: 'Presenta la situación financiera de la empresa',
      icon: 'inventory_2',
    },
    {
      name: 'Libro Diario',
      route: '/financial/reports/auxiliary-books/diary',
      description: 'Registra cronológicamente todas las transacciones',
      icon: 'wb_sunny',
    },
    {
      name: 'Libro Mayor y Balances',
      route: '/financial/reports/auxiliary-books/major-and-balances',
      description: 'Resume saldos y movimientos por cuenta',
      icon: 'book_5',
    },
    {
      name: 'Libro por Cuenta',
      route: '/financial/reports/auxiliary-books/account-book',
      description: 'Detalla movimientos dentro de cada cuenta',
      icon: 'account_balance',
    },
    {
      name: 'Libro por Tercero',
      route: '/financial/reports/auxiliary-books/third-party-book',
      description: 'Muestra movimientos contables de un tercero específico',
      icon: 'groups_3',
    },
    {
      name: 'Balance de Prueba / por Tercero',
      route: '/financial/reports/auxiliary-books/test-balance',
      description: 'Verifica saldos contables',
      icon: 'balance',
    },
    {
      name: 'Movimiento de Contabilidad',
      route: '/financial/reports/auxiliary-books/movement-accounting',
      description: 'Resume todos los movimientos contables registrados',
      icon: 'difference',
    },
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  goTo(route: String): void {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
