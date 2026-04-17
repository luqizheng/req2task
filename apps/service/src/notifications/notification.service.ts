import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@req2task/core';
import { NotificationType } from '@req2task/dto';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationQuery {
  page?: string;
  limit?: string;
  isRead?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data || null,
    });
    return this.notificationRepository.save(notification);
  }

  async findByUser(
    userId: string,
    query: NotificationQuery,
  ): Promise<{ items: Notification[]; total: number; unreadCount: number }> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const where: Record<string, unknown> = { userId };
    if (query.isRead !== undefined) {
      where.isRead = query.isRead === 'true';
    }

    const [items, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { items, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    await this.notificationRepository.update({ id, userId }, { isRead: true });
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id, userId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
