import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { EnterpriseService } from '../services/enterprise.service';
import { EnterpriseList } from '../models/EnterpriseList';
import { HeaderComponent } from '../../../Core/Components/Header/header.component';
import {
  LocalStorageMethods,
  EntData,
} from '../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-archive-enterprise',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    DropdownModule,
    FormsModule,
    HeaderComponent,
  ],
  templateUrl: './archive-enterprise.component.html',
  styleUrls: ['./archive-enterprise.component.css'],
})
export class ArchiveEnterpriseComponent implements OnInit {
  archivedEnterprises: EnterpriseList[] = [];
  LocalStorageMethods = new LocalStorageMethods();
  entData: EntData | null = null;

  constructor(
    private enterpriseService: EnterpriseService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadArchivedEnterprises();
  }

  loadArchivedEnterprises() {
    this.enterpriseService.getEnterprisesInactive().subscribe({
      next: (data: EnterpriseList[]) => {
        this.archivedEnterprises = data;
      },
      error: (err) =>
        console.error('Error fetching archived enterprises:', err),
    });
  }

  unarchiveEnterprise(enterprise: EnterpriseList) {
    if (!enterprise.id) return;

    this.enterpriseService.unarchiveEnterprise(String(enterprise.id)).subscribe({
      next: () => {
        console.log('Empresa desarchivada:', enterprise.name);
        this.loadArchivedEnterprises();
      },
      error: (err) => console.error('Error al desarchivar empresa:', err),
    });
  }

  viewEnterprise(enterprise: EnterpriseList) {
    this.saveSelectedEnterprise(enterprise);
    this.router.navigate(['/home']); // O ruta para detalles
  }

  saveSelectedEnterprise(enterprise: EnterpriseList) {
    if (enterprise.id == null) return;

    this.entData = {
      id: String(enterprise.id),
      name: enterprise.name,
      nit: enterprise.nit,
      logo: enterprise.logo ?? '',
    };

    this.LocalStorageMethods.saveEnterpriseData(this.entData);
  }
  goBack(): void {
    this.router.navigate(['/enterprise/list']);
  }
}
