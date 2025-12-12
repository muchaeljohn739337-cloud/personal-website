/**
 * Slack Notification Helpers
 * Convenience functions for sending common notification types
 */

import { slackClient } from './client';

export interface NotificationOptions {
  channel?: string;
  mentionUsers?: string[];
  includeTimestamp?: boolean;
}

/**
 * Send payment notification to Slack
 */
export async function notifyPayment(
  amount: string,
  currency: string,
  userId: string,
  status: 'success' | 'failed' | 'pending',
  options: NotificationOptions = {}
): Promise<void> {
  const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';
  const color: 'good' | 'warning' | 'danger' =
    status === 'success' ? 'good' : status === 'failed' ? 'danger' : 'warning';

  const mentions = options.mentionUsers?.map((id) => `<@${id}>`).join(' ') || '';
  const timestamp = options.includeTimestamp ? `\n_${new Date().toLocaleString()}_` : '';

  const message = `${emoji} Payment ${status.toUpperCase()}
  
**Amount:** ${amount} ${currency}
**User:** <@${userId}>${mentions ? `\n**Mentioned:** ${mentions}` : ''}${timestamp}`;

  await slackClient.sendNotification(
    options.channel || '#payments',
    'Payment Update',
    message,
    color
  );
}

/**
 * Send error notification to Slack
 */
export async function notifyError(
  error: Error | string,
  context?: Record<string, unknown>,
  options: NotificationOptions = {}
): Promise<void> {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && error.stack ? `\n\`\`\`${error.stack}\`\`\`` : '';

  const contextText = context
    ? `\n**Context:**\n${Object.entries(context)
        .map(([key, value]) => `• ${key}: ${JSON.stringify(value)}`)
        .join('\n')}`
    : '';

  const message = `🚨 **Error Alert**

**Error:** ${errorMessage}${errorStack}${contextText}`;

  await slackClient.sendNotification(
    options.channel || '#errors',
    'System Error',
    message,
    'danger'
  );
}

/**
 * Send deployment notification
 */
export async function notifyDeployment(
  environment: string,
  version: string,
  status: 'success' | 'failed',
  options: NotificationOptions = {}
): Promise<void> {
  const emoji = status === 'success' ? '🚀' : '❌';
  const color = status === 'success' ? 'good' : 'danger';

  const message = `${emoji} Deployment ${status.toUpperCase()}

**Environment:** ${environment}
**Version:** ${version}
**Time:** ${new Date().toLocaleString()}`;

  await slackClient.sendNotification(
    options.channel || '#deployments',
    `Deployment ${status === 'success' ? 'Success' : 'Failed'}`,
    message,
    color
  );
}

/**
 * Send user activity notification
 */
export async function notifyUserActivity(
  activity: string,
  userId: string,
  details?: Record<string, unknown>,
  options: NotificationOptions = {}
): Promise<void> {
  const detailsText = details
    ? `\n**Details:**\n${Object.entries(details)
        .map(([key, value]) => `• ${key}: ${JSON.stringify(value)}`)
        .join('\n')}`
    : '';

  const message = `👤 User Activity

**Activity:** ${activity}
**User:** <@${userId}>${detailsText}`;

  await slackClient.sendNotification(
    options.channel || '#activity',
    'User Activity',
    message,
    'good'
  );
}

/**
 * Send admin notification
 */
export async function notifyAdmin(
  title: string,
  message: string,
  urgency: 'low' | 'medium' | 'high' = 'medium',
  options: NotificationOptions = {}
): Promise<void> {
  const emoji = urgency === 'high' ? '🔴' : urgency === 'medium' ? '🟡' : '🟢';
  const color = urgency === 'high' ? 'danger' : urgency === 'medium' ? 'warning' : 'good';

  await slackClient.sendNotification(
    options.channel || '#admin',
    `${emoji} ${title}`,
    message,
    color
  );
}
