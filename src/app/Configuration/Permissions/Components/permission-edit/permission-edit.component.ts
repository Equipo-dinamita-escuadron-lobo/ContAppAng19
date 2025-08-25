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
  roleName: string = '';
  permissions: any[] = []; // opciones agrupadas para multiselect
  currentPermissions: string[] = []; // los que ya tiene el rol
  initialFormValues: any = null;
  hasChanges: boolean = false;
  roleOptions: any[] = [];

  constructor() {
    this.editForm = this.fb.group({
      roleName: [{ value: '', disabled: true }, Validators.required], // Perfil no editable
      permissions: [[], Validators.required],
    });

    this.editForm.valueChanges.subscribe(() => this.checkForChanges());
  }

  ngOnInit(): void {
    this.roleName = this.route.snapshot.paramMap.get('role')!;
    this.loadPermissionsData();
  }

  // 🔹 Cargar permisos existentes + catálogo completo
  loadPermissionsData(): void {
    this.permissionsService.getRolesWithPermissions().subscribe({
      next: (rolesWithPerms) => {
        const role = rolesWithPerms.find((r) => r.role === this.roleName);

        if (role) {
          this.currentPermissions = role.permissions.map((p) => p.name);
          this.setFormValues(role.role, this.currentPermissions);
        }

        // cargar todos los permisos agrupados
        this.permissionsService.findAllPermissions().subscribe({
          next: (allPerms) => {
            const grouped: Record<string, any[]> = {};

            allPerms.forEach((perm) => {
              const moduleName = this.findModuleForPermission(perm.name);
              if (!grouped[moduleName]) grouped[moduleName] = [];
              grouped[moduleName].push({ label: perm.name, value: perm.name });
            });

            this.permissions = Object.keys(grouped).map((key) => ({
              label: key,
              items: grouped[key],
            }));
          },
          error: (err) =>
            console.error('Error cargando todos los permisos', err),
        });
      },
      error: (err) => console.error('Error cargando permisos del rol', err),
    });
  }

  private setFormValues(roleName: string, selectedPerms: string[]): void {
    this.roleOptions = [{ label: roleName, value: roleName }];

    this.editForm.patchValue({
      roleName,
      permissions: selectedPerms,
    });

    this.initialFormValues = {
      roleName,
      permissions: [...selectedPerms],
    };

    this.hasChanges = false;
  }

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
    // aquí puedes agregar más módulos como en permission-create
  ];

  private findModuleForPermission(permissionName: string): string {
    const nPerm = this.normalize(permissionName);
    const sorted = [...this.MODULES].sort((a, b) => b.length - a.length);

    for (const mod of sorted) {
      if (nPerm.includes(this.normalize(mod))) {
        return mod;
      }
    }

    const parts = permissionName.split(' ').filter(Boolean);
    const last2 = parts.slice(-2).join(' ');
    const last3 = parts.slice(-3).join(' ');
    return last3.length > 0 ? last3 : last2 || permissionName;
  }

  private checkForChanges(): void {
    if (!this.initialFormValues) {
      this.hasChanges = false;
      return;
    }

    const currentValues = this.editForm.getRawValue();

    const permissionsChanged =
      JSON.stringify(currentValues.permissions.sort()) !==
      JSON.stringify(this.initialFormValues.permissions.sort());

    this.hasChanges = permissionsChanged;
  }

  onSubmit(): void {
    if (this.editForm.valid && this.hasChanges) {
      const formValue = this.editForm.getRawValue();

      const request: AssignPermissionRequest = {
        roleName: this.roleName,
        permissionNames: formValue.permissions,
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
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach((key) => {
      const control = this.editForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/permissions/list']);
  }
}
