import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
    CostCentersFormComponent
  ],
  templateUrl: './cost-centers-list.component.html',
  styleUrl: './cost-centers-list.component.css',
  providers: [MessageService, ConfirmationService]
})
export class CostCentersListComponent {
  filterAccount: string = '';

  // Data
  listCenters: CostCenterNode[] = [];
  listCentersAux: CostCenterNode[] = [];
  selected?: CostCenterNode;
  selectedPath: CostCenterNode[] = [];

  // UI State
  showPrincipalForm = false;
  showButton = false;
  showButtonDelete = false;
  addChild = false;
  currentLevel: 'cuenta' | 'subcuenta' | 'auxiliar' = 'cuenta';
  isCreatingRoot = false;

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
      name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\u00f1\u00d1,.()\/ +&%-]+$')]]
    });
  }

  ngOnInit(): void {
    this.loadTree();
  }

  private getIdEnterprise(): string {
    const entData = localStorage.getItem('entData');
    if (entData) {
      return JSON.parse(entData).id;
    }
    return '';
  }

  private loadTree(expandCode?: string, selectCodeAfter?: string) {
    this.service.findAll(this.getIdEnterprise()).subscribe({
      next: (page) => {
        const list = page.content || [];
        const nodes = list.map(cc => ({
          ...cc,
          code: String(cc.code),
          children: [],
          showChildren: false
        } as CostCenterNode));
        this.listCenters = this.buildHierarchy(nodes);
        this.listCentersAux = this.listCenters;

        if (expandCode) {
          this.expandByCode(expandCode);
        }
        if (selectCodeAfter) {
          const found = this.findByCode(selectCodeAfter);
          if (found) {
            this.select(found);
          }
        }
      },
      error: (err) => {
        console.error('No se pudo cargar Centros de Costo:', err);
        this.listCenters = [];
        this.listCentersAux = [];
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
    this.currentLevel = 'cuenta';
  }

  addNewChild(level: 'subcuenta' | 'auxiliar') {
    this.addChild = true;
    this.showButton = false;
    this.showPrincipalForm = true;
    this.currentLevel = level;
  }

  onFilterChange() {
    const term = (this.filterAccount || '').toLowerCase().trim();
    if (!term) {
      this.listCentersAux = this.listCenters;
      return;
    }
    const filterRecursive = (nodes: CostCenterNode[]): CostCenterNode[] => {
      const result: CostCenterNode[] = [];
      for (const n of nodes) {
        const children = n.children ? filterRecursive(n.children) : [];
        const matches = n.code.toLowerCase().includes(term) || n.name.toLowerCase().includes(term);
        if (matches || children.length) {
          const copy: CostCenterNode = { ...n, children };
          copy.showChildren = children.length > 0;
          result.push(copy);
        }
      }
      return result;
    };
    this.listCentersAux = filterRecursive(this.listCenters);
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

  confirmDeleteSelected() {
    if (!this.selected) return;
    const name = this.selected.name;
    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Desea eliminar el centro de costo "${name}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => this.deleteSelected(),
    });
  }

  deleteSelected() {
    if (!this.selected || this.selected.id == null) return;
    const enterprise = this.getIdEnterprise();
    const parent = this.getSelectedParent();
    const parentCode = parent ? parent.code : '';
    this.service.delete(this.selected.id, enterprise).subscribe(() => {
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
    });
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
    if (len <= 2) this.currentLevel = 'cuenta';
    else if (len <= 4) this.currentLevel = 'subcuenta';
    else this.currentLevel = 'auxiliar';
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
    if (this.currentLevel === 'auxiliar') {
      control.setValidators([Validators.required, Validators.maxLength(28), Validators.pattern('^[a-zA-Z0-9]+$')]);
    } else {
      control.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(2), Validators.pattern('^[0-9]{2}$')]);
    }
    control.updateValueAndValidity();
  }

  onEditCodeKeyDown(event: KeyboardEvent) {
    if (this.currentLevel === 'auxiliar') return;
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (allowed.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  onEditCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value || '';
    if (this.currentLevel === 'auxiliar') {
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
    const pattern = /^[a-zA-ZÀ-ÿ\u00f1\u00d1,.()\/\-+&%]$/;
    if (!pattern.test(event.key)) event.preventDefault();
  }
}
