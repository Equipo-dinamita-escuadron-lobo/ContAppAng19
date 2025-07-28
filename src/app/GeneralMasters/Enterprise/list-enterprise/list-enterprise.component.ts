import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { EnterpriseService } from '../services/enterprise.service';
import { EnterpriseList } from '../models/EnterpriseList';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../Core/Components/Header/header.component';
import { DropdownModule } from "primeng/dropdown";
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { LocalStorageMethods, EntData } from '../../../Shared/Methods/local-storage.method';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-list-enterprise',
  imports: [
    RouterModule,
    CommonModule,
    ButtonModule,
    FormsModule,
    HeaderComponent,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DropdownModule,
],
  templateUrl: './list-enterprise.component.html',
  styleUrl: './list-enterprise.component.css'
})
export class ListEnterpriseComponent {
  enterprises: EnterpriseList[] = [];
  filteredEnterprises: EnterpriseList[] = [];
  selectedStatus: string = 'active';
  searchTerm: string = '';

  constructor(
    private enterpriseService: EnterpriseService,
    private router: Router
  ) {}

  LocalStorageMethods = new LocalStorageMethods();
  entData: EntData | null = null;

  ngOnInit() {
    this.getEnterpriseActive();
  }

  getEnterpriseActive() {
    this.enterpriseService.getEnterprisesActive().subscribe({
      next: (data: EnterpriseList[]) => {
        this.enterprises = data;
        this.filteredEnterprises = [...this.enterprises];
      },
      error: (error) => {
        console.error('Error fetching enterprises:', error);
      }
    });
  }

  getEnterpriseInactive() {
    this.enterpriseService.getEnterprisesInactive().subscribe({
      next: (data: EnterpriseList[]) => {
        this.enterprises = data;
        this.filteredEnterprises = [...this.enterprises];
      },
      error: (error) => {
        console.error('Error fetching inactive enterprises:', error);
      }
    });
  }

  filterEnterprises() {
    if (!this.searchTerm) {
      this.filteredEnterprises = [...this.enterprises];
    } else {
      this.filteredEnterprises = this.enterprises.filter(enterprise =>
        enterprise.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectEnterpriseStatus() {
    if (this.selectedStatus === 'active') {
      this.getEnterpriseActive();
    } else if (this.selectedStatus === 'inactive') {
      this.getEnterpriseInactive();
    } else {
      this.filteredEnterprises = [...this.enterprises];
    }
  }

  saveSelectedEnterprise(enterprise: any) {
    this.entData = {
      id: enterprise.id,
      name: enterprise.name,
      nit: enterprise.nit,
      logo: enterprise.logo
    };
    this.LocalStorageMethods.saveEnterpriseData(this.entData);
  }

  onCreateEnterprise(): void {
    this.router.navigate(['/enterprise/create']);
  }
}
