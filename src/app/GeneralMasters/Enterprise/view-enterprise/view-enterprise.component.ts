import { Component } from '@angular/core';
import { LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';

@Component({
  selector: 'app-view-enterprise',
  imports: [],
  templateUrl: './view-enterprise.component.html',
  styleUrl: './view-enterprise.component.css'
})
export class ViewEnterpriseComponent {
  entData: any | null = null;

  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  ngOnInit() {
    this.entData = this.localStorageMethods.loadEnterpriseData();
  }

}
