import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './Core/Components/Header/header.component';
import { SideNavBarComponent } from './Core/Components/SideNavBar/side-nav-bar.component';
import { FooterComponent } from './Core/Components/Footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SideNavBarComponent,
    FooterComponent,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ContApp';
  collapsed = true;
  screenWidth = window.innerWidth;

  constructor() {
    this.handleScreenSize();
  }

  ngOnInit() {
    this.handleScreenSize();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
    this.handleScreenSize();
  }

  private handleScreenSize() {
    // Para pantallas grandes (desktop), el sidebar debe estar siempre visible
    if (this.screenWidth > 1366) {
      this.collapsed = true; // Sidebar visible por defecto en desktop
    } else {
      // Para iPad Pro y dispositivos más pequeños, el sidebar se oculta por defecto
      this.collapsed = false;
    }
  }

  onSidebarToggle(data: { collapsed: boolean; screenWidth: number }) {
    this.collapsed = data.collapsed;
    this.screenWidth = data.screenWidth;
  }
}
