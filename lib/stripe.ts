import Stripe from 'stripe';

// Initialize Stripe client (will be null if no API key)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  : null;

export const PLANS = {
  FREE: {
    name: 'Free',
    slug: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    maxMembers: 2,
    maxProjects: 3,
    maxStorage: 1024, // 1GB
    maxApiCalls: 1000,
    features: [
      'Up to 2 team members',
      'Up to 3 projects',
      '1GB storage',
      'Basic analytics',
      'Email support',
    ],
  },
  STARTER: {
    name: 'Starter',
    slug: 'starter',
    priceMonthly: 2900, // $29
    priceYearly: 29000, // $290 (2 months free)
    maxMembers: 5,
    maxProjects: 10,
    maxStorage: 10240, // 10GB
    maxApiCalls: 10000,
    features: [
      'Up to 5 team members',
      'Up to 10 projects',
      '10GB storage',
      'Advanced analytics',
      'Priority email support',
      'API access',
      'Wallet & transactions',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional',
    slug: 'professional',
    priceMonthly: 7900, // $79
    priceYearly: 79000, // $790 (2 months free)
    maxMembers: 20,
    maxProjects: 50,
    maxStorage: 51200, // 50GB
    maxApiCalls: 100000,
    features: [
      'Up to 20 team members',
      'Up to 50 projects',
      '50GB storage',
      'Custom analytics',
      'Phone & email support',
      'Advanced API access',
      'Multi-wallet support',
      'Custom integrations',
      'Audit logs',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    slug: 'enterprise',
    priceMonthly: 29900, // $299
    priceYearly: 299000, // $2990 (2 months free)
    maxMembers: -1, // Unlimited
    maxProjects: -1, // Unlimited
    maxStorage: -1, // Unlimited
    maxApiCalls: -1, // Unlimited
    features: [
      'Unlimited team members',
      'Unlimited projects',
      'Unlimited storage',
      'Enterprise analytics',
      'Dedicated support',
      'Full API access',
      'Unlimited wallets',
      'Custom integrations',
      'Advanced audit logs',
      'SSO/SAML',
      'Custom contracts',
      'SLA guarantee',
    ],
  },
} as const;

export type PlanSlug = keyof typeof PLANS;

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100);
}

export async function createStripeCustomer(email: string, name?: string) {
  return stripe.customers.create({
    email,
    name: name || undefined,
  });
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  organizationId,
  trialDays = 14,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  organizationId: string;
  trialDays?: number;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: trialDays,
      metadata: {
        organizationId,
      },
    },
    metadata: {
      organizationId,
    },
  });
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function updateSubscription(subscriptionId: string, priceId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

export async function getInvoices(customerId: string, limit = 10) {
  return stripe.invoices.list({
    customer: customerId,
    limit,
  });
}

export async function getUpcomingInvoice(customerId: string) {
  try {
    return await stripe.invoices.createPreview({
      customer: customerId,
    });
  } catch {
    return null;
  }
}
