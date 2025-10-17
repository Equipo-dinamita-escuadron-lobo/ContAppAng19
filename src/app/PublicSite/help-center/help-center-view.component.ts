import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpCenterService } from './services/help-center.service';
import { HelpCenterResponse } from './models/HelpCenterResponse';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { TabMenuModule } from 'primeng/tabmenu';
import { MenuItem } from 'primeng/api';

interface Module {
  id: number;
  name: string;
}

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
    FormsModule,
    TabMenuModule
  ],
  templateUrl: './help-center-view.component.html',
  styleUrl: './help-center-view.component.css'
})
export class HelpCenterViewComponent implements OnInit {

  constructor(private helpCenterService: HelpCenterService) {}

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

  // Módulos disponibles
  modules: Module[] = [];

  // Módulo seleccionado (null = todos)
  selectedModuleId: number | null = null;

  // Subject para debounce de búsqueda
  private searchSubject = new Subject<string>();

  // Items del menú de tabs
  menuItems: MenuItem[] = [];

  ngOnInit() {
    this.loadModules();

    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(term => {
      this.performSearch();
    });
  }

  /**
   * Carga los módulos disponibles desde el backend
   */
  loadModules() {
    this.helpCenterService.getModules().subscribe({
      next: (modules) => {
        this.modules = modules;

        // Crear items del menú
        this.menuItems = [
          {
            label: 'Todos',
            icon: 'pi pi-list',
            command: () => this.onModuleChange(null)
          },
          ...modules.map(module => ({
            label: module.name,
            icon: this.getModuleIcon(module.id),
            command: () => this.onModuleChange(module.id)
          }))
        ];

        // Cargar todas las ayudas inicialmente
        this.loadAllHelps();
      },
      error: (error) => {
        console.error('Error al cargar los módulos:', error);
        this.loadAllHelps(); // Intentar cargar ayudas aunque fallen los módulos
      }
    });
  }

  /**
   * Obtiene el icono apropiado para cada módulo
   */
  getModuleIcon(moduleId: number): string {
    const icons: { [key: number]: string } = {
      1: 'pi pi-chart-line',        // Inventario promedio ponderado
      2: 'pi pi-shopping-cart',     // Inventario PEPS
      3: 'pi pi-shopping-bag',      // Comercial
      4: 'pi pi-wallet',            // Tesorería
      5: 'pi pi-credit-card',       // Cartera
      6: 'pi pi-book',              // Contable comercial
      7: 'pi pi-briefcase',         // Contable cartera
      8: 'pi pi-chart-bar',         // Estados financieros
      9: 'pi pi-cog'                // Configuración
    };
    return icons[moduleId] || 'pi pi-folder';
  }

  /**
   * Maneja el cambio de módulo seleccionado
   */
  onModuleChange(moduleId: number | null) {
    this.selectedModuleId = moduleId;
    this.searchTerm = ''; // Limpiar búsqueda al cambiar módulo

    if (moduleId === null) {
      this.loadAllHelps();
    } else {
      this.loadHelpsByModule(moduleId);
    }
  }

  /**
   * Carga todas las ayudas disponibles
   */
  loadAllHelps() {
    this.loading = true;

    this.helpCenterService.searchHelps('').subscribe({
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
   * Carga las ayudas de un módulo específico
   */
  loadHelpsByModule(moduleId: number) {
    this.loading = true;

    this.helpCenterService.findAllByModule(moduleId).subscribe({
      next: (helps) => {
        this.helpList = helps;
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
        console.error('Error al cargar las ayudas del módulo:', error);
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
   * Realiza la búsqueda
   */
  private performSearch() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      // Si no hay término de búsqueda, recargar según el módulo seleccionado
      if (this.selectedModuleId === null) {
        this.loadAllHelps();
      } else {
        this.loadHelpsByModule(this.selectedModuleId);
      }
      return;
    }

    this.loading = true;

    // Si hay un módulo seleccionado, filtrar localmente
    if (this.selectedModuleId !== null) {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredHelpList = this.helpList.filter(help =>
        help.name.toLowerCase().includes(searchLower) ||
        help.description.toLowerCase().includes(searchLower) ||
        help.moduleName.toLowerCase().includes(searchLower)
      );

      if (this.filteredHelpList.length > 0) {
        this.selectHelp(this.filteredHelpList[0]);
      } else {
        this.selectedHelp = null;
      }

      this.loading = false;
    } else {
      // Si no hay módulo seleccionado, buscar en el backend
      this.helpCenterService.searchHelps(this.searchTerm).subscribe({
        next: (response) => {
          this.filteredHelpList = response.content || [];

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
