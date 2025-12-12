import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

/**
 * Email Worker - Sends emails via SMTP
 */
export async function sendEmailJob(job: Job) {
  const { to, subject, html, text, from } = job.data;
  
  logger.info(`Sending email to ${to}: ${subject}`);

  try {
    await job.updateProgress(10);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await job.updateProgress(30);

    // Send email
    const info = await transporter.sendMail({
      from: from || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });

    await job.updateProgress(100);

    logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    
    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Notification Worker - Sends notifications via multiple channels
 */
export async function sendNotificationJob(job: Job) {
  const { userId, type, title, message, priority, channels } = job.data;
  
  logger.info(`Sending notification to user ${userId}: ${title}`);

  try {
    await job.updateProgress(10);

    // Create notification in database
    const notification = await prisma.notifications.create({
      data: {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        priority: priority || 'normal',
        category: type,
        title,
        message,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await job.updateProgress(50);

    // Send via configured channels
    const channelsToUse = channels || ['inApp'];
    const results: any = {
      notificationId: notification.id,
      channels: {},
    };

    if (channelsToUse.includes('email')) {
      try {
        // Queue email job
        const emailResult = await sendEmailJob({
          data: {
            to: job.data.userEmail || '', // Should pass userEmail in job data
            subject: title,
            html: `<h2>${title}</h2><p>${message}</p>`,
            text: `${title}\n\n${message}`,
          },
        } as Job);
        
        results.channels.email = 'sent';
        
        // Update notification
        await prisma.notifications.update({
          where: { id: notification.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      } catch (error) {
        logger.error(`Failed to send email notification:`, error);
        results.channels.email = 'failed';
      }
    }

    if (channelsToUse.includes('push')) {
      // Implement push notification logic here
      results.channels.push = 'pending';
    }

    await job.updateProgress(100);

    logger.info(`Notification sent to user ${userId}`);
    return results;
  } catch (error) {
    logger.error(`Failed to send notification to user ${userId}:`, error);
    throw error;
  }
}

// Import prisma at the top with other imports
import prisma from '../prismaClient';
