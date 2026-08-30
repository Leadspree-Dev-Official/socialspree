import React, { useState } from 'react';
import { SubscriptionPlan } from '../../types';
import { CheckCircle2, RefreshCw, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RazorpaySandboxProps {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  onCancel: () => void;
}

export const RazorpaySandbox: React.FC<RazorpaySandboxProps> = ({
  plan,
  billingCycle,
  onCancel,
}) => {
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'form' | 'processing' | 'success'>('form');

  const [errorMessage, setErrorMessage] = useState('');

  const handleCancel = () => {
    onCancel();
  };

  // Calculate price (20% OFF if yearly)
  const baseMonthly = plan.priceMonthly;
  const finalMonthly = billingCycle === 'yearly' ? Math.round(baseMonthly * 0.8) : baseMonthly;
  const totalAmount = billingCycle === 'yearly' ? finalMonthly * 12 : finalMonthly;

  /**
   * Waits for the payment webhook to mark the order paid.
   *
   * Razorpay's browser callback fires when the modal closes successfully, but
   * entitlement is granted server-side by the webhook. Showing success off the
   * callback alone would tell a customer their plan is live before it is.
   */
  const confirmPayment = async (checkoutId: string) => {
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
      const { data: order } = await supabase
        .from('checkout_orders')
        .select('status')
        .eq('id', checkoutId)
        .maybeSingle();

      if (order?.status === 'paid') {
        setState('success');
        return;
      }
      if (order?.status === 'failed' || order?.status === 'cancelled') {
        setErrorMessage('That payment did not complete. No charge was captured.');
        setState('form');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Payment may still settle; say so rather than claiming failure.
    setErrorMessage(
      'Payment received, but confirmation is taking longer than usual. Your plan activates automatically once it clears — no need to pay again.'
    );
    setState('form');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !email) return;

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { planId: plan.id, billingCycle, currency: plan.currency }
    });
    if (error || !data?.orderId) {
      setState('form');
      setErrorMessage(error?.message || data?.error || 'Sign in before starting a secure checkout.');
      return;
    }
    if (!(window as any).Razorpay) {
      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'));
          document.head.appendChild(script);
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to load Razorpay Checkout');
        setState('form');
        return;
      }
    }
    if (!(window as any).Razorpay) { setState('form'); return; }
    const checkout = new (window as any).Razorpay({
      key: data.keyId, order_id: data.orderId, amount: data.amount, currency: data.currency,
      name: 'SocialSpree', description: data.planName,
      prefill: { name: orgName, email, contact: phone },
      handler: () => { setState('processing'); void confirmPayment(data.checkoutId); },
      modal: { ondismiss: () => setState('form') },
      theme: { color: '#5D3FD3' },
    });
    checkout.open();
  };

  return (
    <div className="font-['Inter'] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
      
      {/* Razorpay Authentic Navy Header */}
      <div className="bg-[#0C2340] text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">Razorpay</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 font-mono font-bold px-2 py-0.5 rounded border border-blue-400/30">
                SECURE CHECKOUT
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono">Order Ref: #RZP-88291</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-white font-mono">
            {plan.currencySymbol}{totalAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-300 font-medium capitalize">
            {billingCycle} plan subscription
          </div>
        </div>
      </div>

      {/* Main Body depending on state */}
      {state === 'form' && (
        <form onSubmit={handlePay} className="p-6 sm:p-8 space-y-6">
          {errorMessage && <p className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">{errorMessage}</p>}
          
          {/* Customer Details Form */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subscriber Business Info
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Apex Growth Media"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#0052FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Owner Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@apexgrowth.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#0052FF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#0052FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Card, UPI and net banking are all handled inside Razorpay's secure checkout,
              which opens next. Your card details are never entered on this page or sent to
              our servers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 py-3.5 px-6 rounded-xl bg-[#0052FF] hover:bg-[#0042CC] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Pay {plan.currencySymbol}{totalAmount.toLocaleString()} via Razorpay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>
      )}

      {/* Processing State */}
      {state === 'processing' && (
        <div className="p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0052FF] dark:text-blue-400 flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-900 dark:text-white">Opening secure Razorpay Checkout...</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Your order is being created server-side. Paid access is activated only after webhook verification.
            </p>
          </div>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && (
        <div className="p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-black text-emerald-900 dark:text-emerald-200">Payment submitted</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Razorpay will notify the server. Your subscription activates after the verified payment webhook is received.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
