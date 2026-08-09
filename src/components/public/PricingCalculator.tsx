import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Sliders, Users, MessageSquare, Cloud, Check, Sparkles, ArrowRight, Zap, Building2, Star, Briefcase } from 'lucide-react';
import { SubscriptionPlan, CurrencyCode } from '../../types';

interface PricingCalculatorProps {
  plans: SubscriptionPlan[];
  selectedCurrency: CurrencyCode;
  currencyConfigs: Record<CurrencyCode, { symbol: string; label: string }>;
  onOpenCheckout: (planId: string, billingCycle: 'monthly' | 'yearly', selectedCurrency?: CurrencyCode, currencySymbol?: string) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  plans,
  selectedCurrency,
  currencyConfigs,
  onOpenCheckout
}) => {
  const [role, setRole] = useState<'business_user' | 'premium_business' | 'influencer' | 'agency'>('business_user');
  const [socialAccounts, setSocialAccounts] = useState<number>(3);
  const [posts, setPosts] = useState<number>(10);
  const [autoresponder, setAutoresponder] = useState<boolean>(false);
  const [privateCloud, setPrivateCloud] = useState<boolean>(false);

  // Linked Toggle Handler: If any one premium toggle is turned ON/OFF, the other also turns ON/OFF
  const handleTogglePremiumAddons = () => {
    const nextVal = !(autoresponder || privateCloud);
    setAutoresponder(nextVal);
    setPrivateCloud(nextVal);
    if (nextVal && role === 'business_user') {
      setRole('premium_business');
    }
  };

  // Conversion logic matching the app
  const convertPrice = (priceInr: number, currency: CurrencyCode): number => {
    if (currency === 'USD') return Math.ceil(priceInr / 80);
    if (currency === 'GBP') return Math.ceil(priceInr / 100);
    return priceInr;
  };

  const getPlanMaxPosts = (plan: SubscriptionPlan): number => {
    if (plan.priceMonthly === 0) return 2;
    if (plan.targetRole === 'business_user') {
      if (plan.priceMonthly === 49) return 8;
      if (plan.priceMonthly === 99) return 16;
      if (plan.priceMonthly === 149) return 20;
      if (plan.priceMonthly === 199 || plan.priceMonthly === 249) return 30;
    }
    return 999; // Unlimited for premium_business / influencer / agency
  };

  const recommendedPlan = useMemo(() => {
    const rolePlans = plans.filter(p => p.targetRole === role || p.targetRole === 'free');
    
    // Exact matching logic
    const validPlans = rolePlans.filter(p => {
      const maxPosts = getPlanMaxPosts(p);
      const meetsAccounts = p.maxSocialAccounts >= socialAccounts;
      const meetsPosts = maxPosts >= posts;
      
      const isPremiumFeat = (p.priceYearly || p.priceMonthly * 12) >= 5000 && (p.targetRole === 'premium_business' || p.targetRole === 'influencer' || p.targetRole === 'agency');
      const meetsAutoresponder = autoresponder ? isPremiumFeat : true;
      const meetsPrivateCloud = privateCloud ? isPremiumFeat : true;

      return meetsAccounts && meetsPosts && meetsAutoresponder && meetsPrivateCloud;
    });

    if (validPlans.length > 0) {
      // Find cheapest plan among valid
      validPlans.sort((a, b) => a.priceMonthly - b.priceMonthly);
      return { plan: validPlans[0], isExactMatch: true };
    }

    // Fallback: Highest tier for the role if no exact match
    const specificRolePlans = rolePlans.filter(p => p.targetRole === role);
    if (specificRolePlans.length > 0) {
      specificRolePlans.sort((a, b) => b.priceMonthly - a.priceMonthly);
      return { plan: specificRolePlans[0], isExactMatch: false };
    }
    
    // Absolute fallback
    return { plan: plans[plans.length - 1], isExactMatch: false };
  }, [plans, role, socialAccounts, posts, autoresponder, privateCloud]);

  const { plan, isExactMatch } = recommendedPlan;
  const currencySymbol = currencyConfigs[selectedCurrency].symbol;

  const calcPrice = useMemo(() => {
    if (!plan) return { displayMonthly: 0, displayYearly: 0 };
    const inrMonthly = plan.priceMonthly ?? 49;
    const inrYearly = plan.priceYearly ?? (inrMonthly * 12);

    if (inrYearly === 0) return { displayMonthly: 0, displayYearly: 0 };

    if (selectedCurrency === 'USD') {
      const roundedInrYearly = Math.ceil(inrYearly / 100) * 100;
      let displayYearly = Math.ceil(roundedInrYearly / 100);
      if (plan.id === 'plan-influencer-prime' || plan.id === 'plan-prem-biz-prime') displayYearly = 60;
      if (plan.id === 'plan-agency-command') displayYearly = 120;
      if (plan.id === 'plan-influencer-vault' || plan.id === 'plan-prem-biz-vault') displayYearly = 450;
      if (plan.id === 'plan-agency-infra') displayYearly = 500;
      const displayMonthly = Number((displayYearly / 12).toFixed(2));
      return { displayMonthly, displayYearly };
    }

    if (selectedCurrency === 'GBP') {
      const roundedInrYearly = Math.ceil(inrYearly / 100) * 100;
      let displayYearly = Math.ceil(roundedInrYearly / 100);
      if (plan.id === 'plan-influencer-prime' || plan.id === 'plan-prem-biz-prime') displayYearly = 50;
      if (plan.id === 'plan-agency-command') displayYearly = 100;
      if (plan.id === 'plan-influencer-vault' || plan.id === 'plan-prem-biz-vault') displayYearly = 360;
      if (plan.id === 'plan-agency-infra') displayYearly = 400;
      const displayMonthly = Number((displayYearly / 12).toFixed(2));
      return { displayMonthly, displayYearly };
    }

    const displayYearly = inrYearly;
    const displayMonthly = plan.targetRole === 'business_user' ? inrMonthly : Math.round(inrYearly / 12);
    return { displayMonthly, displayYearly };
  }, [plan, selectedCurrency]);
  
  const planMaxPosts = plan ? getPlanMaxPosts(plan) : 0;
  const planMaxAccounts = plan ? plan.maxSocialAccounts : 0;
  
  const postProgress = Math.min(100, (posts / (planMaxPosts === 999 ? Math.max(posts, 100) : planMaxPosts)) * 100);
  const accountProgress = Math.min(100, (socialAccounts / planMaxAccounts) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 font-['Inter']">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <Calculator className="w-8 h-8 text-[#5D3FD3]" />
          Plan Calculator
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
          Configure your exact needs and let us find the perfect plan for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-7 bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#5D3FD3]" />
            Find Your Perfect Plan
          </h3>

          <div className="space-y-8">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">I am a...</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setRole('business_user')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                    role === 'business_user' 
                      ? 'border-[#5D3FD3] bg-white text-[#5D3FD3] shadow-md scale-105 font-bold' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#5D3FD3]/50'
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">Business</span>
                </button>
                <button
                  onClick={() => setRole('premium_business')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                    role === 'premium_business' 
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-md scale-105 font-bold' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mb-1 text-purple-600" />
                  <span className="text-xs font-bold">Prem Biz</span>
                </button>
                <button
                  onClick={() => setRole('influencer')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                    role === 'influencer' 
                      ? 'border-pink-600 bg-white text-pink-600 shadow-md scale-105 font-bold' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-pink-300'
                  }`}
                >
                  <Star className="w-5 h-5 mb-1 text-pink-500" />
                  <span className="text-xs font-bold">Influencer</span>
                </button>
                <button
                  onClick={() => setRole('agency')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                    role === 'agency' 
                      ? 'border-amber-600 bg-white text-amber-600 shadow-md scale-105 font-bold' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                  }`}
                >
                  <Briefcase className="w-5 h-5 mb-1 text-amber-600" />
                  <span className="text-xs font-bold">Agency</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#5D3FD3]" />
                  Social Accounts Needed
                </label>
                <span className="text-sm font-bold text-[#5D3FD3] bg-purple-50 px-3 py-1 rounded-full border border-purple-100 font-mono">
                  {socialAccounts} {socialAccounts === 1 ? 'Account' : 'Accounts'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={socialAccounts}
                onChange={(e) => setSocialAccounts(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5D3FD3]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#5D3FD3]" />
                  Monthly Posts Needed
                </label>
                <span className="text-sm font-bold text-[#5D3FD3] bg-purple-50 px-3 py-1 rounded-full border border-purple-100 font-mono">
                  {posts} Posts/mo
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={posts}
                onChange={(e) => setPosts(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#5D3FD3]"
              />
            </div>

            {/* Linked Add-ons: Turning one on/off toggles both */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Premium Add-ons</label>
                <span className="text-[10px] font-bold font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                  LINKED PREVIEW
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${autoresponder ? 'bg-purple-100 text-[#5D3FD3]' : 'bg-slate-100 text-slate-500'}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Comment Autoresponder</p>
                    <p className="text-xs text-slate-500">AI replies to Insta & FB comments</p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePremiumAddons}
                  className={`w-12 h-6 rounded-full transition-colors duration-300 relative cursor-pointer ${autoresponder ? 'bg-[#5D3FD3]' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${autoresponder ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${privateCloud ? 'bg-blue-100 text-[#0066FF]' : 'bg-slate-100 text-slate-500'}`}>
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Private Cloud</p>
                    <p className="text-xs text-slate-500">Dedicated isolated cloud instance</p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePremiumAddons}
                  className={`w-12 h-6 rounded-full transition-colors duration-300 relative cursor-pointer ${privateCloud ? 'bg-[#0066FF]' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${privateCloud ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Recommended Result */}
        <div className="lg:col-span-5 relative p-[2px] rounded-3xl bg-gradient-to-br from-[#5D3FD3] to-[#0066FF] shadow-xl overflow-hidden h-full">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl z-0"></div>
          <div className="relative z-10 bg-white/95 h-full rounded-[23px] p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200/50 mb-6">
                <Sparkles className="w-4 h-4 text-[#5D3FD3]" />
                <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#5D3FD3] to-[#0066FF]">
                  Recommended for You
                </span>
              </div>

              {plan ? (
                <>
                  <h4 className="text-3xl font-black text-slate-900 mb-2">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-[#5D3FD3]">{currencySymbol}{calcPrice.displayMonthly.toLocaleString()}</span>
                    <span className="text-slate-500 font-bold text-sm">/ month</span>
                  </div>
                  {calcPrice.displayYearly > 0 ? (
                    <p className="text-xs font-bold text-[#5D3FD3] bg-purple-50 px-2.5 py-1 rounded-lg inline-block font-mono mb-4">
                      Billed annually ({currencySymbol}{calcPrice.displayYearly.toLocaleString()} / year)
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block font-mono mb-4">
                      Free Forever (₹0)
                    </p>
                  )}
                  {!isExactMatch && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 mb-6">
                      We've suggested our most premium plan, as your requirements exceed our standard tiers.
                    </p>
                  )}

                  <div className="space-y-5 mt-8">
                    {/* Social Accounts Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-600 font-medium">Social Accounts</span>
                        <span className="text-slate-900 font-bold">{socialAccounts} / {planMaxAccounts}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0066FF] transition-all duration-500 rounded-full"
                          style={{ width: `${accountProgress}%`, backgroundColor: accountProgress > 100 ? '#ef4444' : '#0066FF' }}
                        />
                      </div>
                    </div>

                    {/* Posts Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-600 font-medium">Monthly Posts</span>
                        <span className="text-slate-900 font-bold">
                          {posts} / {planMaxPosts === 999 ? 'Unlimited' : planMaxPosts}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#5D3FD3] transition-all duration-500 rounded-full"
                          style={{ width: `${postProgress}%`, backgroundColor: postProgress > 100 ? '#ef4444' : '#5D3FD3' }}
                        />
                      </div>
                    </div>
                  </div>

                  <ul className="mt-8 space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">Target Role: <strong className="capitalize">{plan.targetRole?.replace('_', ' ')}</strong></span>
                    </li>
                    {autoresponder && (
                      <li className="flex items-start gap-3">
                        <Check className={`w-5 h-5 shrink-0 mt-0.5 ${isExactMatch ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={`text-sm ${isExactMatch ? 'text-slate-700' : 'text-slate-500 line-through'}`}>Comment Autoresponder</span>
                      </li>
                    )}
                    {privateCloud && (
                      <li className="flex items-start gap-3">
                        <Check className={`w-5 h-5 shrink-0 mt-0.5 ${isExactMatch ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={`text-sm ${isExactMatch ? 'text-slate-700' : 'text-slate-500 line-through'}`}>Private Cloud Instance</span>
                      </li>
                    )}
                  </ul>
                </>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-slate-500">No matching plans found.</p>
                </div>
              )}
            </div>

            {plan && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={() => onOpenCheckout(plan.id, 'yearly', selectedCurrency, currencySymbol)}
                  className="w-full py-4 px-6 bg-slate-900 hover:bg-[#5D3FD3] text-white rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/20 hover:shadow-[#5D3FD3]/30"
                >
                  Subscribe Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-xs text-slate-500 mt-3 font-medium">
                  7-day money-back guarantee
                </p>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};
