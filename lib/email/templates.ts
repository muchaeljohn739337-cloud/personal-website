/**
 * Resend Email Templates Management
 * Handles creation, publishing, and usage of Resend email templates
 * Documentation: https://resend.com/docs/api-reference/templates
 */

import { Resend } from 'resend';
import { prisma } from '../prismaClient';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export interface ResendTemplateVariable {
  key: string;
  type: 'string' | 'number';
  fallbackValue: string | number;
}

export interface CreateTemplateOptions {
  name: string;
  html: string;
  subject?: string;
  variables?: ResendTemplateVariable[];
  publish?: boolean;
}

/**
 * Create a Resend email template
 */
export async function createResendTemplate(
  options: CreateTemplateOptions
): Promise<{ id: string; published: boolean }> {
  if (!resend) {
    throw new Error('Resend API key not configured');
  }

  try {
    const template = await resend.templates.create({
      name: options.name,
      html: options.html,
      subject: options.subject || '',
      // @ts-expect-error - Type mismatch in Resend SDK, but works at runtime
      variables: options.variables || [],
    });

    if (!template.data?.id) {
      throw new Error('Failed to create template: No ID returned');
    }

    // Publish if requested
    let published = false;
    if (options.publish) {
      await resend.templates.publish(template.data.id);
      published = true;
    }

    return { id: template.data.id, published };
  } catch (error) {
    console.error('[Resend Templates] Error creating template:', error);
    throw error;
  }
}

/**
 * Publish a Resend template
 */
export async function publishResendTemplate(templateId: string): Promise<void> {
  if (!resend) {
    throw new Error('Resend API key not configured');
  }

  try {
    await resend.templates.publish(templateId);
  } catch (error) {
    console.error('[Resend Templates] Error publishing template:', error);
    throw error;
  }
}

/**
 * Send email using a Resend template
 */
export async function sendEmailWithResendTemplate(
  templateId: string,
  to: string | string[],
  variables: Record<string, string | number>,
  from?: string,
  replyTo?: string,
  userId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const fromAddress =
      from ||
      `${process.env.EMAIL_FROM_NAME || 'Advancia PayLedger'} <${
        process.env.EMAIL_FROM || 'noreply@advanciapayledger.com'
      }>`;

    const response = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      template: {
        id: templateId,
        variables,
      },
      replyTo: replyTo,
    });

    // Log email
    const toAddresses = Array.isArray(to) ? to : [to];
    for (const email of toAddresses) {
      await prisma.emailLog.create({
        data: {
          toEmail: email,
          toUserId: userId,
          fromEmail: process.env.EMAIL_FROM || 'noreply@advanciapayledger.com',
          subject: 'Template Email',
          templateId,
          provider: 'RESEND',
          externalId: response.data?.id,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error('[Resend Templates] Error sending email:', error);

    // Log failed email
    const toAddresses = Array.isArray(to) ? to : [to];
    for (const email of toAddresses) {
      await prisma.emailLog.create({
        data: {
          toEmail: email,
          toUserId: userId,
          fromEmail: process.env.EMAIL_FROM || 'noreply@advanciapayledger.com',
          subject: 'Template Email',
          templateId,
          provider: 'RESEND',
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create or update order confirmation template
 * Example from Resend documentation
 */
export async function setupOrderConfirmationTemplate(): Promise<string> {
  if (!resend) {
    throw new Error('Resend API key not configured');
  }

  const templateName = 'order-confirmation';

  try {
    const template = await resend.templates.create({
      name: templateName,
      html: '<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>',
      subject: 'Order Confirmation - {{{PRODUCT}}}',
      variables: [
        {
          key: 'PRODUCT',
          type: 'string',
          fallbackValue: 'item',
        },
        {
          key: 'PRICE',
          type: 'number',
          fallbackValue: 20,
        },
      ],
    });

    if (!template.data?.id) {
      throw new Error('Failed to create template: No ID returned');
    }

    // Publish template
    await resend.templates.publish(template.data.id);

    console.log(`[Resend Templates] Created and published template: ${template.data.id}`);

    return template.data.id;
  } catch (error) {
    console.error('[Resend Templates] Error setting up order template:', error);
    throw error;
  }
}
