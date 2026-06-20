import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { PermissionsService } from '../../Services/permission.service';
import {
  AssignPermissionRequest,
  RolesWithPermissions,
} from '../../Models/Permission';

type Option = { label: string; value: string };

@Component({
  selector: 'app-permission-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    MultiSelectModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './permission-edit.component.html',
  styleUrl: './permission-edit.component.css',
})
export class PermissionEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly permissionsService = inject(PermissionsService);

  editForm: FormGroup;

  // Datos de cabecera
  roleName = '';
  roleOptions: { label: string; value: string }[] = [];

  // Catálogo y organización
  private permissionsByModule = new Map<string, Option[]>();
  moduleOptions: { label: string; value: string }[] = [];
  modulePermissionsOptions: Option[] = [];

  // Estado de edición
  currentPermissions: string[] = []; // baseline original
  selectedPermissions = new Set<string>(); // acumulador global editable
  initialFormValues: { permissions: string[] } | null = null;
  hasChanges = false;

  // Nuevo: habilitación del botón "Aplicar cambios"
  moduleHasChanges = false;

  constructor() {
    this.editForm = this.fb.group({
      roleName: [{ value: '', disabled: true }, Validators.required],
      module: [{ value: '', disabled: true }],
      modulePermissions: [{ value: [], disabled: true }],
    });

    // Cambios globales → recalcular si hay cambios vs baseline (para el botón "Actualizar Permisos")
    this.editForm.valueChanges.subscribe(() => this.checkForChanges());

    // Cambios en el multiselect del módulo → habilitar/deshabilitar "Aplicar cambios"
    this.editForm.get('modulePermissions')!.valueChanges.subscribe(() => {
      this.recomputeModuleHasChanges();
    });
  }

  ngOnInit(): void {
    this.roleName = this.route.snapshot.paramMap.get('role')!;
    this.loadPermissionsData();
  }

  // ---------- Carga de datos ----------
  loadPermissionsData(): void {
    this.permissionsService.getRolesWithPermissions().subscribe({
      next: (rolesWithPerms: RolesWithPermissions[]) => {
        const role = rolesWithPerms.find((r) => r.role === this.roleName);

        if (role) {
          this.currentPermissions = role.permissions
            .map((p) => p.name)
            .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

          this.selectedPermissions = new Set(this.currentPermissions);

          this.roleOptions = [{ label: role.role, value: role.role }];
          this.editForm.patchValue(
            { roleName: role.role },
            { emitEvent: false }
          );

          this.initialFormValues = {
            permissions: [...this.currentPermissions],
          };
        }

        this.permissionsService.findAllPermissions().subscribe({
          next: (allPerms) => {
            const grouped: Record<string, Option[]> = {};

            allPerms.forEach((perm) => {
              const moduleName = this.findModuleForPermission(perm.name);
              (grouped[moduleName] ||= []).push({
                label: perm.name,
                value: perm.name,
              });
            });

            Object.keys(grouped).forEach((m) => {
              grouped[m].sort((a, b) =>
                a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
              );
            });

            this.permissionsByModule.clear();
            Object.keys(grouped)
              .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
              .forEach((m) => this.permissionsByModule.set(m, grouped[m]));

            this.moduleOptions = Array.from(
              this.permissionsByModule.keys()
            ).map((m) => ({ label: m, value: m }));

            this.editForm.get('module')?.enable({ emitEvent: false });
          },
          error: (err) =>
            console.error('Error cargando todos los permisos', err),
        });
      },
      error: (err) => console.error('Error cargando permisos del rol', err),
    });
  }

  // ---------- Utilidades ----------
  private normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  private readonly MODULES = [
    'Unidad de Medida',
    'Empresa',
    'Tipo de Producto',
    'Categoria',
    'Producto',
  ];

  private findModuleForPermission(permissionName: string): string {
    const nPerm = this.normalize(permissionName);
    const sorted = [...this.MODULES].sort((a, b) => b.length - a.length);
    for (const mod of sorted) {
      if (nPerm.includes(this.normalize(mod))) return mod;
    }
    const parts = permissionName.split(' ').filter(Boolean);
    const last2 = parts.slice(-2).join(' ');
    const last3 = parts.slice(-3).join(' ');
    return last3.length > 0 ? last3 : last2 || permissionName;
  }

  private getUniverseForModule(mod: string): string[] {
    return (this.permissionsByModule.get(mod) ?? []).map((o) => o.value);
  }

  private getBaselineForModule(mod: string): string[] {
    const universe = new Set(this.getUniverseForModule(mod));
    return Array.from(this.selectedPermissions).filter((p) => universe.has(p));
  }

  // ---------- Interacciones ----------
  onModuleChange(): void {
    const mod: string = this.editForm.get('module')?.value;
    const opts = this.permissionsByModule.get(mod ?? '') ?? [];
    this.modulePermissionsOptions = opts;

    // Preseleccionar según lo que ya tiene el rol para ese módulo
    const preselected = this.getBaselineForModule(mod);
    this.editForm
      .get('modulePermissions')
      ?.setValue(preselected, { emitEvent: false });

    if (mod) {
      this.editForm.get('modulePermissions')?.enable({ emitEvent: false });
    } else {
      this.editForm.get('modulePermissions')?.disable({ emitEvent: false });
      this.editForm.patchValue({ modulePermissions: [] }, { emitEvent: false });
    }

    // Justo al cambiar de módulo (recién precargado) → aún no hay cambios
    this.moduleHasChanges = false;
  }

  /** Recalcula si el multiselect difiere del baseline del módulo actual */
  private recomputeModuleHasChanges(): void {
    const mod: string = this.editForm.get('module')?.value;
    if (!mod) {
      this.moduleHasChanges = false;
      return;
    }
    const baseline = this.getBaselineForModule(mod).slice().sort();
    const picked: string[] = (
      this.editForm.get('modulePermissions')?.value ?? []
    )
      .slice()
      .sort();

    this.moduleHasChanges = JSON.stringify(baseline) !== JSON.stringify(picked);
  }

  /** Aplica cambios SOLO del módulo actual en el acumulador global */
  applyModuleChanges(): void {
    const mod: string = this.editForm.get('module')?.value;
    if (!mod) return;

    const universe = new Set(this.getUniverseForModule(mod));
    const picked: string[] =
      this.editForm.get('modulePermissions')?.value ?? [];

    // Quitar los del módulo que ya no están
    for (const p of Array.from(this.selectedPermissions)) {
      if (universe.has(p) && !picked.includes(p))
        this.selectedPermissions.delete(p);
    }
    // Agregar los seleccionados
    for (const p of picked) this.selectedPermissions.add(p);

    this.messageService.add({
      severity: 'success',
      summary: 'Módulo actualizado',
      detail: 'Cambios aplicados para el módulo seleccionado.',
      life: 2000,
    });

    // Tras aplicar, ya no hay cambios pendientes del módulo
    this.moduleHasChanges = false;
    this.checkForChanges();
  }

  clearCurrentSelection(): void {
    this.editForm.get('modulePermissions')?.setValue([]);
  }

  get groupedSelectedPermissions(): { module: string; items: string[] }[] {
    const result: { module: string; items: string[] }[] = [];
    for (const [module, options] of this.permissionsByModule.entries()) {
      const items = options
        .map((o) => o.value)
        .filter((v) => this.selectedPermissions.has(v));
      if (items.length) result.push({ module, items });
    }
    result.sort((a, b) =>
      a.module.localeCompare(b.module, 'es', { sensitivity: 'base' })
    );
    return result;
  }

  // ---------- Estado / Envío ----------
  private checkForChanges(): void {
    if (!this.initialFormValues) {
      this.hasChanges = false;
      return;
    }
    const now = Array.from(this.selectedPermissions).sort();
    const baseline = [...this.initialFormValues.permissions].sort();
    this.hasChanges = JSON.stringify(now) !== JSON.stringify(baseline);
  }

  onSubmit(): void {
    if (this.selectedPermissions.size === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Debe mantener al menos un permiso.',
      });
      this.editForm.get('modulePermissions')?.markAsTouched();
      return;
    }
    if (!this.hasChanges) return;

    const request: AssignPermissionRequest = {
      roleName: this.roleName,
      permissionNames: Array.from(this.selectedPermissions),
    };

    this.permissionsService.updatePermissions(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Permisos actualizados correctamente!',
          life: 3000,
        });
        setTimeout(() => this.goBack(), 1500);
      },
      error: (err) => {
        console.error('Error actualizando permisos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron actualizar los permisos.',
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/permissions/list']);
  }
}
