import { Component } from '@angular/core';

@Component({
  selector: 'app-view-enterprise',
  imports: [],
  templateUrl: './view-enterprise.component.html',
  styleUrl: './view-enterprise.component.css'
})
export class ViewEnterpriseComponent {
  entData: any | null = null;

  getIdEnterprise() {
    const entData = localStorage.getItem('entData');
    if (entData) {
      this.entData = JSON.parse(entData);
    }
  }

  ngOnInit() {
    this.getIdEnterprise();
  }

}
