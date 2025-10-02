import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CostCenter, CostCenterNode } from '../../models/cost-center.model';
import { CostCenterService } from '../../services/cost-center.service';
import { CostCentersFormComponent } from '../cost-centers-form/cost-centers-form.component';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { SliderModule } from 'primeng/slider';

@Component({
  selector: 'app-cost-centers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    CostCentersFormComponent,
    ToggleSwitchModule,
    TagModule,
    TooltipModule,
    PaginatorModule,
    SliderModule
  ],
  templateUrl: './cost-centers-list.component.html',
  styleUrl: './cost-centers-list.component.css',
  providers: [MessageService, ConfirmationService]
})
export class CostCentersListComponent implements OnDestroy {
  filterAccount: string = '';

  // Data
  listCenters: CostCenterNode[] = [];
  listCentersAux: CostCenterNode[] = [];
  allCenters: CostCenterNode[] = []; // Lista completa de la página actual
  selected?: CostCenterNode;
  selectedPath: CostCenterNode[] = [];

  // Pagination
  first: number = 0;
  rows: number = 30;
  totalRecords: number = 0;

  // UI State
  showPrincipalForm = false;
  showButton = false;
  showButtonDelete = false;
  addChild = false;
  currentLevel: 'costo' | 'subcosto' | 'auxiliar costo' = 'costo';
  isCreatingRoot = false;
  isLoading = false;
  private sliderTimeout: any;

  // Forms
  form: FormGroup;
  private initialName: string = '';
  private initialCodeSegment: string = '';

