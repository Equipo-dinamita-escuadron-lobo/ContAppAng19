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
  permissions: any[] = []; // 👈 aquí estarán agrupados para el multiselect

  // 📌 Catálogo de módulos (puedes mantenerlo aquí o traerlo desde el backend)
  private readonly MODULES = [
    'Unidad de Medida',
    'Empresa',
    // Agrega más módulos aquí si los tienes: 'Usuarios', 'Roles', 'Permisos', ...
  ];

  constructor() {
    this.assignForm = this.fb.group({
      roleName: ['', Validators.required],
      permissions: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadProfiles();
    this.loadPermissions();
  }

  loadProfiles(): void {
    this.profileService.getAllProfiles().subscribe({
      next: (allProfiles) => {
        this.permissionsService.getRolesWithPermissions().subscribe({
          next: (rolesWithPerms) => {
            const rolesConPermisos = rolesWithPerms.map((r) => r.role);
            this.profiles = allProfiles.filter(
              (p) => !rolesConPermisos.includes(p.name)
            );
          },
          error: (err) =>
            console.error('Error cargando roles con permisos', err),
        });
      },
      error: (err) => console.error('Error cargando perfiles', err),
    });
  }

  // 🔎 utilidades
  private normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '') // quita acentos
      .toLowerCase()
      .trim();
  }

  /** Devuelve el módulo más largo que aparezca dentro del permiso */
  private findModuleForPermission(permissionName: string): string {
    const nPerm = this.normalize(permissionName);

    // ordenar por longitud desc para priorizar matches más específicos
    const sorted = [...this.MODULES].sort((a, b) => b.length - a.length);

    for (const mod of sorted) {
      if (nPerm.includes(this.normalize(mod))) {
        return mod;
      }
    }

    // fallback: últimas palabras
    const parts = permissionName.split(' ').filter(Boolean);
    const last2 = parts.slice(-2).join(' ');
    const last3 = parts.slice(-3).join(' ');
    return last3.length > 0 ? last3 : last2 || permissionName;
  }

  loadPermissions(): void {
    this.permissionsService.findAllPermissions().subscribe({
      next: (data) => {
        const grouped: Record<string, any[]> = {};

        data.forEach((perm) => {
          const moduleName = this.findModuleForPermission(perm.name);
          if (!grouped[moduleName]) grouped[moduleName] = [];
          grouped[moduleName].push({ label: perm.name, value: perm.name });
        });

        this.permissions = Object.keys(grouped).map((key) => ({
          label: key,
          items: grouped[key],
        }));
      },
      error: (err) => console.error('Error cargando permisos', err),
    });
  }

  onSubmit(): void {
    if (this.assignForm.valid) {
      const formValue = this.assignForm.value;

      const request: AssignPermissionRequest = {
        permissionNames: formValue.permissions,
        roleName: formValue.roleName,
      };

      const orderedBody = {
        permissionNames: request.permissionNames,
        roleName: request.roleName,
      };

      console.log(
        '📤 JSON que se envía al backend:',
        JSON.stringify(request, null, 2)
      );

      this.permissionsService.addPolicyToPermissions(orderedBody).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Permisos asignados correctamente!',
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
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.assignForm.controls).forEach((key) => {
      const control = this.assignForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/permissions/list']);
  }
}
