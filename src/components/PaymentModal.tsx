'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasSavedCard?: boolean;
}

function CheckoutForm({
  onClose,
  onSuccess,
  paymentIntentId,
  initialSaveMethod,
}: {
  onClose: () => void;
  onSuccess: () => void;
  paymentIntentId: string;
  initialSaveMethod: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [saveMethod, setSaveMethod] = useState(initialSaveMethod);

  // If card was previously saved, immediately apply setup_future_usage to the new intent
  useEffect(() => {
    if (initialSaveMethod) {
      fetch('/api/payments/update-intent-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, saveMethod: true }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveMethodChange = (checked: boolean) => {
    setSaveMethod(checked);
    fetch('/api/payments/update-intent-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, saveMethod: checked }),
    }).catch(() => {
      // Non-critical — saving preference failed silently
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Validation error');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-status`,
      },
    });

    // If we reach here, confirmPayment failed immediately (redirect didn't happen)
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement onReady={() => setElementReady(true)} />

      {!elementReady && (
        <p className="text-slate-500 text-xs text-center">Loading payment form...</p>
      )}

      {elementReady && (
        <div className="flex flex-col gap-1.5 mt-[10px]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveMethod}
              onChange={(e) => handleSaveMethodChange(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-sm text-slate-300">Save card for future payments</span>
          </label>
          <p className="text-xs text-slate-500 pl-6">
            Your card details are stored securely by Stripe and never touch our servers.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex gap-2 justify-end mt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe || !elements || !elementReady}
          className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay $100'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({ open, onClose, onSuccess, hasSavedCard = false }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const createIntent = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    try {
      const res = await fetch('/api/payments/create-intent', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to initialize payment');
      }
      const data = await res.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (open) createIntent();
  }, [open, createIntent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0f2239] border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Top up balance — $100</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {fetching && (
          <div className="py-8 flex justify-center">
            <p className="text-slate-400 text-sm">Loading payment form...</p>
          </div>
        )}

        {fetchError && (
          <div className="flex flex-col gap-3">
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-400">
              {fetchError}
            </div>
            <button
              onClick={createIntent}
              className="w-full py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {clientSecret && paymentIntentId && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: { colorPrimary: '#3b82f6', borderRadius: '8px' },
              },
            }}
          >
            <CheckoutForm
              onClose={onClose}
              onSuccess={onSuccess}
              paymentIntentId={paymentIntentId}
              initialSaveMethod={hasSavedCard}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
