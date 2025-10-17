import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpCenterService } from './services/help-center.service';
import { HelpCenterResponse } from './models/HelpCenterResponse';
import { LocalStorageMethods } from '../../Shared/Methods/local-storage.method';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-help-center',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ScrollPanelModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    FormsModule
  ],
  templateUrl: './help-center-view.component.html',
  styleUrl: './help-center-view.component.css'
})
export class HelpCenterViewComponent implements OnInit {

  constructor(private helpCenterService: HelpCenterService) {}

  localStorageMethods = new LocalStorageMethods();
  entData: any | null = null;

  // Lista de ayudas
  helpList: HelpCenterResponse[] = [];

  // Lista filtrada por búsqueda
  filteredHelpList: HelpCenterResponse[] = [];

  // Contenido seleccionado
  selectedHelp: HelpCenterResponse | null = null;

  // Estado de carga
  loading: boolean = false;

  // Término de búsqueda
  searchTerm: string = '';

  // Subject para debounce de búsqueda
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.entData = this.localStorageMethods.loadEnterpriseData();
    this.loadAllHelps();

    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(term => {
      this.performSearch(term);
    });
  }

  /**
   * Carga todas las ayudas disponibles
   */
  loadAllHelps() {
    if (!this.entData?.id) {
      console.error('No se encontró el ID de la empresa');
      return;
    }

    this.loading = true;

    this.helpCenterService.searchHelps(this.entData.id, '').subscribe({
      next: (response) => {
        // La respuesta es paginada, extraer el contenido
        this.helpList = response.content || [];
        this.filteredHelpList = this.helpList;

        // Si hay elementos, seleccionar el primero por defecto
        if (this.filteredHelpList.length > 0) {
          this.selectHelp(this.filteredHelpList[0]);
        } else {
          this.selectedHelp = null;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar las ayudas:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Maneja el cambio en el campo de búsqueda
   */
  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Realiza la búsqueda usando el servicio
   */
  private performSearch(term: string) {
    if (!this.entData?.id) {
      return;
    }

    this.loading = true;

    this.helpCenterService.searchHelps(this.entData.id, term).subscribe({
      next: (response) => {
        // La respuesta es paginada, extraer el contenido
        this.filteredHelpList = response.content || [];

        // Si hay elementos, seleccionar el primero por defecto
        if (this.filteredHelpList.length > 0) {
          this.selectHelp(this.filteredHelpList[0]);
        } else {
          this.selectedHelp = null;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error al buscar ayudas:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Selecciona una ayuda para mostrar su contenido
   */
  selectHelp(help: HelpCenterResponse) {
    this.selectedHelp = help;
  }

  /**
   * Verifica si una ayuda está seleccionada
   */
  isSelected(help: HelpCenterResponse): boolean {
    return this.selectedHelp?.id === help.id;
  }
}
