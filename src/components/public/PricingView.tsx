import React, { useState } from 'react';
import { SubscriptionPlan, CurrencyCode } from '../../types';
import { INITIAL_PLANS } from '../../lib/store';
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';

interface PricingViewProps {
  plans: SubscriptionPlan[];
  onOpenCheckout: (
    planId: string, 
    billingCycle: 'monthly' | 'yearly', 
    selectedCurrency?: CurrencyCode, 
    currencySymbol?: string
  ) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  plans,
  onOpenCheckout,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('INR');

  // Currency Symbols & Rates mapping for dynamic display
  const currencyConfigs: Record<CurrencyCode, { symbol: string; label: string }> = {
    INR: { symbol: '₹', label: 'INR (₹)' },
    USD: { symbol: '$', label: 'USD ($)' },
    GBP: { symbol: '£', label: 'GBP (£)' },
  };

  // Helper to compute price based on currency & billing cycle (20% discount for annual)
  const getCalculatedPrice = (plan: SubscriptionPlan) => {
    let baseMonthlyPrice = plan?.priceMonthly ?? 19;

    const conversionMatrix: Record<string, Record<CurrencyCode, number>> = {
      'plan-starter': { USD: 19, INR: 1499, GBP: 15 },
      'plan-pro': { USD: 29, INR: 1499, GBP: 24 },
      'plan-enterprise': { USD: 149, INR: 11999, GBP: 119 },
    };

    if (plan?.id && conversionMatrix[plan.id]?.[selectedCurrency]) {
      baseMonthlyPrice = conversionMatrix[plan.id][selectedCurrency];
    } else if (plan?.currency && plan.currency !== selectedCurrency) {
      const p = plan.priceMonthly;
      const srcCurr = plan.currency;
      if (srcCurr === 'USD' && selectedCurrency === 'INR') baseMonthlyPrice = Math.round(p * 80);
      else if (srcCurr === 'USD' && selectedCurrency === 'GBP') baseMonthlyPrice = Math.round(p * 0.8);
      else if (srcCurr === 'INR' && selectedCurrency === 'USD') baseMonthlyPrice = Math.round(p / 80);
      else if (srcCurr === 'INR' && selectedCurrency === 'GBP') baseMonthlyPrice = Math.round(p / 100);
      else if (srcCurr === 'GBP' && selectedCurrency === 'USD') baseMonthlyPrice = Math.round(p * 1.25);
      else if (srcCurr === 'GBP' && selectedCurrency === 'INR') baseMonthlyPrice = Math.round(p * 100);
    }

    if (billingCycle === 'yearly') {
      // 20% discount
      const discountedMonthly = Math.round(baseMonthlyPrice * 0.8);
      return {
        monthlyFormatted: discountedMonthly,
        totalYearly: discountedMonthly * 12,
        savings: (baseMonthlyPrice - discountedMonthly) * 12
      };
    }

    return {
      monthlyFormatted: baseMonthlyPrice,
      totalYearly: baseMonthlyPrice * 12,
      savings: 0
    };
  };

