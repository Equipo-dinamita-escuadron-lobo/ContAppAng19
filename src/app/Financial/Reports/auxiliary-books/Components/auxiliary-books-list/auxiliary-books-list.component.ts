import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../../../Core/auth/services/auth.service';

interface AuxiliaryBook {
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-auxiliary-books-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, RippleModule],
  templateUrl: './auxiliary-books-list.component.html',
  styleUrls: ['./auxiliary-books-list.component.css'],
})
export class AuxiliaryBooksListComponent {
  // Propiedad para almacenar la lista de libros auxiliares
  auxiliaryBooks = [
    // Definición de cada libro auxiliar con sus propiedades
    // ... (resto de los libros auxiliares)
    // Ejemplo de un libro auxiliar:
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
  ] as AuxiliaryBook[];

  constructor(private router: Router, private authService: AuthService) {}

  // Getter para verificar si el usuario actual tiene el rol de 'Administrador'
  get isAdmin(): boolean {
    return this.authService.hasRole('Administrador');
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Navega a la página de historial de libros auxiliares.
   */
  goToHistory(): void {
    // Asegúrate de que la ruta coincida con tu configuración de enrutamiento
    this.router.navigate(['/financial/reports/auxiliary-books/historial']);
  }
}
