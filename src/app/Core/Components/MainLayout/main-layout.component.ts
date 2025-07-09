import { Component } from '@angular/core';
import { HeaderComponent } from '../Header/header.component';
import { SidebarComponent } from '../Sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, RouterOutlet],
  template: `
    <app-header></app-header>
    <div class="flex">
      <app-sidebar></app-sidebar>
      <div class="flex-1 bg-[#f6f6f6] min-h-screen">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class MainLayoutComponent {}
