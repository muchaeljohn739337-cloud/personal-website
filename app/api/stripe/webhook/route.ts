import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { prisma } from '@/lib/prismaClient';
import { stripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;

        if (organizationId && session.subscription && stripe) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionId: subscription.id,
              subscriptionStatus: 'ACTIVE',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;

        if (organizationId) {
          const statusMap: Record<string, string> = {
            active: 'ACTIVE',
            past_due: 'PAST_DUE',
            canceled: 'CANCELED',
            unpaid: 'UNPAID',
            trialing: 'TRIALING',
            incomplete: 'INCOMPLETE',
          };

          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionStatus: (statusMap[subscription.status] || 'ACTIVE') as never,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organizationId;

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionId: null,
              subscriptionStatus: 'CANCELED',
            },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const organization = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (organization) {
          await prisma.invoice.create({
            data: {
              stripeInvoiceId: invoice.id,
              organizationId: organization.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'PAID',
              invoiceNumber: invoice.number || undefined,
              invoiceUrl: invoice.hosted_invoice_url || undefined,
              pdfUrl: invoice.invoice_pdf || undefined,
              periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
              periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
              paidAt: new Date(),
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const organization = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (organization) {
          // Create notification for billing failure
          const owner = await prisma.user.findUnique({
            where: { id: organization.ownerId },
          });

          if (owner) {
            await prisma.notification.create({
              data: {
                userId: owner.id,
                type: 'BILLING',
                title: 'Payment Failed',
                message: `Your payment for ${organization.name} has failed. Please update your payment method.`,
                data: { organizationId: organization.id, invoiceId: invoice.id },
              },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
