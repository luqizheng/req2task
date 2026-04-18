import { NotificationType } from '../../enums';

export class NotificationDto {
  id!: string;
  userId!: string;
  type!: NotificationType;
  title!: string;
  message!: string;
  data?: Record<string, unknown>;
  isRead!: boolean;
  createdAt!: Date;
}

export class NotificationListDto {
  items!: NotificationDto[];
  total!: number;
  unreadCount!: number;
}

export class CreateNotificationDto {
  userId!: string;
  type!: NotificationType;
  title!: string;
  message!: string;
  data?: Record<string, unknown>;
}
