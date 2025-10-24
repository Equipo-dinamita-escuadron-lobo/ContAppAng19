import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auxiliary-books-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './auxiliary-books-list.component.html',
  styleUrl: './auxiliary-books-list.component.css',
})
export class AuxiliaryBooksListComponent implements OnInit {
  searchTerm: string = '';
  auxiliaryBooks = [
    {
      name: 'Libro de Inventarios y Balances',
      route: '/financial/reports/auxiliary-books/inventory-and-balances',
      description: 'Presenta la situación financiera de la empresa',
      longDescription:
        'Este libro auxiliar muestra los inventarios y balances de la empresa de manera detallada.',
      icon: 'inventory_2',
    },
    {
      name: 'Libro Diario',
      route: '/financial/reports/auxiliary-books/diary',
      description: 'Registra cronológicamente todas las transacciones',
      longDescription:
        'Este libro auxiliar permite llevar un registro cronológico de todas las transacciones realizadas por la empresa.',
      icon: 'wb_sunny',
    },
    {
      name: 'Libro Mayor',
      route: '/financial/reports/auxiliary-books/major-and-balances',
      description: 'Resume saldos y movimientos por cuenta',
      longDescription:
        'Este libro auxiliar resume los saldos y movimientos por cuenta de manera clara y concisa.',
      icon: 'book_5',
    },
    {
      name: 'Libro Auxiliar por Cuenta',
      route: '/financial/reports/auxiliary-books/account-book',
      description: 'Detalla movimientos dentro de cada cuenta',
      longDescription:
        'Este libro auxiliar detalla los movimientos dentro de cada cuenta de manera precisa.',
      icon: 'account_balance',
    },
    {
      name: 'Libro Auxiliar por Tercero',
      route: '/financial/reports/auxiliary-books/third-party-book',
      description: 'Muestra movimientos contables de un tercero específico',
      longDescription:
        'Este libro auxiliar muestra los movimientos contables de un tercero específico de manera detallada.',
      icon: 'groups_3',
    },
    {
      name: 'Movimiento de Contabilidad',
      route: '/financial/reports/auxiliary-books/accounting-movement',
      description: 'Resume todos los movimientos contables registrados',
      longDescription:
        'Este libro auxiliar resume todos los movimientos contables registrados de manera clara y concisa.',
      icon: 'difference',
    },
  ];

  filteredAuxiliaryBooks: any[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.filteredAuxiliaryBooks = [...this.auxiliaryBooks];
  }

  filterAuxBooks() {
    const term = this.searchTerm.toLowerCase();
    this.filteredAuxiliaryBooks = this.auxiliaryBooks.filter(
      (book) =>
        book.name.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term)
    );
  }

  goTo(route: String): void {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
