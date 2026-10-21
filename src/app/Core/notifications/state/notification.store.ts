import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { AppNotification } from '../models/notification.model';
import { NotificationApiService } from '../services/notification-api.service';
import { NotificationStreamService } from '../services/notification-stream.service';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly api = inject(NotificationApiService);
  private readonly streamService = inject(NotificationStreamService);
  private readonly authService = inject(AuthService);

  private streamSubscribed = false;
  private currentUserId: string | null = null;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  initForUser(userId: string): void {
    if (!userId) {
      return;
    }
    if (this.currentUserId === userId) {
      return;
    }
    this.destroy();
    this.currentUserId = userId;

    this.api.list(userId, false, 50).subscribe({
      next: (res) => this.notifications.set(res.data ?? []),
      error: () => this.notifications.set([]),
    });

    this.streamService.connect(userId);
    if (!this.streamSubscribed) {
      this.streamSubscribed = true;
      this.streamService.stream.subscribe((n) => {
        this.notifications.update((list) => [
          n,
          ...list.filter((x) => x.notificationId !== n.notificationId),
        ]);
      });
    }
  }

  destroy(): void {
    this.streamService.disconnect();
    this.notifications.set([]);
    this.currentUserId = null;
  }

  markAsRead(notificationId: string): void {
    const userId = this.currentUserId ?? this.resolveUserId();
    if (!userId) return;
    this.notifications.update((list) =>
      list.map((n) =>
        n.notificationId === notificationId ? { ...n, read: true } : n,
      ),
    );
    this.api.markAsRead(notificationId, userId).subscribe();
  }

  markAllAsRead(): void {
    const userId = this.currentUserId ?? this.resolveUserId();
    if (!userId) return;
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
    this.api.markAllAsRead(userId).subscribe();
  }

  delete(notificationId: string): void {
    const userId = this.currentUserId ?? this.resolveUserId();
    if (!userId) return;
    this.notifications.update((list) =>
      list.filter((n) => n.notificationId !== notificationId),
    );
    this.api.delete(notificationId, userId).subscribe();
  }

  deleteAllRead(): void {
    const userId = this.currentUserId ?? this.resolveUserId();
    if (!userId) return;
    this.notifications.update((list) => list.filter((n) => !n.read));
    this.api.deleteAllRead(userId).subscribe();
  }

  private resolveUserId(): string | null {
    return this.authService.returnUserInfo()?.id ?? null;
  }
}
