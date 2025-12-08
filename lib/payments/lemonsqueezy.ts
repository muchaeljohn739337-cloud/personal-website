/**
 * Lemon Squeezy Integration
 * Documentation: https://docs.lemonsqueezy.com/api
 * Merchant of Record for SaaS subscriptions
 */

const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!;
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

import crypto from 'crypto';

import { prisma } from '../prismaClient';

// LemonSqueezy webhook data types
interface LemonSqueezyOrderData {
  id: string;
  attributes: {
    order_id?: number;
    total: number;
    currency: string;
    first_order_item?: {
      product_name?: string;
      variant_name?: string;
    };
  };
}

interface LemonSqueezySubscriptionData {
  id: string;
  attributes: {
    customer_id?: number;
    status?: string;
  };
}

// Make authenticated API request
async function makeRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${LEMONSQUEEZY_API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.detail || 'Lemon Squeezy API error');
  }

  return response.json();
}

// Get all products
export async function getProducts() {
  return makeRequest(`/products?filter[store_id]=${LEMONSQUEEZY_STORE_ID}`);
}

// Get product variants (pricing tiers)
export async function getVariants(productId: string) {
  return makeRequest(`/variants?filter[product_id]=${productId}`);
}

// Create checkout session
export async function createCheckout(params: {
  userId: string;
  variantId: string;
  email: string;
  name?: string;
  customData?: Record<string, unknown>;
}) {
  const { userId, variantId, email, name, customData } = params;

  const checkoutData = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email,
          name,
          custom: {
            user_id: userId,
            ...customData,
          },
        },
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: LEMONSQUEEZY_STORE_ID,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: variantId,
          },
        },
      },
    },
  };

  const response = await makeRequest('/checkouts', {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  });

  return {
    checkoutUrl: response.data.attributes.url,
    checkoutId: response.data.id,
  };
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  return makeRequest(`/subscriptions/${subscriptionId}`);
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  return makeRequest(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
}

// Pause subscription
export async function pauseSubscription(subscriptionId: string, resumeAt?: string) {
  const data = {
    data: {
      type: 'subscriptions',
      id: subscriptionId,
      attributes: {
        pause: {
          mode: 'void',
          resumes_at: resumeAt,
        },
      },
    },
  };

  return makeRequest(`/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string) {
  const data = {
    data: {
      type: 'subscriptions',
      id: subscriptionId,
      attributes: {
        pause: null,
      },
    },
  };

  return makeRequest(`/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Update subscription (change plan)
export async function updateSubscription(subscriptionId: string, newVariantId: string) {
  const data = {
    data: {
      type: 'subscriptions',
      id: subscriptionId,
      attributes: {
        variant_id: parseInt(newVariantId),
      },
    },
  };

  return makeRequest(`/subscriptions/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Get customer portal URL
export async function getCustomerPortalUrl(customerId: string) {
  const response = await makeRequest(`/customers/${customerId}`);
  return response.data.attributes.urls.customer_portal;
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', LEMONSQUEEZY_WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Handle webhook events
export async function handleWebhook(event: {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status?: string;
      customer_id?: number;
      order_id?: number;
      subscription_id?: number;
      variant_id?: number;
      product_id?: number;
      total?: number;
      currency?: string;
      user_email?: string;
      user_name?: string;
      first_order_item?: {
        price?: number;
        product_name?: string;
        variant_name?: string;
      };
    };
  };
}) {
  const { meta, data } = event;
  const userId = meta.custom_data?.user_id;

  if (!userId) {
    console.warn('[Lemonsqueezy] No user_id in webhook custom_data');
    return;
  }

  switch (meta.event_name) {
    case 'order_created':
      await handleOrderCreated(userId, data as LemonSqueezyOrderData);
      break;

    case 'subscription_created':
      await handleSubscriptionCreated(userId, data as LemonSqueezySubscriptionData);
      break;

    case 'subscription_updated':
      await handleSubscriptionUpdated(userId, data as LemonSqueezySubscriptionData);
      break;

    case 'subscription_cancelled':
      await handleSubscriptionCancelled(userId, data as LemonSqueezySubscriptionData);
      break;

    case 'subscription_resumed':
      await handleSubscriptionResumed(userId, data as LemonSqueezySubscriptionData);
      break;

    case 'subscription_expired':
      await handleSubscriptionExpired(userId, data as LemonSqueezySubscriptionData);
      break;

    case 'subscription_paused':
      await handleSubscriptionPaused(userId, data as LemonSqueezySubscriptionData);
      break;

    case 'subscription_unpaused':
      await handleSubscriptionUnpaused(userId, data as LemonSqueezySubscriptionData);
      break;

    default:
      console.log(`[Lemonsqueezy] Unhandled event: ${meta.event_name}`);
  }
}

async function handleOrderCreated(userId: string, data: LemonSqueezyOrderData) {
  // Create payment record
  await prisma.cryptoPayment.create({
    data: {
      userId,
      provider: 'STRIPE', // Using STRIPE as fallback since LEMONSQUEEZY not in enum
      externalId: data.id,
      amount: data.attributes.total / 100,
      amountUsd: data.attributes.total / 100,
      currency: data.attributes.currency.toUpperCase(),
      status: 'FINISHED',
      confirmedAt: new Date(),
      description: `Order: ${data.attributes.first_order_item?.product_name}`,
      metadata: {
        orderId: data.attributes.order_id,
        productName: data.attributes.first_order_item?.product_name,
        variantName: data.attributes.first_order_item?.variant_name,
      },
    },
  });

  // Send notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'TRANSACTION',
      title: 'Payment Successful',
      message: `Your payment of ${data.attributes.currency.toUpperCase()} ${(data.attributes.total / 100).toFixed(2)} was successful.`,
      data: { orderId: data.id },
    },
  });
}

async function handleSubscriptionCreated(userId: string, data: LemonSqueezySubscriptionData) {
  // Update user subscription status
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: `ls_${data.attributes.customer_id}`, // Store Lemonsqueezy customer ID
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: 'BILLING',
      title: 'Subscription Activated',
      message: 'Your subscription has been activated successfully.',
      data: { subscriptionId: data.id },
    },
  });
}

async function handleSubscriptionUpdated(userId: string, data: LemonSqueezySubscriptionData) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'BILLING',
      title: 'Subscription Updated',
      message: 'Your subscription has been updated.',
      data: { subscriptionId: data.id },
    },
  });
}

async function handleSubscriptionCancelled(userId: string, data: LemonSqueezySubscriptionData) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'BILLING',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled.',
      data: { subscriptionId: data.id },
    },
  });
}

async function handleSubscriptionResumed(userId: string, data: LemonSqueezySubscriptionData) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'BILLING',
      title: 'Subscription Resumed',
      message: 'Your subscription has been resumed.',
      data: { subscriptionId: data.id },
    },
  });
}

async function handleSubscriptionExpired(userId: string, data: LemonSqueezySubscriptionData) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'BILLING',
      title: 'Subscription Expired',
      message: 'Your subscription has expired.',
      data: { subscriptionId: data.id },
    },
  });
}

async function handleSubscriptionPaused(userId: string, data: LemonSqueezySubscriptionData) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'BILLING',
      title: 'Subscription Paused',
      message: 'Your subscription has been paused.',
      data: { subscriptionId: data.id },
    },
  });
}

async function handleSubscriptionUnpaused(userId: string, data: LemonSqueezySubscriptionData) {
  await prisma.notification.create({
    data: {
      userId,
      type: 'BILLING',
      title: 'Subscription Unpaused',
      message: 'Your subscription has been unpaused.',
      data: { subscriptionId: data.id },
    },
  });
}
