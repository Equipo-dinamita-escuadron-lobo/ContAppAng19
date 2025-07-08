import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-main-view',
  imports: [CommonModule],
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.css',
})
export class MainViewComponent {
  reports = [
    {
      name: 'Estados Financieros',
      route: '/financial/reports/financial-statements',
      type: 'Estados',
      amount: 4,
      icon: 'docs',
    },
    {
      name: 'Libros Auxiliares',
      route: '/financial/reports/auxiliary-books/list',
      type: 'Libros',
      amount: 7,
      icon: 'book_5',
    },
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  goTo(route: string): void {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
