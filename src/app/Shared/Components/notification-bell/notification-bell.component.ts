import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';

import { AppNotification } from '../../../Core/notifications/models/notification.model';
import { NotificationStore } from '../../../Core/notifications/state/notification.store';
import { ScheduledReportDownloadService } from '../../../Financial/Reports/auxiliary-books/Services/scheduled-report-download.service';

export interface ExternalNotification {
  id: string;
  title: string;
  message: string;
  date?: Date | string | null;
  severity?: 'danger' | 'warning' | 'info' | 'success';
  icon?: string;
  read?: boolean;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    OverlayPanelModule,
    BadgeModule,
    TooltipModule,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
})
export class NotificationBellComponent {
  readonly store = inject(NotificationStore);
  private readonly downloadService = inject(ScheduledReportDownloadService);

  @Input() externalNotifications: ExternalNotification[] = [];
  @Output() externalSelected = new EventEmitter<ExternalNotification>();

  readonly totalUnread = computed(() => {
    const unreadExternal = this.externalNotifications.filter(
      (n) => n.read !== true,
    ).length;
    return this.store.unreadCount() + unreadExternal;
  });

  onClick(notification: AppNotification): void {
    if (notification.type === 'SCHEDULED_REPORT_READY') {
      this.downloadService.download(
        notification.referencePublicId,
        notification.referenceId,
      );
    }
    this.store.delete(notification.notificationId);
  }

  onDelete(event: Event, notification: AppNotification): void {
    event.stopPropagation();
    this.store.delete(notification.notificationId);
  }

  onExternalClick(notification: ExternalNotification): void {
    this.externalSelected.emit(notification);
  }

  onMarkAllRead(): void {
    this.store.markAllAsRead();
  }

  onDeleteAllRead(): void {
    this.store.deleteAllRead();
  }

  severityClass(severity: ExternalNotification['severity']): string {
    switch (severity) {
      case 'danger':
        return 'notification-bell__item--danger';
      case 'warning':
        return 'notification-bell__item--warning';
      case 'success':
        return 'notification-bell__item--success';
      default:
        return 'notification-bell__item--info';
    }
  }

  severityIcon(notification: ExternalNotification): string {
    if (notification.icon) {
      return notification.icon;
    }
    switch (notification.severity) {
      case 'danger':
        return 'pi pi-exclamation-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'success':
        return 'pi pi-check-circle';
      default:
        return 'pi pi-info-circle';
    }
  }
}
