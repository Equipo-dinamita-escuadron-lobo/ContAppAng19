import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { ProfileService } from '../../../Profiles/Services/profile.service';
import { PermissionsService } from '../../Services/permission.service';
import { ProfileList } from '../../../Profiles/Models/Profile';
import { AssignPermissionRequest } from '../../Models/Permission';

type Option = { label: string; value: string };

@Component({
  selector: 'app-permissions-assign',
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
  templateUrl: './permission-create.component.html',
  styleUrl: './permission-create.component.css',
})
export class PermissionCreateComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly profileService = inject(ProfileService);
  private readonly permissionsService = inject(PermissionsService);

  assignForm: FormGroup;

  profiles: ProfileList[] = [];
  moduleOptions: { label: string; value: string }[] = [];
  modulePermissionsOptions: Option[] = [];
  private permissionsByModule = new Map<string, Option[]>();
  selectedPermissions = new Set<string>();

  constructor() {
    this.assignForm = this.fb.group({
      roleName: ['', Validators.required],
      module: [{ value: '', disabled: true }],
      modulePermissions: [{ value: [], disabled: true }],
    });
  }

  ngOnInit(): void {
    this.loadProfiles();
    this.loadAndGroupPermissions();

    // Habilitar/deshabilitar según perfil
    this.assignForm.get('roleName')!.valueChanges.subscribe((val) => {
      const hasRole = !!val;
      const moduleCtrl = this.assignForm.get('module')!;
      const permsCtrl = this.assignForm.get('modulePermissions')!;

      if (hasRole) {
        moduleCtrl.enable({ emitEvent: false });
      } else {
        moduleCtrl.disable({ emitEvent: false });
        permsCtrl.disable({ emitEvent: false });
        this.assignForm.patchValue(
          { module: '', modulePermissions: [] },
          { emitEvent: false }
        );
        this.modulePermissionsOptions = [];
        this.selectedPermissions.clear();
      }
    });

    // Habilitar/deshabilitar permisos según módulo
    this.assignForm.get('module')!.valueChanges.subscribe((mod) => {
      const permsCtrl = this.assignForm.get('modulePermissions')!;
      const roleSelected = !!this.assignForm.get('roleName')!.value;

      const opts = this.permissionsByModule.get(mod ?? '') ?? [];
      this.modulePermissionsOptions = opts;
      this.assignForm.get('modulePermissions')?.setValue([]);

      if (roleSelected && mod) {
        permsCtrl.enable({ emitEvent: false });
      } else {
        permsCtrl.disable({ emitEvent: false });
        this.assignForm.patchValue(
          { modulePermissions: [] },
          { emitEvent: false }
        );
      }
    });
  }

  // ---------- Carga ----------
  loadProfiles(): void {
    this.profileService.getAllProfiles().subscribe({
      next: (allProfiles) => {
        this.permissionsService.getRolesWithPermissions().subscribe({
          next: (rolesWithPerms) => {
            const normalize = (s: string) => (s ?? '').trim().toLowerCase();
            const rolesConPermisos = new Set(
              rolesWithPerms.map((r) => normalize(r.role))
            );
            this.profiles = allProfiles.filter(
              (p) => !rolesConPermisos.has(normalize(p.name))
            );
          },
          error: (err) => {
            console.error('Error cargando roles con permisos', err);
            this.profiles = [];
          },
        });
      },
      error: (err) => {
        console.error('Error cargando perfiles', err);
        this.profiles = [];
      },
    });
  }

  loadAndGroupPermissions(): void {
    this.permissionsService.findAllPermissions().subscribe({
      next: (data) => {
        const grouped: Record<string, Option[]> = {};

        data.forEach((perm) => {
          const moduleName = this.findModuleForPermission(perm.name);
          (grouped[moduleName] ||= []).push({
            label: perm.name,
            value: perm.name,
          });
        });

        this.permissionsByModule.clear();
        Object.keys(grouped)
          .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
          .forEach((m) => {
            grouped[m].sort((a, b) =>
              a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
            );
            this.permissionsByModule.set(m, grouped[m]);
          });

        this.moduleOptions = Array.from(this.permissionsByModule.keys()).map(
          (m) => ({ label: m, value: m })
        );
      },
      error: (err) => console.error('Error cargando permisos', err),
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

  private findModuleForPermission(permissionName: string): string {
    const MODULES = [
      'Unidad de Medida',
      'Empresa',
      'Tipo de Producto',
      'Categoria',
      'Producto',
    ];
    const nPerm = this.normalize(permissionName);
    const sorted = [...MODULES].sort((a, b) => b.length - a.length);
    for (const mod of sorted) {
      if (nPerm.includes(this.normalize(mod))) return mod;
    }
    const parts = permissionName.split(' ').filter(Boolean);
    const last3 = parts.slice(-3).join(' ');
    const last2 = parts.slice(-2).join(' ');
    return last3 || last2 || permissionName;
  }

  // ---------- Interacciones ----------
  onModuleChange(): void {
    const currentModule: string = this.assignForm.get('module')?.value;
    const opts = this.permissionsByModule.get(currentModule ?? '') ?? [];
    this.modulePermissionsOptions = opts;
    this.assignForm.get('modulePermissions')?.setValue([]);
  }

  addSelectedPermissions(): void {
    const picked: string[] =
      this.assignForm.get('modulePermissions')?.value ?? [];
    if (!picked.length) return;

    picked.forEach((p) => this.selectedPermissions.add(p));
    this.assignForm.get('modulePermissions')?.setValue([]);

    this.messageService.add({
      severity: 'success',
      summary: 'Agregado',
      detail:
        'Permisos agregados. Puedes cambiar de módulo y seguir agregando.',
      life: 2000,
    });
  }

  clearCurrentSelection(): void {
    this.assignForm.get('modulePermissions')?.setValue([]);
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

  // ---------- Envío ----------
  onSubmit(): void {
    if (this.assignForm.invalid || this.selectedPermissions.size === 0) {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Faltan datos',
        detail: 'Selecciona un perfil y agrega al menos un permiso.',
      });
      return;
    }

    const request: AssignPermissionRequest = {
      roleName: this.assignForm.value.roleName,
      permissionNames: Array.from(this.selectedPermissions),
    };

    this.permissionsService.addPolicyToPermissions(request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Permisos asignados correctamente',
          life: 3000,
        });
        setTimeout(() => this.goBack(), 3000);
      },
      error: (err) => {
        console.error('Error asignando permisos:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron asignar los permisos.',
        });
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.assignForm.controls).forEach((key) => {
      this.assignForm.get(key)?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/permissions/list']);
  }
}
