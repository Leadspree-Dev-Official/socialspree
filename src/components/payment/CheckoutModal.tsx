import React, { useState } from 'react';
import { SubscriptionPlan, CurrencyCode } from '../../types';
import { RazorpaySandbox } from './RazorpaySandbox';
import { WhatsAppCheckout } from './WhatsAppCheckout';
import { X, CreditCard, MessageSquare, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan;
  initialBillingCycle?: 'monthly' | 'yearly';
  selectedCurrency?: CurrencyCode;
  currencySymbol?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  initialBillingCycle = 'monthly',
  selectedCurrency,
  currencySymbol,
}) => {
  const [paymentChannel, setPaymentChannel] = useState<'razorpay' | 'whatsapp'>('razorpay');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBillingCycle);

  if (!isOpen) return null;

  const effectiveCurrency = selectedCurrency || selectedPlan.currency;
  const currencyConfigs: Record<CurrencyCode, string> = {
    USD: '$',
    INR: '₹',
    GBP: '£',
  };
  const effectiveSymbol = currencySymbol || currencyConfigs[effectiveCurrency] || selectedPlan.currencySymbol;

  const getConvertedPrice = (plan: SubscriptionPlan, curr: CurrencyCode): number => {
    const matrix: Record<string, Record<CurrencyCode, number>> = {
      'plan-starter': { USD: 19, INR: 1499, GBP: 15 },
      'plan-pro': { USD: 29, INR: 1499, GBP: 24 },
      'plan-enterprise': { USD: 149, INR: 11999, GBP: 119 },
      'plan-biz-starter': { USD: 1, INR: 49, GBP: 1 },
      'plan-biz-growth': { USD: 2, INR: 99, GBP: 2 },
      'plan-biz-pro': { USD: 3, INR: 149, GBP: 3 },
      'plan-biz-scale': { USD: 4, INR: 199, GBP: 4 },
      'plan-biz-ultimate': { USD: 5, INR: 249, GBP: 5 },
      'plan-influencer-starter': { USD: 4, INR: 299, GBP: 3 },
      'plan-influencer-pro': { USD: 7, INR: 499, GBP: 6 },
      'plan-influencer-elite': { USD: 12, INR: 899, GBP: 10 },
      'plan-agency-starter': { USD: 20, INR: 1499, GBP: 16 },
      'plan-agency-growth': { USD: 35, INR: 2799, GBP: 28 },
      'plan-agency-scale': { USD: 65, INR: 4999, GBP: 52 },
      'plan-agency-enterprise': { USD: 120, INR: 8999, GBP: 95 },
    };
    if (matrix[plan.id]?.[curr]) {
      return matrix[plan.id][curr];
    }
    const srcCurr = plan.currency || 'INR';
    const basePrice = plan.priceMonthly;
    if (srcCurr === curr) return basePrice;
    if (srcCurr === 'USD' && curr === 'INR') return Math.round(basePrice * 85);
    if (srcCurr === 'USD' && curr === 'GBP') return Math.max(1, Math.round(basePrice * 0.8));
    if (srcCurr === 'INR' && curr === 'USD') return Math.max(1, Math.round(basePrice / 85));
    if (srcCurr === 'INR' && curr === 'GBP') return Math.max(1, Math.round(basePrice / 105));
    if (srcCurr === 'GBP' && curr === 'USD') return Math.round(basePrice * 1.25);
    if (srcCurr === 'GBP' && curr === 'INR') return Math.round(basePrice * 105);
    return basePrice;
  };

  const baseMonthly = getConvertedPrice(selectedPlan, effectiveCurrency);
  const activePlan: SubscriptionPlan = {
    ...selectedPlan,
    priceMonthly: baseMonthly,
    currency: effectiveCurrency,
    currencySymbol: effectiveSymbol,
  };

  // Calculate pricing
  const finalMonthly = billingCycle === 'yearly' ? Math.round(baseMonthly * 0.8) : baseMonthly;
  const totalAmount = billingCycle === 'yearly' ? finalMonthly * 12 : finalMonthly;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-['Inter']">
      
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] to-blue-500 text-white flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Subscribe & Provision Tenant</h3>
              <p className="text-xs text-slate-400 font-medium">Instant Multi-Tenant Workspace Provisioning</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Plan Summary Banner */}
        <div className="bg-purple-50/60 p-5 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-slate-900">{activePlan.name}</span>
              {activePlan.isPopular && (
                <span className="text-[10px] font-bold bg-[#5D3FD3] text-white px-2 py-0.5 rounded-full uppercase">
                  Popular
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-0.5">
              Includes {activePlan.allocatedApiSlots} API Slots ({activePlan.maxSocialAccounts} Social Channels) + {activePlan.aiCredits.toLocaleString()} AI Credits/mo
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-[#5D3FD3]">
              {activePlan.currencySymbol}{totalAmount.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">
              Billed {billingCycle}
            </div>
          </div>
        </div>

        {/* Payment Gateway Mode Tabs Selector */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setPaymentChannel('razorpay')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                paymentChannel === 'razorpay'
                  ? 'bg-white text-[#0052FF] shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Razorpay Secure Checkout</span>
            </button>

            <button
              onClick={() => setPaymentChannel('whatsapp')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                paymentChannel === 'whatsapp'
                  ? 'bg-white text-[#25D366] shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 fill-emerald-600" />
              <span>WhatsApp Direct Order</span>
            </button>
          </div>
        </div>

        {/* Selected Gateway Component */}
        <div className="p-6">
          {paymentChannel === 'razorpay' ? (
            <RazorpaySandbox
              plan={activePlan}
              billingCycle={billingCycle}
              onCancel={onClose}
            />
          ) : (
            <WhatsAppCheckout
              plan={activePlan}
              billingCycle={billingCycle}
              onClose={onClose}
            />
          )}
        </div>

      </div>

    </div>
  );
};
