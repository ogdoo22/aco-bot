import axios from 'axios';
import { DiscordNotification } from '../../shared/types';

/**
 * Discord webhook service for notifications
 */
export class DiscordService {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
  }

  /**
   * Send a Discord notification
   */
  async sendNotification(notification: DiscordNotification): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('⚠️  Discord webhook URL not configured');
      return false;
    }

    try {
      const embed = {
        title: notification.title,
        description: notification.description,
        color: this.getColor(notification.type),
        fields: notification.fields || [],
        timestamp: new Date(notification.timestamp || Date.now()).toISOString(),
        footer: {
          text: 'ACO Bot',
        },
      };

      await axios.post(this.webhookUrl, {
        embeds: [embed],
      });

      return true;
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      return false;
    }
  }

  /**
   * Send success notification for successful checkout
   */
  async sendSuccessNotification(data: {
    taskId: string;
    orderNumber: string;
    checkoutTime: number;
  }): Promise<boolean> {
    return this.sendNotification({
      type: 'success',
      title: '🎉 Checkout Success!',
      description: `Successfully completed checkout in ${(data.checkoutTime / 1000).toFixed(2)}s`,
      fields: [
        {
          name: 'Order Number',
          value: data.orderNumber,
          inline: true,
        },
        {
          name: 'Checkout Time',
          value: `${(data.checkoutTime / 1000).toFixed(2)}s`,
          inline: true,
        },
        {
          name: 'Task ID',
          value: data.taskId.substring(0, 8),
          inline: true,
        },
      ],
    });
  }

  /**
   * Send drop summary notification
   */
  async sendDropSummary(data: {
    productName: string;
    totalTasks: number;
    successful: number;
    failed: number;
    averageTime: number;
    orders: string[];
  }): Promise<boolean> {
    const successRate = (data.successful / data.totalTasks) * 100;

    return this.sendNotification({
      type: 'info',
      title: `📊 Drop Results - ${data.productName}`,
      description: `Completed ${data.totalTasks} tasks`,
      fields: [
        {
          name: 'Success Rate',
          value: `${data.successful}/${data.totalTasks} (${successRate.toFixed(1)}%)`,
          inline: true,
        },
        {
          name: 'Average Time',
          value: `${(data.averageTime / 1000).toFixed(2)}s`,
          inline: true,
        },
        {
          name: 'Orders',
          value: data.orders.slice(0, 5).join(', ') + (data.orders.length > 5 ? '...' : ''),
          inline: false,
        },
      ],
    });
  }

  /**
   * Send stock found notification from monitor
   */
  async sendStockFoundNotification(data: {
    productName: string;
    productUrl: string;
    availableSizes: string[];
    tasksStarted: number;
  }): Promise<boolean> {
    return this.sendNotification({
      type: 'warning',
      title: 'Stock Detected!',
      description: `${data.productName} is now in stock!`,
      fields: [
        { name: 'Available Sizes', value: data.availableSizes.join(', '), inline: true },
        { name: 'Tasks Started', value: String(data.tasksStarted), inline: true },
        { name: 'Link', value: data.productUrl, inline: false },
      ],
    });
  }

  /**
   * Send test message
   */
  async sendTestMessage(): Promise<boolean> {
    return this.sendNotification({
      type: 'info',
      title: '✅ Discord Connection Test',
      description: 'ACO Bot is successfully connected to Discord!',
      timestamp: Date.now(),
    });
  }

  /**
   * Get color for embed based on type
   */
  private getColor(type: string): number {
    const colors: Record<string, number> = {
      success: 0x00ff00, // Green
      failure: 0xff0000, // Red
      warning: 0xffa500, // Orange
      info: 0x0099ff, // Blue
    };

    return colors[type] || colors.info;
  }
}
