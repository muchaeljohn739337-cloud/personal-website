'use client';

import { Check, CreditCard, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, PLANS } from '@/lib/stripe';

const planFeatures = {
  FREE: PLANS.FREE.features,
  STARTER: PLANS.STARTER.features,
  PROFESSIONAL: PLANS.PROFESSIONAL.features,
  ENTERPRISE: PLANS.ENTERPRISE.features,
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (planSlug: string) => {
    setIsLoading(planSlug);
    try {
      // This would typically call your checkout API
      // For now, we'll just simulate the flow
      console.log(`Subscribing to ${planSlug} plan`);
      // const response = await fetch('/api/stripe/checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId: 'price_xxx', organizationId: 'org_xxx' }),
      // });
      // const { url } = await response.json();
      // window.location.href = url;
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading('portal');
    try {
      // This would call your billing portal API
      console.log('Opening billing portal');
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Billing & Plans</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          <p className="font-medium">Payment successful!</p>
          <p className="text-sm">Your subscription has been activated.</p>
        </div>
      )}
      {canceled && (
        <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <p className="font-medium">Payment canceled</p>
          <p className="text-sm">Your subscription was not changed.</p>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>You are currently on the Free plan</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">Free</p>
            <p className="text-sm text-slate-500">$0/month</p>
          </div>
          <Button variant="outline" onClick={handleManageBilling} disabled={isLoading === 'portal'}>
            {isLoading === 'portal' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Manage Billing
          </Button>
        </CardContent>
      </Card>

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={
            billingInterval === 'monthly'
              ? 'font-medium text-slate-900 dark:text-white'
              : 'text-slate-500'
          }
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          className="relative h-6 w-12 rounded-full bg-slate-200 transition-colors dark:bg-slate-700"
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-blue-600 transition-transform ${
              billingInterval === 'yearly' ? 'left-7' : 'left-1'
            }`}
          />
        </button>
        <span
          className={
            billingInterval === 'yearly'
              ? 'font-medium text-slate-900 dark:text-white'
              : 'text-slate-500'
          }
        >
          Yearly
          <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Save 17%
          </span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PLANS).map(([key, plan]) => {
          const price = billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12;
          const isPopular = key === 'PROFESSIONAL';
          const features = planFeatures[key as keyof typeof planFeatures];

          return (
            <Card
              key={key}
              className={`relative overflow-hidden ${
                isPopular ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/10' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {key === 'FREE'
                    ? 'Get started for free'
                    : `Perfect for ${key.toLowerCase()} teams`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {formatPrice(price)}
                  </span>
                  <span className="text-slate-500">/month</span>
                </div>

                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.slug)}
                  disabled={isLoading === plan.slug || key === 'FREE'}
                >
                  {isLoading === plan.slug ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {key === 'FREE'
                    ? 'Current Plan'
                    : key === 'ENTERPRISE'
                      ? 'Contact Sales'
                      : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
