import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../Core/auth/services/auth.service';
import { ProfileService } from '../../Profiles/Services/profile.service';

@Component({
  standalone: true,
  selector: 'app-configuration-main',
  imports: [CommonModule],
  templateUrl: './configuration-main.component.html',
  styleUrls: ['./configuration-main.component.css'],
})
export class ConfigurationMainComponent implements OnInit {
  configItems = [
    {
      name: 'Gestión de usuarios',
      route: '/configuration/users/list',
      type: 'usuarios',
      amount: 12,
      icon: 'group',
    },
    {
      name: 'Gestión de Perfiles',
      route: '/configuration/profiles/list',
      type: 'perfiles',
      amount: 4,
      icon: 'admin_panel_settings',
    },
    {
      name: 'Gestión de Permisos',
      route: '/configuration/permissions/list',
      type: 'permisos',
      amount: 8,
      icon: 'lock',
    },
  ];

  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('admin_realm');

    // Obtener la cantidad de perfiles dinámicamente
    this.profileService.getProfilesCount().subscribe((count) => {
      // Actualizar el número de perfiles en la configuración
      const profileConfig = this.configItems.find(
        (item) => item.type === 'perfiles'
      );
      if (profileConfig) {
        profileConfig.amount = count; // Actualiza el valor de 'amount'
      }
    });
  }

  goTo(route: string): void {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
