import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-financial-statements-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-statements-list.component.html',
  styleUrl: './financial-statements-list.component.css'
})
export class FinancialStatementsListComponent implements OnInit {
  searchTerm: string = '';
  financialStatements = [
    {
      name: 'Estado de situacion Financiera',
      route: '/financial/reports/financial-statements/statement-financial-position',
      description: 'Muestra los activos, pasivos y patrimonio de la entidad en una fecha determinada.',
      longDescription:
        'Refleja la posición financiera de la entidad en un momento específico, mostrando recursos, obligaciones y patrimonio.',
      icon: 'bar_chart',
    },

     {
      name: 'Estado de Resultados',
      route: '/financial/reports/financial-statements/statement-financial-position',
      description: 'Presenta ingresos, costos y gastos de un período.',
      longDescription:
        'Permite conocer si la entidad obtuvo utilidad o pérdida en el período contable.',
      icon: 'attach_money',
    },
    {
      name: 'Balance de Prueba',
      route: '/financial/reports/financial-statements/statement-financial-position',
      description: 'Resume saldos de todas las cuentas contables.',
      longDescription:
        'Verifica que los débitos y créditos estén equilibrados, garantizando consistencia contable.',
      icon: 'scale',
    },
    {
      name: 'Estado de Cambio en el Patrimonio',
      route: '/financial/reports/financial-statements/statement-financial-position',
      description: 'Expone variaciones en el patrimonio de la entidad.',
      longDescription:
        'Muestra cómo cambió el patrimonio a lo largo del período contable, incluyendo aportes, utilidades o pérdidas.',
      icon: 'sync_alt',
    },
  ];

  filteredFinancialStatements: any[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.filteredFinancialStatements = [...this.financialStatements];
  }

  filterFinancialStatements() {
    const term = this.searchTerm.toLowerCase();
    this.filteredFinancialStatements = this.financialStatements.filter(
      (book) =>
        book.name.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term)
    );
  }

  goTo(route: String): void {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
