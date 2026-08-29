import React, { useState } from 'react';
import { SubscriptionPlan, CurrencyCode } from '../../types';
import { INITIAL_PLANS } from '../../lib/store';
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight, HelpCircle, Building2, Users, Star, Briefcase } from 'lucide-react';
import { PricingCalculator } from './PricingCalculator';

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
  const [selectedRoleTab, setSelectedRoleTab] = useState<'all' | 'business_user' | 'premium_business' | 'influencer' | 'agency'>('business_user');

  // Currency Symbols & Rates mapping for dynamic display
  const currencyConfigs: Record<CurrencyCode, { symbol: string; label: string }> = {
    INR: { symbol: '₹', label: 'INR (₹)' },
    USD: { symbol: '$', label: 'USD ($)' },
    GBP: { symbol: '£', label: 'GBP (£)' },
  };

  // Helper to compute price based on selected currency with rounded annual conversion
  const getCalculatedPrice = (plan: SubscriptionPlan) => {
    const currSym = currencyConfigs[selectedCurrency]?.symbol || '₹';
    const inrMonthly = plan.priceMonthly ?? 49;
    const inrYearly = plan.priceYearly ?? (inrMonthly * 12);

    if (inrYearly === 0) {
      return { currSym, displayMonthly: 0, displayYearly: 0 };
    }

    if (selectedCurrency === 'USD') {
      const roundedInrYearly = Math.ceil(inrYearly / 100) * 100;
      let displayYearly = Math.ceil(roundedInrYearly / 100);
      if (plan.id === 'plan-influencer-prime' || plan.id === 'plan-prem-biz-prime') displayYearly = 60;
      if (plan.id === 'plan-agency-command') displayYearly = 120;
      if (plan.id === 'plan-influencer-vault' || plan.id === 'plan-prem-biz-vault') displayYearly = 450;
      if (plan.id === 'plan-agency-infra') displayYearly = 500;

      const displayMonthly = Number((displayYearly / 12).toFixed(2));
      return { currSym, displayMonthly, displayYearly };
    }

    if (selectedCurrency === 'GBP') {
      const roundedInrYearly = Math.ceil(inrYearly / 100) * 100;
      let displayYearly = Math.ceil(roundedInrYearly / 100);
      if (plan.id === 'plan-influencer-prime' || plan.id === 'plan-prem-biz-prime') displayYearly = 50;
      if (plan.id === 'plan-agency-command') displayYearly = 100;
      if (plan.id === 'plan-influencer-vault' || plan.id === 'plan-prem-biz-vault') displayYearly = 360;
      if (plan.id === 'plan-agency-infra') displayYearly = 400;

      const displayMonthly = Number((displayYearly / 12).toFixed(2));
      return { currSym, displayMonthly, displayYearly };
    }

    // INR
    const displayYearly = inrYearly;
    const displayMonthly = plan.targetRole === 'business_user' ? inrMonthly : Math.round(inrYearly / 12);
    return { currSym, displayMonthly, displayYearly };
  };

  const defaultPlans: SubscriptionPlan[] = INITIAL_PLANS;
  const rawPlans = (Array.isArray(plans) && plans.length > 0 && plans.some(p => p.targetRole)) ? plans : INITIAL_PLANS;
  
  // Filter plans based on category tab
  const filteredPlans = rawPlans.filter((p: SubscriptionPlan) => {
    const role = p.targetRole || (p.priceMonthly === 0 ? 'free' : p.priceMonthly < 300 ? 'business_user' : 'agency');
    if (selectedRoleTab === 'all') return true;
    return role === selectedRoleTab || (selectedRoleTab === 'business_user' && role === 'free');
  });

  const displayPlans = filteredPlans.length > 0 ? filteredPlans : defaultPlans;

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 dark:from-[#0B0F17] dark:via-[#090D16] dark:to-[#0B0F17] font-['Inter'] transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ========================================================================= */}
        {/* PRICING HEADER */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 text-xs font-bold font-mono border border-purple-200/60 dark:border-purple-800/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARENT ENTERPRISE PRICING</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Flexible Plans for Every Growth Stage
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Provision isolated multi-tenant social management engines. Scale from starter channels to unlimited agency infrastructure with instant activation.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE PRICING CALCULATOR */}
        {/* ========================================================================= */}
        <div className="mt-8">
          <PricingCalculator
            plans={rawPlans}
            selectedCurrency={selectedCurrency}
            currencyConfigs={currencyConfigs}
            onOpenCheckout={onOpenCheckout}
          />
        </div>

        {/* ========================================================================= */}
        {/* CONTROLS BAR: CURRENCY SELECTOR & CATEGORY TABS */}
        {/* ========================================================================= */}
        <div className="space-y-6 pt-6 border-t border-slate-200/80 dark:border-slate-800">
          
          {/* Currency Switcher Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">ACTIVE CURRENCY:</span>
            <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              {(Object.keys(currencyConfigs) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedCurrency(code)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCurrency === code
                      ? 'bg-white dark:bg-slate-800 text-[#5D3FD3] dark:text-purple-300 shadow-sm border border-slate-200/80 dark:border-slate-700 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {currencyConfigs[code].label} ({currencyConfigs[code].symbol})
                </button>
              ))}
            </div>
          </div>

          {/* Role Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRoleTab('business_user')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedRoleTab === 'business_user'
                  ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              🏢 Business Users
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoleTab('premium_business')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedRoleTab === 'premium_business'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              👑 Premium Business
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoleTab('influencer')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedRoleTab === 'influencer'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              ⭐ Influencers (Yearly Plans)
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoleTab('agency')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedRoleTab === 'agency'
                  ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              💼 Agencies (Yearly Plans)
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoleTab('all')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedRoleTab === 'all'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              View All Plans
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* PRICING CARDS GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {displayPlans.map((plan: any) => {
            const priceInfo = getCalculatedPrice(plan);
            const isPro = plan.isPopular || plan.id === 'plan-pro' || plan.id === 'plan-biz-pro';

            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-8 border flex flex-col justify-between relative transition-all duration-300 ${
                  isPro
                    ? 'border-2 border-[#5D3FD3] dark:border-purple-500 shadow-2xl shadow-purple-500/20 scale-[1.02] z-10'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xl'
                }`}
              >
                {/* Popular Choice Badge */}
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  {/* Plan Name */}
                  <div className="pt-2 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {plan.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-100 dark:border-purple-800/80">
                      {plan.allocatedApiSlots} Slots
                    </span>
                  </div>

                  {/* Main Monthly Rate Display */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                      {priceInfo.currSym}
                      {priceInfo.displayMonthly.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      / month
                    </span>
                  </div>

                  {/* Annual Billing Sub-Badge */}
                  {priceInfo.displayYearly > 0 ? (
                    <div className="mt-2 text-xs font-bold text-[#5D3FD3] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-xl inline-block font-mono border border-purple-100 dark:border-purple-800/80">
                      Billed annually ({priceInfo.currSym}{priceInfo.displayYearly.toLocaleString()} / year)
                    </div>
                  ) : (
                    <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl inline-block font-mono border border-emerald-100 dark:border-emerald-800/80">
                      Free Starter Forever (₹0)
                    </div>
                  )}

                  {/* Features Checklist */}
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Included Capabilities:
                    </div>
                    {plan.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <div className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Subscribe Button */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenCheckout(plan.id, plan.targetRole === 'business_user' ? 'monthly' : 'yearly', selectedCurrency, priceInfo.currSym)}
                    className={`w-full py-4 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPro
                        ? 'bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white hover:shadow-purple-500/35 hover:scale-102 active:scale-98'
                        : 'bg-slate-900 dark:bg-purple-600 hover:bg-slate-800 dark:hover:bg-purple-500 text-white hover:scale-102 active:scale-98'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Subscribe & Provision Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium mt-2">
                    Instant automated provisioning via Razorpay Sandbox or WhatsApp Direct
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* ENTERPRISE TRUST & SLA FOOTER CALLOUT */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CUSTOM ENTERPRISE QUOTAS AVAILABLE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Need 50+ API Slots or Custom Storage Buckets?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              We provide custom dedicated server dispatchers, tailored rate-limits, and private SLA support.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenCheckout('plan-prem-biz-vault', 'yearly', selectedCurrency)}
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs shadow-md shrink-0 transition-transform hover:scale-102 cursor-pointer"
          >
            Contact Enterprise Sales
          </button>
        </div>

      </div>
    </div>
  );
};