  constructor(
    private fb: FormBuilder,
    private service: CostCenterService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.form = this.fb.group({
      codeSegment: [''],
      name: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadTree();
  }

  ngOnDestroy(): void {
    // Limpiar timeout para evitar memory leaks
    if (this.sliderTimeout) {
      clearTimeout(this.sliderTimeout);
    }
  }

  private getIdEnterprise(): string {
    const entData = localStorage.getItem('entData');
    if (entData) {
      return JSON.parse(entData).id;
    }
    return '';
  }

  private loadTree(expandCode?: string, selectCodeAfter?: string) {
    // Evitar múltiples llamadas simultáneas
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    // Calcular la página actual basada en el número de familias, no elementos individuales
    const currentPage = Math.floor(this.first / this.rows);
    
    this.service.findAll(this.getIdEnterprise(), currentPage, this.rows, this.filterAccount).subscribe({
      next: (page) => {
        this.totalRecords = page.totalElements;
        
        const list = page.content || [];
        const nodes = list.map(cc => ({
          ...cc,
          code: String(cc.code),
          children: [],
          showChildren: false,
          status: cc.status ?? true // Default a true si no está definido
        } as CostCenterNode));
        
        this.allCenters = this.buildHierarchy(nodes);
        this.listCenters = this.allCenters;
        this.listCentersAux = this.allCenters;

        if (expandCode) {
          this.expandByCode(expandCode);
        }
        if (selectCodeAfter) {
          const found = this.findByCode(selectCodeAfter);
          if (found) {
            this.select(found);
          }
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('No se pudo cargar Centros de Costo:', err);
        this.listCenters = [];
        this.allCenters = [];
        this.listCentersAux = [];
        this.totalRecords = 0;
        this.isLoading = false;
      }
    });
  }

  private buildHierarchy(flat: CostCenterNode[]): CostCenterNode[] {
    const byId = new Map<number, CostCenterNode>();
    const roots: CostCenterNode[] = [];
    flat.forEach(n => {
      if (n.id != null) byId.set(n.id, n);
    });
    flat.forEach(n => {
      if (n.parentId && byId.has(n.parentId)) {
        const parent = byId.get(n.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(n);
      } else {
        roots.push(n);
      }
    });
    // ordenar por código
    const sortRecursive = (arr: CostCenterNode[]) => {
      arr.sort((a,b) => a.code.localeCompare(b.code));
      arr.forEach(c => c.children && sortRecursive(c.children));
    };
    sortRecursive(roots);
    return roots;
  }

  toggle(node: CostCenterNode) {
    node.showChildren = !node.showChildren;
  }

  select(node: CostCenterNode) {
    this.selected = node;
    this.showPrincipalForm = true;
    this.showButton = true;
    this.showButtonDelete = true;
    this.addChild = false;
    this.updateCurrentLevel();
    this.computeSelectedPath();
    const parent = this.getSelectedParent();
    const parentCode = parent ? parent.code : '';
    const segment = node.code.startsWith(parentCode) ? node.code.slice(parentCode.length) : node.code;
    this.form.patchValue({ name: node.name, codeSegment: segment });
    this.initialName = node.name;
    this.initialCodeSegment = segment;
    this.setEditCodeValidators();
  }

  showFormAddNewRoot() {
    this.selected = undefined;
    this.showPrincipalForm = false;
    this.showButton = false;
    this.addChild = true;
    this.isCreatingRoot = true;
    this.currentLevel = 'costo';
  }

  addNewChild(level: 'subcosto' | 'auxiliar costo') {
    this.addChild = true;
    this.showButton = false;
    this.showPrincipalForm = true;
    this.currentLevel = level;
  }

  onFilterChange() {
    // Resetear a la primera página cuando se busca
    this.first = 0;
    // Recargar datos con el nuevo término de búsqueda
    this.loadTree();
  }

  /**
   * Actualiza los datos 
   */
  updatePaginatedData() {
    this.loadTree();
  }

  /**
   * Maneja el cambio en el slider de elementos por página con debounce
   */
  onSliderChange() {
    // Cancelar timeout anterior si existe
    if (this.sliderTimeout) {
      clearTimeout(this.sliderTimeout);
    }
    
    // Aplicar debounce de 300ms para evitar múltiples llamadas
    this.sliderTimeout = setTimeout(() => {
      this.first = 0; // Resetear a la primera página
      this.loadTree(); // Cargar con el nuevo tamaño
    }, 300);
  }



  /**
   * Maneja el cambio de página del paginador
   */
  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.loadTree();
  }

  updateSelected() {
    if (!this.selected || this.form.invalid) return;
    const enterprise = this.getIdEnterprise();
    const parent = this.getSelectedParent();
    const parentCode = parent ? parent.code : '';
    const newCode = `${parentCode}${this.form.get('codeSegment')!.value || ''}`;
    const payload: CostCenter = {
      id: this.selected.id,
      idEnterprise: enterprise,
      code: newCode,
      name: this.form.get('name')!.value,
      parentId: this.selected.parentId ?? undefined
    } as CostCenter;
    this.service.update(payload).subscribe({
      next: () => {
      // Mantener desplegada solo la rama del elemento actualizado
      this.loadTree(newCode, newCode);
      this.initialName = this.form.get('name')!.value;
      this.initialCodeSegment = this.form.get('codeSegment')!.value || '';
        this.messageService.add({ severity: 'success', summary: 'Actualización exitosa', detail: 'Centro de costo actualizado correctamente.' });
      },
      error: (err) => {
        if (err?.status === 409) {
          this.showDuplicateToast(err, 'actualizar');
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el centro de costo.' });
        }
      }
    });
  }

  confirmDeleteSelected(node: CostCenterNode) {
    if (!node) return;
    const name = node.name;
    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Desea eliminar el centro de costo "${name}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => this.deleteSelected(node),
    });
  }

  deleteSelected(node: CostCenterNode) {
    if (!node || node.id == null) return;
    const enterprise = this.getIdEnterprise();
    const parent = this.getSelectedParent(); // Podría necesitar un ajuste si el padre no es el seleccionado global
    const parentCode = parent ? parent.code : '';
    this.service.delete(node.id, enterprise).subscribe({
      next: () => {
        this.selected = undefined;
        this.showPrincipalForm = false;
        this.showButton = false;
        this.showButtonDelete = false;
        this.addChild = false;
        // Expandir el padre (si existe) y seleccionarlo
        if (parentCode) {
          this.loadTree(parentCode, parentCode);
        } else {
          this.loadTree();
        }
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Centro de costo eliminado.' });
      },
      error: (err) => {
        // Capturar específicamente el error 400 de cuenta con hijos
        if (err?.status === 400 && err?.error?.code === 'COST_CENTER_HAS_CHILDREN') {
          const body = err.error || {};
          const message: string = body.message || body.detail || 'No se puede eliminar el centro de costo porque tiene subcuentas asociadas.';
          this.messageService.add({
            severity: 'info',
            summary: 'No se puede eliminar',
            detail: message,
            life: 6000
          });
        } else {
          // Para otros errores, mostrar mensaje genérico
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el centro de costo.'
          });
        }
      }
    });
  }

  changeCostCenterState(costCenter: CostCenterNode) {
    const enterpriseId = this.getIdEnterprise();
    if (!costCenter?.id || !enterpriseId || costCenter.status == null) {
      // Revertir el estado en la UI si la validación falla
      if (costCenter.status != null) {
        costCenter.status = !costCenter.status;
      }
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Faltan datos para cambiar el estado del centro de costo.'
      });
      return;
    }

    const newStatus = costCenter.status;

    this.service.changeState(costCenter.id, enterpriseId, newStatus).subscribe({
      next: () => {
        // Actualizar recursivamente el estado de todos los hijos en la UI
        this.updateChildrenStatusRecursively(costCenter, newStatus);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado del centro de costo "${costCenter.name}" cambiado correctamente`
        });
      },
      error: () => {
        // Revertir el estado en la UI del padre y todos los hijos si la llamada al servicio falla
        costCenter.status = !newStatus;
        this.updateChildrenStatusRecursively(costCenter, !newStatus);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado del centro de costo.'
        });
      }
    });
  }

  /**
   * Actualiza recursivamente el estado de todos los centros de costo hijos en la UI
   * @param parent Centro de costo padre
   * @param status Nuevo estado a aplicar
   */
  private updateChildrenStatusRecursively(parent: CostCenterNode, status: boolean): void {
    if (parent.children && parent.children.length > 0) {
      for (const child of parent.children) {
        child.status = status;
        // Actualizar recursivamente los hijos de este hijo
        this.updateChildrenStatusRecursively(child, status);
      }
    }
  }

  cancelChild() {
    this.addChild = false;
    this.isCreatingRoot = false;
    this.showButton = !!this.selected;
    this.showPrincipalForm = !!this.selected;
    this.updateCurrentLevel();
  }
  
  private updateCurrentLevel() {
    const len = this.selected ? this.selected.code.length : 0;
    if (len <= 2) this.currentLevel = 'costo';
    else if (len <= 4) this.currentLevel = 'subcosto';
    else this.currentLevel = 'auxiliar costo';
  }

  private getSelectedParent(): CostCenterNode | undefined {
    if (!this.selected || !this.selected.parentId) return undefined;
    const stack: CostCenterNode[] = [...this.listCenters];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.id === this.selected!.parentId) return n;
      if (n.children) stack.push(...n.children);
    }
    return undefined;
  }

  private computeSelectedPath() {
    this.selectedPath = [];
    if (!this.selected) return;
    const path: CostCenterNode[] = [];
    const build = (nodes: CostCenterNode[], targetId?: number): boolean => {
      for (const n of nodes) {
        path.push(n);
        if (n.id === targetId) return true;
        if (n.children && build(n.children, targetId)) return true;
        path.pop();
      }
      return false;
    };
    // Ensure we start from roots
    build(this.listCenters, this.selected.id);
    this.selectedPath = [...path];
  }

  getPathParentPrefix(index: number): string {
    if (index <= 0) return '';
    return this.selectedPath[index - 1]?.code || '';
  }

  getPathSegment(index: number): string {
    const node = this.selectedPath[index];
    if (!node) return '';
    const prefix = this.getPathParentPrefix(index);
    return node.code.startsWith(prefix) ? node.code.slice(prefix.length) : node.code;
  }

  private setEditCodeValidators() {
    const control = this.form.get('codeSegment');
    if (!control) return;
    if (this.currentLevel === 'auxiliar costo') {
      control.setValidators([Validators.required, Validators.maxLength(28), Validators.pattern('^[a-zA-Z0-9]+$')]);
    } else {
      control.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(2), Validators.pattern('^[0-9]{2}$')]);
    }
    control.updateValueAndValidity();
  }

  onEditCodeKeyDown(event: KeyboardEvent) {
    if (this.currentLevel === 'auxiliar costo') return;
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (allowed.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  onEditCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value || '';
    if (this.currentLevel === 'auxiliar costo') {
      let value = raw.replace(/[^a-zA-Z0-9]/g, '');
      if (value.length > 28) value = value.slice(0, 28);
      input.value = value;
      this.form.get('codeSegment')?.setValue(value);
      return;
    }
    let value = raw.replace(/[^0-9]/g, '');
    if (value.length > 2) value = value.slice(0, 2);
    input.value = value;
    this.form.get('codeSegment')?.setValue(value);
  }

  hasChanges(): boolean {
    const currentName = this.form.get('name')!.value || '';
    const currentSegment = this.form.get('codeSegment')!.value || '';
    return currentName !== this.initialName || currentSegment !== this.initialCodeSegment;
  }

  onChildSubmitted(ev: { codeSegment: string; name: string }) {
    const enterprise = this.getIdEnterprise();
    const parent = this.selected || null;
    const parentId = parent?.id ?? null;
    const code = (parent ? parent.code : '') + ev.codeSegment;
    const payload: CostCenter = {
      idEnterprise: enterprise,
      code: code,
      name: ev.name,
      parentId: parentId ?? undefined
    };

    this.service.create(payload).subscribe({
      next: (created) => {
        const createdCode = String(created.code);
        this.addChild = false;
        this.isCreatingRoot = false;
        // Recargar: expandir y seleccionar el recién creado; otras ramas cerradas
        this.loadTree(createdCode, createdCode);
        this.messageService.add({ severity: 'success', summary: 'Registro exitoso', detail: 'Centro de costo creado correctamente.' });
      },
      error: (err) => {
        if (err?.status === 409) {
          this.showDuplicateToast(err, 'crear');
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el centro de costo.' });
        }
      }
    });
  }

  private showDuplicateToast(err: any, action: 'crear' | 'actualizar') {
    const body = err?.error || {};
    const message: string = body.message || body.detail || '';
    const codeField = body.code || body.error || '';

    // Intentar inferir por mensaje
    const codeMatch = message.match(/c[óo]digo\s+([A-Za-z0-9]+)/i);
    const nameMatch = message.match(/nombre\s+'([^']+)'/i);

    if (codeMatch) {
      const dupCode = codeMatch[1];
      this.messageService.add({
        severity: 'error',
        summary: action === 'crear' ? 'Código duplicado' : 'Código ya existente',
        detail: `El código ${dupCode} ya existe para otro centro de costo.`
      });
      return;
    }

    if (nameMatch) {
      const dupName = nameMatch[1];
      this.messageService.add({
        severity: 'error',
        summary: action === 'crear' ? 'Nombre duplicado' : 'Nombre ya existente',
        detail: `El nombre "${dupName}" ya existe para otro centro de costo.`
      });
      return;
    }

    // Fallback genérico con el mensaje del backend si existe
    if (message) {
      this.messageService.add({ severity: 'error', summary: 'Duplicado', detail: message });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Duplicado', detail: 'Ya existe un centro de costo con el mismo código o nombre.' });
    }
  }

  private findByCode(code: string): CostCenterNode | undefined {
    const stack: CostCenterNode[] = [...this.listCenters];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.code === code) return n;
      if (n.children) stack.push(...n.children);
    }
    return undefined;
  }

  private expandByCode(code: string) {
    const walk = (nodes: CostCenterNode[]) => {
      for (const n of nodes) {
        if (code.startsWith(n.code) && n.code.length < code.length) {
          n.showChildren = true;
          if (n.children) walk(n.children);
        }
      }
    };
    walk(this.listCenters);
  }

  onCodeKeyDown(event: KeyboardEvent, maxLength: number) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
    if (allowed.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
    const target = event.target as HTMLInputElement;
    if (target.value.length >= maxLength) event.preventDefault();
  }

  onCodeInput(event: Event, maxLength: number) {
    const input = event.target as HTMLInputElement;
    let value = (input.value || '').replace(/[^0-9]/g, '');
    if (value.length > maxLength) value = value.slice(0, maxLength);
    input.value = value;
  }

  onNameKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const allowed = ['Backspace','Delete','Tab','Escape','Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
    if (allowed.includes(event.key)) return;
    const pattern = /^[a-zA-ZÀ-ÿ\u00f1\u00d10-9,.()\/\-+&%]$/;
    if (!pattern.test(event.key)) event.preventDefault();
  }
}
