'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Status = 'loading' | 'succeeded' | 'processing' | 'failed' | 'canceled' | 'unknown';

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');
    if (!clientSecret) {
      setStatus('unknown');
      setMessage('No payment information found.');
      return;
    }

    stripePromise.then(async (stripe) => {
      if (!stripe) {
        setStatus('unknown');
        setMessage('Payment service unavailable.');
        return;
      }

      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);

      if (error) {
        setStatus('failed');
        setMessage(error.message ?? 'Payment verification failed.');
        return;
      }

      switch (paymentIntent?.status) {
        case 'succeeded':
          setStatus('succeeded');
          setMessage('Your payment of $100 was successful! Your balance has been updated.');
          // Sync with backend in case the webhook was not delivered
          if (paymentIntent?.id) {
            fetch('/api/payments/sync-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
            }).catch(() => {
              // Ignore errors — webhook may handle it instead
            });
          }
          break;
        case 'processing':
          setStatus('processing');
          setMessage('Your payment is being processed. We will update your balance shortly.');
          break;
        case 'requires_payment_method':
          setStatus('failed');
          setMessage('Payment failed. Please try again with a different payment method.');
          break;
        case 'canceled':
          setStatus('canceled');
          setMessage('Payment was canceled.');
          break;
        default:
          setStatus('unknown');
          setMessage(`Unexpected payment status: ${paymentIntent?.status}`);
      }
    });
  }, [searchParams]);

  const iconMap: Record<Status, string> = {
    loading: '⏳',
    succeeded: '✅',
    processing: '⏳',
    failed: '❌',
    canceled: '⚠️',
    unknown: '❓',
  };

  const colorMap: Record<Status, string> = {
    loading: 'text-slate-400',
    succeeded: 'text-green-400',
    processing: 'text-yellow-400',
    failed: 'text-red-400',
    canceled: 'text-slate-400',
    unknown: 'text-slate-400',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1929] px-4">
      <div className="bg-[#0f2239] border border-slate-700 rounded-xl w-full max-w-md p-8 text-center shadow-2xl">
        <p className="text-5xl mb-4">{iconMap[status]}</p>

        <h1 className={`text-xl font-bold mb-3 ${colorMap[status]}`}>
          {status === 'loading' && 'Verifying payment...'}
          {status === 'succeeded' && 'Payment successful'}
          {status === 'processing' && 'Payment processing'}
          {status === 'failed' && 'Payment failed'}
          {status === 'canceled' && 'Payment canceled'}
          {status === 'unknown' && 'Unknown status'}
        </h1>

        {message && (
          <p className="text-slate-400 text-sm mb-6">{message}</p>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push('/?dashboard=1')}
            className="w-full py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Back to Account
          </button>

          {status === 'failed' && (
            <button
              onClick={() => router.push('/?dashboard=1')}
              className="w-full py-2.5 text-sm font-semibold border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a1929]">
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
