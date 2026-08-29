import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sliders, 
  Users, 
  MessageSquare, 
  Cloud, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Building2, 
  Star, 
  Briefcase 
} from 'lucide-react';
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
  const [socialAccounts, setSocialAccounts] = useState<number>(4);
  const [posts, setPosts] = useState<number>(16);
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
  const currencySymbol = currencyConfigs[selectedCurrency]?.symbol || '₹';

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

    // INR
    const displayYearly = inrYearly;
    const displayMonthly = plan.targetRole === 'business_user' ? inrMonthly : Math.round(inrYearly / 12);
    return { displayMonthly, displayYearly };
  }, [plan, selectedCurrency]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200/90 dark:border-purple-800 shadow-xl overflow-hidden p-6 sm:p-10 font-['Inter'] transition-colors duration-150">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Interactive Capacity & ROI Calculator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Find the exact tier tailored to your publishing volume</p>
          </div>
        </div>

        {/* Persona Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setRole('business_user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'business_user' ? 'bg-white dark:bg-slate-700 text-[#5D3FD3] dark:text-purple-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Business
          </button>
          <button
            type="button"
            onClick={() => setRole('premium_business')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'premium_business' ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Premium Biz
          </button>
          <button
            type="button"
            onClick={() => setRole('influencer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'influencer' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Creator
          </button>
          <button
            type="button"
            onClick={() => setRole('agency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'agency' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Agency
          </button>
        </div>
      </div>

      {/* Main Calculator Grid: Left Sliders vs Right Recommended Plan */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Sliders Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Social Accounts Slider */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
                Connected Social Channels:
              </span>
              <span className="font-mono text-[#5D3FD3] dark:text-purple-400 text-sm font-black">{socialAccounts} Channels</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={socialAccounts}
              onChange={(e) => setSocialAccounts(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#5D3FD3]"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <span>2 Channels</span>
              <span>10 Channels</span>
              <span>20 Channels</span>
            </div>
          </div>

          {/* Monthly Posts Slider */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#0066FF] dark:text-blue-400" />
                Monthly Post Dispatches:
              </span>
              <span className="font-mono text-[#0066FF] dark:text-blue-400 text-sm font-black">
                {posts >= 100 ? 'Unlimited Posts' : `${posts} Posts / mo`}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={100}
              step={2}
              value={posts}
              onChange={(e) => setPosts(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0066FF]"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <span>2 Posts</span>
              <span>30 Posts</span>
              <span>100+ Unlimited</span>
            </div>
          </div>

          {/* Linked Add-On Toggles */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Include AI Comment Auto-Responder & Dedicated CDN Storage</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Enables keyword trigger reply bot and private multi-Cloudinary media vaults
              </p>
            </div>

            <button
              type="button"
              onClick={handleTogglePremiumAddons}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                autoresponder || privateCloud ? 'bg-[#5D3FD3] dark:bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                  autoresponder || privateCloud ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Right Side: Recommended Plan Card (5 Cols) */}
        {plan && (
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 dark:from-slate-950 dark:via-purple-950/80 dark:to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {isExactMatch ? 'Recommended Exact Match' : 'Best Scaling Plan'}
                </span>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {plan.allocatedApiSlots} API Slots
                </span>
              </div>

              <div>
                <h4 className="text-2xl font-black text-white tracking-tight">{plan.name}</h4>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Supports up to {plan.maxSocialAccounts} social channels firing in parallel
                </p>
              </div>

              <div className="pt-2 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white font-sans">
                  {currencySymbol}{calcPrice.displayMonthly.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">/ month</span>
              </div>

              {calcPrice.displayYearly > 0 && (
                <div className="text-[11px] font-mono text-purple-300 bg-purple-900/50 px-2.5 py-1 rounded-lg border border-purple-700/50 inline-block">
                  Billed annually: {currencySymbol}{calcPrice.displayYearly.toLocaleString()} / year
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => onOpenCheckout(plan.id, plan.targetRole === 'business_user' ? 'monthly' : 'yearly', selectedCurrency, currencySymbol)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white text-xs font-black shadow-lg shadow-purple-500/30 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Select {plan.name} & Provision</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[10px] text-center text-slate-400 font-mono">
                Instant Razorpay Sandbox & WhatsApp Direct activation
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
