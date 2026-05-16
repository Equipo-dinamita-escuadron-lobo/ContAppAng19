export type NotificationType = 'SCHEDULED_REPORT_READY';

export interface AppNotification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string;
  referencePublicId: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}
