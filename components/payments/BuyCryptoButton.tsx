'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

interface BuyCryptoButtonProps {
  /**
   * Direct payment URL (e.g., from NOWPayments invoice)
   * If provided, button will link directly to this URL
   */
  paymentUrl?: string;
  /**
   * Amount in USD to purchase
   * If provided with currency, will create a new payment
   */
  amount?: number;
  /**
   * Cryptocurrency to buy (BTC, ETH, USDT, etc.)
   * Required if creating a new payment
   */
  currency?: string;
  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Custom className
   */
  className?: string;
  /**
   * Show loading state
   */
  isLoading?: boolean;
  /**
   * Callback when payment is created
   */
  onPaymentCreated?: (paymentUrl: string, paymentId: string) => void;
}

/**
 * Buy Crypto Button Component
 * Supports both direct payment URLs and dynamic payment creation via NOWPayments
 */
export default function BuyCryptoButton({
  paymentUrl,
  amount,
  currency,
  variant = 'default',
  size = 'default',
  className = '',
  isLoading: externalLoading = false,
  onPaymentCreated,
}: BuyCryptoButtonProps) {
  const { data: session } = useSession();
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [createdPaymentUrl, setCreatedPaymentUrl] = useState<string | null>(null);

  const isLoading = externalLoading || isCreatingPayment;

  const handleClick = async () => {
    // If direct payment URL provided, open it
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // If payment already created, open it
    if (createdPaymentUrl) {
      window.open(createdPaymentUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Create new payment via API
    if (!amount || !currency) {
      console.error('Amount and currency required to create payment');
      return;
    }

    if (!session?.user) {
      // Redirect to login or show error
      window.location.href = '/auth/signin';
      return;
    }

    setIsCreatingPayment(true);

    try {
      const response = await fetch('/api/payments/crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'NOWPAYMENTS',
          amount,
          currency: currency.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      if (data.payment) {
        // Build NOWPayments payment URL
        // API response includes payment.paymentId (NOWPayments payment_id) and payment.paymentUrl
        // Use paymentUrl if available, otherwise construct from paymentId
        const paymentUrl =
          data.payment.paymentUrl ||
          (data.payment.paymentId
            ? `https://nowpayments.io/payment/?iid=${data.payment.paymentId}`
            : null);

        if (paymentUrl) {
          setCreatedPaymentUrl(paymentUrl);

          if (onPaymentCreated) {
            onPaymentCreated(paymentUrl, data.payment.id);
          }

          // Open payment page
          window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        } else {
          throw new Error('Payment created but no payment URL returned');
        }
      } else {
        throw new Error('Payment created but no payment data returned');
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to create payment. Please try again.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Use provided payment URL or created payment URL
  const finalPaymentUrl = paymentUrl || createdPaymentUrl;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
      type="button"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isCreatingPayment ? 'Creating Payment...' : 'Loading...'}
        </>
      ) : (
        <>
          {finalPaymentUrl ? (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Payment
            </>
          ) : (
            <>
              Buy Crypto
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </>
      )}
    </Button>
  );
}

/**
 * Simplified button for direct NOWPayments invoice links
 */
export function BuyCryptoWithInvoice({ invoiceId }: { invoiceId: string }) {
  const paymentUrl = `https://nowpayments.io/payment/?iid=${invoiceId}`;

  return <BuyCryptoButton paymentUrl={paymentUrl} variant="default" className="w-full sm:w-auto" />;
}

/**
 * Buy button with amount and currency selection
 */
export function BuyCryptoWithAmount({ amount, currency }: { amount: number; currency: string }) {
  return (
    <BuyCryptoButton
      amount={amount}
      currency={currency}
      variant="default"
      className="w-full sm:w-auto"
    />
  );
}
