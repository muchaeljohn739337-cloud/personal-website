'use client';

import { Check, CreditCard, Loader2, Shield, Sparkles, Zap } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

// eslint-disable-next-line import/no-unresolved
import { BalanceVisibility } from '@/components/dashboard/BalanceVisibility';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS } from '@/lib/stripe';

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
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Billing & Plans</h1>
        </div>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-4 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <div>
              <p className="font-medium">Payment successful!</p>
              <p className="text-sm">Your subscription has been activated.</p>
            </div>
          </div>
        </div>
      )}
      {canceled && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 p-4 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <div>
              <p className="font-medium">Payment canceled</p>
              <p className="text-sm">Your subscription was not changed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Card with Balance Display */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10 border-violet-500/20">
        {/* Water Drop Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-400/10 blur-xl animate-float"
              style={{
                width: `${20 + Math.random() * 25}px`,
                height: `${20 + Math.random() * 25}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${4 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-violet-400" />
            Current Plan
          </CardTitle>
          <CardDescription>You are currently on the Free plan</CardDescription>
        </CardHeader>
        <CardContent className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Free</p>
            </div>
            <div className="flex items-center gap-2">
              <BalanceVisibility
                value={0}
                currency="USD"
                size="md"
                variant="default"
                showIcon={false}
                className="text-slate-500 dark:text-slate-400"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={isLoading === 'portal'}
            className="border-violet-500/30 hover:bg-violet-500/10"
          >
            {isLoading === 'portal' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Manage Billing
          </Button>
        </CardContent>
      </Card>

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl">
        <span
          className={
            billingInterval === 'monthly'
              ? 'font-medium text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          className="relative h-6 w-12 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors"
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-violet-500 transition-transform ${
              billingInterval === 'yearly' ? 'left-7' : 'left-1'
            }`}
          />
        </button>
        <span
          className={
            billingInterval === 'yearly'
              ? 'font-medium text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }
        >
          Yearly
          <span className="ml-2 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
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
              className={`relative overflow-hidden transition-all hover:scale-105 ${
                isPopular
                  ? 'border-2 border-violet-500 shadow-lg shadow-violet-500/20 bg-gradient-to-br from-violet-500/10 to-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Water Drop Effects for Popular Plan */}
              {isPopular && (
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-violet-400/20 blur-lg animate-float"
                      style={{
                        width: `${15 + Math.random() * 20}px`,
                        height: `${15 + Math.random() * 20}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${3 + Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {isPopular && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-gradient-to-r from-violet-500 to-blue-500 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  {isPopular && <Sparkles className="h-5 w-5 text-violet-400" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>
                  {key === 'FREE'
                    ? 'Get started for free'
                    : `Perfect for ${key.toLowerCase()} teams`}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="flex items-baseline gap-1">
                  <BalanceVisibility
                    value={price}
                    currency="USD"
                    size="lg"
                    variant={isPopular ? 'gradient' : 'default'}
                    showIcon={false}
                    className="text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-500 dark:text-slate-400">/month</span>
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
                  className={`w-full ${
                    isPopular
                      ? 'bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600'
                      : ''
                  }`}
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

      {/* Payment Methods Info */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-400" />
            Secure Payment Processing
          </CardTitle>
          <CardDescription>
            Powered by Stripe - Your payment information is encrypted and secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>256-bit SSL encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>PCI DSS Level 1 compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>3D Secure authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span>Fraud protection</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
