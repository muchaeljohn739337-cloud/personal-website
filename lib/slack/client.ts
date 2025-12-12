/**
 * Slack API Client
 * Handles all Slack API interactions including sending messages, managing channels, and handling events
 */

import { WebClient } from '@slack/web-api';
import { prisma } from '../prismaClient';

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: unknown[];
  attachments?: unknown[];
  thread_ts?: string;
}

export interface SlackUserInfo {
  id: string;
  name: string;
  email?: string;
  real_name?: string;
  image?: string;
}

class SlackClient {
  private client: WebClient | null = null;
  private teamId: string | null = null;

  /**
   * Initialize Slack client with bot token
   */
  async initialize(botToken: string, teamId?: string): Promise<void> {
    this.client = new WebClient(botToken);
    this.teamId = teamId || null;
  }

  /**
   * Initialize from database integration
   */
  async initializeFromIntegration(userId: string): Promise<boolean> {
    try {
      const integration = await prisma.integration.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: 'slack',
          },
        },
      });

      if (!integration || !integration.accessToken || !integration.isActive) {
        return false;
      }

      const config = integration.config as { teamId?: string } | null;
      await this.initialize(integration.accessToken, config?.teamId);
      return true;
    } catch (error) {
      console.error('[Slack] Failed to initialize from integration:', error);
      return false;
    }
  }

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(message: SlackMessage): Promise<string | null> {
    if (!this.client) {
      throw new Error('Slack client not initialized. Call initialize() first.');
    }

    try {
      const response = await this.client.chat.postMessage({
        channel: message.channel,
        text: message.text,
        blocks: message.blocks as never,
        attachments: message.attachments as never,
        thread_ts: message.thread_ts,
      });

      return response.ts || null;
    } catch (error) {
      console.error('[Slack] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send a notification to a channel
   */
  async sendNotification(
    channel: string,
    title: string,
    message: string,
    _color: 'good' | 'warning' | 'danger' = 'good'
  ): Promise<void> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ];

    await this.sendMessage({
      channel,
      text: title,
      blocks,
    });
  }

  /**
   * Get user information
   */
  async getUserInfo(userId: string): Promise<SlackUserInfo | null> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      const response = await this.client.users.info({ user: userId });

      if (!response.user) {
        return null;
      }

      return {
        id: response.user.id || '',
        name: response.user.name || '',
        email: response.user.profile?.email || undefined,
        real_name: response.user.profile?.real_name || undefined,
        image: response.user.profile?.image_512 || response.user.profile?.image_192 || undefined,
      };
    } catch (error) {
      console.error('[Slack] Failed to get user info:', error);
      return null;
    }
  }

  /**
   * List channels
   */
  async listChannels(): Promise<Array<{ id: string; name: string }>> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      const response = await this.client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: true,
      });

      return (
        response.channels?.map((channel) => ({
          id: channel.id || '',
          name: channel.name || '',
        })) || []
      );
    } catch (error) {
      console.error('[Slack] Failed to list channels:', error);
      return [];
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(
    channelId: string
  ): Promise<{ id: string; name: string; topic?: string } | null> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      const response = await this.client.conversations.info({ channel: channelId });

      if (!response.channel) {
        return null;
      }

      return {
        id: response.channel.id || '',
        name: response.channel.name || '',
        topic: response.channel.topic?.value,
      };
    } catch (error) {
      console.error('[Slack] Failed to get channel info:', error);
      return null;
    }
  }

  /**
   * Create a channel
   */
  async createChannel(name: string, isPrivate = false): Promise<string | null> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      const response = await this.client.conversations.create({
        name,
        is_private: isPrivate,
      });

      return response.channel?.id || null;
    } catch (error) {
      console.error('[Slack] Failed to create channel:', error);
      throw error;
    }
  }

  /**
   * Invite users to a channel
   */
  async inviteToChannel(channelId: string, userIds: string[]): Promise<void> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      await this.client.conversations.invite({
        channel: channelId,
        users: userIds.join(','),
      });
    } catch (error) {
      console.error('[Slack] Failed to invite users:', error);
      throw error;
    }
  }

  /**
   * Send a direct message to a user
   */
  async sendDM(userId: string, text: string, blocks?: unknown[]): Promise<string | null> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      // Open DM channel
      const conversation = await this.client.conversations.open({
        users: userId,
      });

      if (!conversation.channel?.id) {
        throw new Error('Failed to open DM channel');
      }

      // Send message
      const response = await this.client.chat.postMessage({
        channel: conversation.channel.id,
        text,
        blocks: blocks as never,
      });

      return response.ts || null;
    } catch (error) {
      console.error('[Slack] Failed to send DM:', error);
      throw error;
    }
  }

  /**
   * Update a message
   */
  async updateMessage(
    channelId: string,
    ts: string,
    text?: string,
    blocks?: unknown[]
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      await this.client.chat.update({
        channel: channelId,
        ts,
        text,
        blocks: blocks as never,
      });
    } catch (error) {
      console.error('[Slack] Failed to update message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(channelId: string, ts: string): Promise<void> {
    if (!this.client) {
      throw new Error('Slack client not initialized.');
    }

    try {
      await this.client.chat.delete({
        channel: channelId,
        ts,
      });
    } catch (error) {
      console.error('[Slack] Failed to delete message:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const slackClient = new SlackClient();

/**
 * Initialize Slack client from environment variables
 */
export async function initializeSlackClient(): Promise<boolean> {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const teamId = process.env.SLACK_TEAM_ID;

  if (!botToken) {
    console.warn('[Slack] SLACK_BOT_TOKEN not configured. Slack integration disabled.');
    return false;
  }

  try {
    await slackClient.initialize(botToken, teamId);
    console.log('[Slack] Client initialized successfully');
    return true;
  } catch (error) {
    console.error('[Slack] Failed to initialize client:', error);
    return false;
  }
}
