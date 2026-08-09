import React, { useState } from 'react';
import { SubscriptionPlan, CurrencyCode } from '../../types';
import { INITIAL_PLANS } from '../../lib/store';
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react';
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

  const [selectedRoleTab, setSelectedRoleTab] = useState<'all' | 'business_user' | 'premium_business' | 'influencer' | 'agency'>('business_user');

  const rawPlans = (Array.isArray(plans) && plans.length > 0 && plans.some(p => p.targetRole)) ? plans : INITIAL_PLANS;
  
  // Filter plans based on category tab
  const filteredPlans = rawPlans.filter((p: SubscriptionPlan) => {
    const role = p.targetRole || (p.priceMonthly === 0 ? 'free' : p.priceMonthly < 300 ? 'business_user' : 'agency');
    if (selectedRoleTab === 'all') return true;
    return role === selectedRoleTab || (selectedRoleTab === 'business_user' && role === 'free');
  });

  const displayPlans = filteredPlans.length > 0 ? filteredPlans : defaultPlans;

  return (
    <div className="py-16 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-[#5D3FD3] text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARENT ENTERPRISE PRICING</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Flexible Plans for Every Growth Stage
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Provision isolated multi-tenant social management engines. Scale from starter channels to unlimited agency infrastructure.
          </p>
        </div>

        {/* Pricing Calculator */}
        <div className="mt-12">
          <PricingCalculator
            plans={rawPlans}
            selectedCurrency={selectedCurrency}
            currencyConfigs={currencyConfigs}
            onOpenCheckout={onOpenCheckout}
          />
        </div>

        {/* Currency Switcher */}
        <div className="mt-8 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-500 font-mono">CURRENCY:</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {(Object.keys(currencyConfigs) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  onClick={() => setSelectedCurrency(code)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCurrency === code
                      ? 'bg-white text-[#5D3FD3] shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {currencyConfigs[code].label} ({currencyConfigs[code].symbol})
                </button>
              ))}
            </div>
          </div>

        {/* Role Category Tabs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedRoleTab('business_user')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              selectedRoleTab === 'business_user'
                ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🏢 Business Users
          </button>

          <button
            onClick={() => setSelectedRoleTab('premium_business')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              selectedRoleTab === 'premium_business'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            👑 Premium Business
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
            const isPro = plan.isPopular || plan.id === 'plan-pro' || plan.id === 'plan-biz-pro';

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
                  {/* Plan Name */}
                  <div className="pt-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Main Price Header - Monthly Rate */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900">
                      {priceInfo.currSym}
                      {priceInfo.displayMonthly.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      / month
                    </span>
                  </div>

                  {/* Billed Annually Sub-badge */}
                  {priceInfo.displayYearly > 0 ? (
                    <div className="mt-2 text-xs font-bold text-[#5D3FD3] bg-purple-50 px-2.5 py-1 rounded-lg inline-block font-mono">
                      Billed annually ({priceInfo.currSym}{priceInfo.displayYearly.toLocaleString()} / year)
                    </div>
                  ) : (
                    <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block font-mono">
                      Free Forever (₹0)
                    </div>
                  )}

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
                    onClick={() => onOpenCheckout(plan.id, 'yearly', selectedCurrency, priceInfo.currSym)}
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
    </div>
  );
};
