import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Servicio para centralizar la construcción de URLs del centro de ayuda.
 * Evita la duplicación de código y facilita el mantenimiento.
 */
@Injectable({
  providedIn: 'root'
})
export class HelpCenterService {

  /**
   * Construye la URL completa para acceder al centro de ayuda con un slug específico.
   * @param slug El slug o identificador del módulo de ayuda (ej: 'configuracion', 'inventario-promedio-ponderado')
   * @returns La URL completa del centro de ayuda
   */
  getHelpCenterUrl(slug: string): string {
    return `${environment.API_URL.replace('/api/', '')}/#/help-center-view/${slug}`;
  }

  /**
   * Abre el centro de ayuda en una nueva pestaña.
   * @param slug El slug o identificador del módulo de ayuda
   */
  openHelpCenter(slug: string): void {
    const url = this.getHelpCenterUrl(slug);
    window.open(url, '_blank');
  }
}
