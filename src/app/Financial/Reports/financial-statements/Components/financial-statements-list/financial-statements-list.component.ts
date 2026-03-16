import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../../../Core/auth/services/auth.service';

interface FinancialStatementOption {
  name: string;
  route: string;
  description: string;
  longDescription: string;
  icon: string;
}

@Component({
  selector: 'app-financial-statements-list',
  imports: [CommonModule, FormsModule, ButtonModule, RippleModule],
  templateUrl: './financial-statements-list.component.html',
  styleUrl: './financial-statements-list.component.css',
})
export class FinancialStatementsListComponent implements OnInit {
  searchTerm = '';

  financialStatements: FinancialStatementOption[] = [
    {
      name: 'Estado de Situación Financiera',
      route: '/financial/reports/financial-statements/statement-financial-position',
      description:
        'Muestra activos, pasivos y patrimonio en una fecha determinada.',
      longDescription:
        'Refleja la posición financiera de la entidad en un momento específico con enfoque en su estructura patrimonial.',
      icon: 'account_balance_wallet',
    },
    {
      name: 'Estado de Resultados',
      route: '/financial/reports/financial-statements/income-statement',
      description: 'Presenta ingresos, costos y gastos del periodo.',
      longDescription:
        'Permite evaluar si la entidad obtuvo utilidad o pérdida en el periodo contable seleccionado.',
      icon: 'monitoring',
    },
    {
      name: 'Estado de Cambios en el Patrimonio',
      route: '/financial/reports/financial-statements/statement-of-changes-in-equity',
      description: 'Expone variaciones del patrimonio de la entidad.',
      longDescription:
        'Detalla cómo se transformó el patrimonio a lo largo del periodo, incluyendo resultados y movimientos patrimoniales.',
      icon: 'swap_horiz',
    },
    /*{
      name: 'Balance General',
      route: '/financial/reports/financial-statements/balance-sheet',
      description: 'Resume la situación general de cuentas contables.',
      longDescription:
        'Consolida los principales saldos para análisis financiero integral y verificación de consistencia contable.',
      icon: 'balance',
    },*/
  ];

  filteredFinancialStatements: FinancialStatementOption[] = [];

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  get isAdmin(): boolean {
    return this.authService.hasRole('Administrador');
  }

  ngOnInit(): void {
    this.filteredFinancialStatements = [...this.financialStatements];
  }

  filterFinancialStatements(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredFinancialStatements = [...this.financialStatements];
      return;
    }

    this.filteredFinancialStatements = this.financialStatements.filter(
      (statement) =>
        statement.name.toLowerCase().includes(term) ||
        statement.description.toLowerCase().includes(term)
    );
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  goToHistory(): void {
    this.router.navigate(['/financial/reports/financial-statements/historial']);
  }
}

