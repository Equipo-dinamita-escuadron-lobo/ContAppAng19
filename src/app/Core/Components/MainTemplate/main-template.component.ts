import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../Header/header.component';
import { SideNavBarComponent } from '../SideNavBar/side-nav-bar.component';
import { FooterComponent } from '../Footer/footer.component';
import { CommonModule } from '@angular/common';
import { BreadCrumbComponent } from '../../../Shared/Components/bread-crumb/bread-crumb.component';

@Component({
  selector: 'app-main-template',
  imports: [
    RouterOutlet,
    HeaderComponent,
    SideNavBarComponent,
    FooterComponent,
    CommonModule,
    BreadCrumbComponent,
  ],
  templateUrl: './main-template.component.html',
  styleUrl: './main-template.component.css'
})
export class MainTemplateComponent implements OnInit, OnDestroy {
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
