import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { SubscriptionPlan, CurrencyCode } from '../../types';
import { WhatsAppCheckout, WhatsAppIcon } from './WhatsAppCheckout';
import { RazorpaySandbox } from './RazorpaySandbox';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  ArrowLeft, 
  UserCheck, 
  UserPlus, 
  Lock, 
  Zap, 
  Check, 
  HelpCircle,
  Clock,
  Building2,
  LogIn
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface CheckoutPageProps {
  selectedPlan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  selectedCurrency?: CurrencyCode;
  currencySymbol?: string;
  onLaunchApp: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  selectedPlan,
  billingCycle,
  selectedCurrency,
  currencySymbol,
  onLaunchApp
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'razorpay'>('whatsapp');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsSignedIn(true);
      }
    });
  }, []);

  const effectiveCurrency = selectedCurrency || selectedPlan.currency || 'USD';
  const currencyConfigs: Record<CurrencyCode, string> = {
    USD: '$',
    INR: '₹',
    GBP: '£',
  };
  const effectiveSymbol = currencySymbol || currencyConfigs[effectiveCurrency] || selectedPlan.currencySymbol || '$';

  // Compute pricing
  const baseMonthly = selectedPlan.priceMonthly ?? 49;
  const sourceCurrency = selectedPlan.currency || 'USD';
  let convertedMonthly = baseMonthly;

  if (sourceCurrency === 'INR' && effectiveCurrency === 'USD') {
    convertedMonthly = Math.ceil(baseMonthly / 80);
  } else if (sourceCurrency === 'INR' && effectiveCurrency === 'GBP') {
    convertedMonthly = Math.ceil(baseMonthly / 100);
  }

  const displayMonthly = convertedMonthly;
  const totalYearlyAmount = selectedPlan.priceYearly 
    ? (sourceCurrency === 'INR' && effectiveCurrency === 'USD' ? Math.ceil(selectedPlan.priceYearly / 80) : sourceCurrency === 'INR' && effectiveCurrency === 'GBP' ? Math.ceil(selectedPlan.priceYearly / 100) : selectedPlan.priceYearly)
    : (displayMonthly * 12);

  const totalAmount = billingCycle === 'yearly' ? totalYearlyAmount : displayMonthly;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] font-['Inter'] text-slate-900 dark:text-slate-100 py-4 px-3 sm:px-6 lg:px-8 flex flex-col justify-between transition-colors duration-150">
      <div className="max-w-7xl mx-auto w-full space-y-3">
        
        {/* Top Compact Navigation Ribbon Bar */}
        <div className="flex flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <Link 
              to="/pricing" 
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 no-underline text-xs font-bold shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Plans</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono text-[#5D3FD3] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800/80 shrink-0">
                STEP 2 OF 2
              </span>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">Checkout & Workspace Order</h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>256-Bit SSL Encrypted Workspace Provisioning</span>
          </div>
        </div>

        {/* Main 2-Column Balanced Layout: Left (Plan & Auth) vs Right (Payment & WhatsApp Order) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          
          {/* Left Column (5 Cols): Unified Selected Plan & Account Verification Card */}
          <div className="md:col-span-5 flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full space-y-4">
              
              <div className="space-y-3.5">
                {/* 1. Selected Plan Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[9px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Selected Plan
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">
                      {selectedPlan.name}
                    </h2>
                  </div>

                  <div className="text-right">
                    <div className="text-[#5D3FD3] dark:text-purple-400 text-2xl font-black">
                      {effectiveSymbol}{displayMonthly.toLocaleString()}
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-0.5">/ month</span>
                    </div>
                    {totalAmount > 0 && (
                      <div className="text-[9px] font-bold text-[#5D3FD3] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded font-mono inline-block">
                        Billed annually ({effectiveSymbol}{totalAmount.toLocaleString()} / year)
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Included Tenant Capabilities */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-900 dark:text-slate-200 uppercase font-mono tracking-wider">
                    Included Tenant Capabilities:
                  </div>
                  <div className="space-y-1.5">
                    {selectedPlan.features
                      .filter(f => !f.toLowerCase().includes('ai content credits') && !f.toLowerCase().includes('slot allocation') && !f.toLowerCase().includes('ledger'))
                      .map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <div className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{feature}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* 3. Account Verification Bar at Bottom of Left Card */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#5D3FD3] dark:text-purple-400" />
                    <span>Account Verification</span>
                  </div>
                  {isSignedIn && (
                    <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Verified
                    </span>
                  )}
                </div>

                {isSignedIn && user ? (
                  <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 flex items-center gap-2.5">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt={user.user_metadata?.full_name || 'User Avatar'} 
                        className="w-8 h-8 rounded-lg object-cover border border-purple-200 dark:border-purple-700 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#5D3FD3] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {(user.email || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Authenticated Account'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserPlus className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">Sign In Required</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="py-1 px-2.5 rounded-lg bg-[#5D3FD3] hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                      >
                        Sign Up
                      </button>
                      <button 
                        type="button"
                        onClick={() => navigate('/login')}
                        className="py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Identity verified via Supabase Authentication</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (7 Cols): Unified Payment & WhatsApp Order Card */}
          <div className="md:col-span-7 flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 h-full flex flex-col justify-between">
              
              <div className="space-y-3">
                {/* Payment Channel Selection Header */}
                <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold font-mono">
                      <Zap className="w-3 h-3" />
                      <span>SELECT PAYMENT CHANNEL</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Choose payment channel below</span>
                  </div>

                  {/* Horizontal Payment Option Tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveChannel('whatsapp')}
                      className={`p-2 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                        activeChannel === 'whatsapp'
                          ? 'border-[#25D366] bg-emerald-50/40 dark:bg-emerald-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                          <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">WhatsApp Direct</div>
                          <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">1ST CHOICE (ACTIVE)</div>
                        </div>
                      </div>
                      {activeChannel === 'whatsapp' && (
                        <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                      )}
                    </button>

                    <div 
                      className="p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 opacity-70 cursor-not-allowed text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                          <CreditCard className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">Razorpay Gateway</div>
                          <div className="text-[9px] font-bold text-amber-800 dark:text-amber-400 font-mono">COMING SOON</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Channel Component Display */}
                <div>
                  {activeChannel === 'whatsapp' ? (
                    <WhatsAppCheckout
                      plan={selectedPlan}
                      billingCycle={billingCycle}
                      onClose={() => {}}
                    />
                  ) : (
                    <RazorpaySandbox
                      plan={selectedPlan}
                      billingCycle={billingCycle}
                      onCancel={() => {}}
                    />
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
