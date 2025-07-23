import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../Core/auth/services/auth.service';

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
  ];

  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('admin_realm');
  }

  goTo(route: string): void {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
