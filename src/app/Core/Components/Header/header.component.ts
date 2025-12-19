import { Component, OnInit } from '@angular/core'; // agrega OnInit
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { MenuItem } from 'primeng/api';
import { NavigationEnd, Router, Event } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { InvoicePortfolioService } from '../../../Financial/Wallet/PortfolioManagement/Service/invoice-portfolio.service';
import { LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { HelpCenterService } from '../../../Shared/services/help-center.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule, OverlayPanelModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  applicationName = 'ContApp';
  companyName = 'Nombre de la empresa';
  userName = 'Nombre completo del usuario';
  userRole = 'Rol del usuario';
  helpCenterUrl: string;

  // inicializa vacío; lo llenamos en ngOnInit
  userMenuItems: MenuItem[] = [];

  //Variables para notificaciones
  alertsCount: number = 0;
  lastCheckDate: Date = new Date();
  showNotifications: boolean = false;
  private routerSubscription: Subscription | undefined;

  constructor(
    private router: Router, 
    private auth: AuthService, 
    private invoiceService: InvoicePortfolioService, 
    private localStorageMethods: LocalStorageMethods,
    private helpCenterService: HelpCenterService
  ) {
    this.helpCenterUrl = this.helpCenterService.getHelpCenterUrl('');
      this.routerSubscription = this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkEnterpriseStatus();
    });
  }



  ngOnInit(): void {
    this.userMenuItems = [
      {
        label: 'Perfil',
        icon: 'pi pi-user',
        command: () => this.viewProfile(),
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        visible: this.auth.hasRole('Administrador'), //  ya puedes usar this.auth
        command: () => this.openSettings(),
      },
      { separator: true },
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    ];
    this.checkEnterpriseStatus();
  }

  ngOnDestroy(): void {
    // Limpiar suscripción para evitar fugas de memoria
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  viewProfile(): void {
    console.log('Ver perfil del usuario');
  }
  openSettings(): void {
    this.router.navigate(['/configuration']);
  }
  logout(): void {
    this.auth.logout().subscribe();
  }

  openHelpCenter(): void {
    window.open(this.helpCenterUrl, '_blank');
  }

  checkEnterpriseStatus() {
    // 1. VALIDACIÓN POR RUTA (Lo nuevo)
    const currentUrl = this.router.url;

    const blacklistedRoutes = ['/enterprise/list', '/enterprise/create', '/auth/login', '/auth/register'];

    const isExcluded = blacklistedRoutes.some(route => currentUrl.includes(route));

    if (isExcluded) {
      this.showNotifications = false;
      this.alertsCount = 0;
      this.companyName = ''; 
      return; 
    }

    const currentId = this.localStorageMethods.getIdEnterprise();
    const enterpriseData = this.localStorageMethods.loadEnterpriseData();

    if (currentId && currentId.trim() !== '') {
      this.showNotifications = true;
      this.companyName = enterpriseData?.name || 'Empresa';
      this.loadNotifications(currentId);
    } else {
      this.showNotifications = false;
      this.alertsCount = 0;
      this.companyName = '';
    }
  }

  loadNotifications(enterpriseId: string) {
    this.invoiceService.getExpiringInvoices(enterpriseId).subscribe({
      next: (invoices) => {
        this.alertsCount = invoices.length;
        this.lastCheckDate = new Date();
      },
      error: (err) => console.error('Error cargando alertas', err)
    });
  }

  navigateToAlertsDetail(): void {
    this.router.navigate(['/financial/wallet/invoices/expiring']);
  }

}