  const currSymbol = currencyConfigs[selectedCurrency]?.symbol ?? '$';

  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 'plan-starter',
      name: 'Starter Plan (US/Global)',
      priceMonthly: 19,
      currency: 'USD',
      currencySymbol: '$',
      allocatedApiSlots: 1,
      maxSocialAccounts: 2,
      aiCredits: 500,
      features: [
        '1 Zernio API Key Slot (2 Social Channels)',
        '500 AI Content & Hashtag Credits/mo',
        'Instant & Scheduled Posting',
        'Cloudflare & Cloudinary CDN Integration',
        'Basic Activity Audit Logs'
      ]
    },
    {
      id: 'plan-pro',
      name: 'Pro Agency Plan (India Region)',
      priceMonthly: 1499,
      currency: 'INR',
      currencySymbol: '₹',
      allocatedApiSlots: 3,
      maxSocialAccounts: 6,
      aiCredits: 2500,
      isPopular: true,
      features: [
        '3 Zernio API Key Slots (6 Social Channels)',
        '2,500 AI Content & Hashtag Credits/mo',
        'Parallel Key Firing Engine',
        'Cloud Native Execution & Webhooks',
        'Google Review Auto-AI Responder',
        'Priority Super Admin Support'
      ]
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Agency Tier (UK/EU)',
      priceMonthly: 119,
      currency: 'GBP',
      currencySymbol: '£',
      allocatedApiSlots: 10,
      maxSocialAccounts: 20,
      aiCredits: 10000,
      features: [
        '10 Zernio API Key Slots (20 Social Channels)',
        '10,000 AI Content & Hashtag Credits/mo',
        'Unlimited Parallel Dispatch Engine',
        'Custom Storage Buckets & CDN',
        'Dedicated Account Manager & SLA'
      ]
    }
  ];

  const [selectedRoleTab, setSelectedRoleTab] = useState<'all' | 'business_user' | 'influencer' | 'agency'>('business_user');

  const rawPlans = Array.isArray(plans) && plans.length > 0 ? plans : INITIAL_PLANS;
  
  // Filter plans based on category tab
  const filteredPlans = rawPlans.filter((p: SubscriptionPlan) => {
    if (selectedRoleTab === 'all') return true;
    if (selectedRoleTab === 'business_user') return p.targetRole === 'business_user' || p.targetRole === 'free';
    return p.targetRole === selectedRoleTab;
  });

  const displayPlans = filteredPlans.map((p: SubscriptionPlan) => ({
    ...p,
    id: p?.id || 'plan-custom',
    name: p?.name || 'Subscription Plan',
    priceMonthly: p?.priceMonthly ?? 19,
    priceYearly: p?.priceYearly,
    billingCycle: p?.billingCycle || 'monthly',
    currency: p?.currency || 'INR',
    currencySymbol: p?.currencySymbol || '₹',
    allocatedApiSlots: p?.allocatedApiSlots ?? 1,
    maxSocialAccounts: p?.maxSocialAccounts ?? 2,
    aiCredits: p?.aiCredits ?? 1000,
    features: Array.isArray(p?.features) ? p.features : ['Core Social Posting Engine']
  }));

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-purple-50/30 to-slate-50 font-['Inter']" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-[#5D3FD3] text-xs font-bold font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>TRANSPARENT SUBSCRIPTION PLANS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Plans Built for Business Users, Influencers & Agencies
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg">
            Select your account role below to explore tailored monthly & annual pricing plans.
          </p>
        </div>

        {/* Currency Switcher (INR First) */}
        <div className="mt-8 flex items-center justify-center">
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
            {(['INR', 'USD', 'GBP'] as CurrencyCode[]).map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCurrency === curr
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {currencyConfigs[curr]?.label ?? curr}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs: Business Users vs Influencers vs Agencies */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setSelectedRoleTab('business_user')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              selectedRoleTab === 'business_user'
                ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🏢 Business Users (Monthly Plans)
          </button>

          <button
            onClick={() => setSelectedRoleTab('influencer')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              selectedRoleTab === 'influencer'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ⭐ Influencers (Yearly Plans)
          </button>

          <button
            onClick={() => setSelectedRoleTab('agency')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              selectedRoleTab === 'agency'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            💼 Agencies (Yearly Plans)
          </button>

          <button
            onClick={() => setSelectedRoleTab('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              selectedRoleTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            View All Plans
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {displayPlans.map((plan: any) => {
            const priceInfo = getCalculatedPrice(plan);
            const isPro = plan.isPopular || plan.id === 'plan-pro';
            const monthlyVal = priceInfo?.monthlyFormatted ?? 0;
            const yearlyVal = priceInfo?.totalYearly ?? 0;
            const savingsVal = priceInfo?.savings ?? 0;
            const creditsVal = plan?.aiCredits ?? 0;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-8 border flex flex-col justify-between relative transition-all duration-300 ${
                  isPro
                    ? 'border-2 border-[#5D3FD3] shadow-2xl shadow-purple-500/15 scale-[1.02] z-10'
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Badge */}
                  <div className="flex items-center justify-between pt-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {plan.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                      {plan.allocatedApiSlots} {plan.allocatedApiSlots === 1 ? 'Slot' : 'Slots'} ({plan.maxSocialAccounts} Channels)
                    </span>
                  </div>

                  {/* Price Header */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900">
                      {plan.currencySymbol || currSymbol}
                      {plan.priceYearly ? plan.priceYearly.toLocaleString() : plan.priceMonthly.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      {plan.priceYearly || plan.billingCycle === 'yearly' ? '/ year' : '/ month'}
                    </span>
                  </div>

                  {billingCycle === 'yearly' && (
                    <div className="mt-1 text-xs text-purple-600 font-bold flex items-center gap-1">
                      <span>Billed annually ({currSymbol}{yearlyVal.toLocaleString()}/yr)</span>
                      {savingsVal > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px]">
                          Save {currSymbol}{savingsVal.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Feature Summary Metrics */}
                  <div className="mt-6 p-4 rounded-2xl bg-purple-50/50 border border-purple-100/60 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>API Slot Allocation:</span>
                      <span className="text-[#5D3FD3] font-mono">{plan.allocatedApiSlots} Slots ({plan.maxSocialAccounts} Accounts)</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Monthly AI Credit Ledger:</span>
                      <span className="text-[#0066FF] font-mono">{creditsVal.toLocaleString()} Credits/mo</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                    <div className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                      Included Capabilities:
                    </div>
                    {plan.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-600 mt-0.5 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => onOpenCheckout(plan.id, billingCycle, selectedCurrency, currSymbol)}
                    className={`w-full py-4 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                      isPro
                        ? 'bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Subscribe & Provision Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-medium mt-2">
                    Instant automated provisioning via Razorpay Sandbox or WhatsApp Direct
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
