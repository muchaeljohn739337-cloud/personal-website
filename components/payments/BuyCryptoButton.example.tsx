/**
 * BuyCryptoButton Usage Examples
 *
 * This file shows how to use the BuyCryptoButton component in different scenarios
 */

import BuyCryptoButton, { BuyCryptoWithInvoice, BuyCryptoWithAmount } from './BuyCryptoButton';

// Example 1: Direct payment URL (from NOWPayments invoice)
export function ExampleDirectUrl() {
  return (
    <BuyCryptoButton
      paymentUrl="https://nowpayments.io/payment/?iid=6349805040"
      variant="default"
      size="lg"
    />
  );
}

// Example 2: Using invoice ID helper
export function ExampleWithInvoiceId() {
  return <BuyCryptoWithInvoice invoiceId="6349805040" />;
}

// Example 3: Create payment dynamically with amount and currency
export function ExampleDynamicPayment() {
  return (
    <BuyCryptoButton
      amount={100}
      currency="BTC"
      variant="default"
      onPaymentCreated={(url, id) => {
        console.log('Payment created:', { url, id });
      }}
    />
  );
}

// Example 4: With amount helper
export function ExampleWithAmount() {
  return <BuyCryptoWithAmount amount={50} currency="ETH" />;
}

// Example 5: In a form or modal
export function ExampleInModal() {
  const [amount, setAmount] = useState(100);
  const [currency, setCurrency] = useState('BTC');

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="crypto-amount">Amount (USD)</label>
        <input
          id="crypto-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>
      <div>
        <label htmlFor="crypto-currency">Currency</label>
        <select id="crypto-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="BTC">Bitcoin</option>
          <option value="ETH">Ethereum</option>
          <option value="USDT">USDT</option>
        </select>
      </div>
      <BuyCryptoButton amount={amount} currency={currency} className="w-full" />
    </div>
  );
}

// Example 6: Multiple payment options
export function ExampleMultipleOptions() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <BuyCryptoButton amount={25} currency="BTC" variant="outline" className="w-full" />
      <BuyCryptoButton amount={50} currency="ETH" variant="outline" className="w-full" />
      <BuyCryptoButton amount={100} currency="USDT" variant="outline" className="w-full" />
    </div>
  );
}

import { useState } from 'react';
