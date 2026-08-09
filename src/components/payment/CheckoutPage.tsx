import React, { useState } from 'react';
import { useUser, SignInButton, SignUpButton } from '@clerk/react';
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
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const { user, isSignedIn, isLoaded } = useUser();
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'razorpay'>('whatsapp');

  const effectiveCurrency = selectedCurrency || selectedPlan.currency || 'USD';
  const currencyConfigs: Record<CurrencyCode, string> = {
    USD: '$',
    INR: '₹',
    GBP: '£',
  };
  const effectiveSymbol = currencySymbol || currencyConfigs[effectiveCurrency] || selectedPlan.currencySymbol || '$';

  // Compute pricing
  const baseMonthly = selectedPlan.priceMonthly ?? 49;
  let convertedMonthly = baseMonthly;

  if (effectiveCurrency === 'USD') {
    convertedMonthly = Math.ceil(baseMonthly / 80);
  } else if (effectiveCurrency === 'GBP') {
    convertedMonthly = Math.ceil(baseMonthly / 100);
  }

  const displayMonthly = convertedMonthly;
  const totalYearlyAmount = selectedPlan.priceYearly 
    ? (effectiveCurrency === 'USD' ? Math.ceil(selectedPlan.priceYearly / 80) : effectiveCurrency === 'GBP' ? Math.ceil(selectedPlan.priceYearly / 100) : selectedPlan.priceYearly)
    : (displayMonthly * 12);

  const totalAmount = totalYearlyAmount;

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] text-slate-900 py-4 px-3 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-3">
        
        {/* Top Compact Navigation Ribbon Bar */}
        <div className="flex flex-row items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link 
              to="/pricing" 
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-1.5 no-underline text-xs font-bold shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Plans</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono text-[#5D3FD3] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 shrink-0">
                STEP 2 OF 2
              </span>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Checkout & Workspace Order</h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted Workspace Provisioning</span>
          </div>
        </div>

        {/* Main 2-Column Responsive Layout: Left (Plan & Auth) vs Right (Unified Payment Form) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
          
          {/* Left Column (5 Cols): Account Verification & Selected Plan Summary */}
          <div className="md:col-span-5 space-y-3">
            
            {/* 1. Account Authentication Requirement Card */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500">
                  <UserCheck className="w-3.5 h-3.5 text-[#5D3FD3]" />
                  <span>Account Verification</span>
                </div>
                {isLoaded && isSignedIn && (
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                )}
              </div>

              {isLoaded && isSignedIn ? (
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center gap-2.5">
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || 'User Avatar'} 
                    className="w-9 h-9 rounded-lg object-cover border border-purple-200 shadow-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{user.fullName || 'SocialSpree User'}</h4>
                    <p className="text-[10px] text-slate-600 font-mono truncate">
                      {user.primaryEmailAddress?.emailAddress || 'User Email'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                  <div className="flex items-start gap-2">
                    <UserPlus className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Sign In Required</h4>
                      <p className="text-[10px] text-amber-800 leading-tight">
                        Please sign in or create an account to issue your workspace keys.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2">
                    <SignUpButton mode="modal">
                      <button className="flex-1 py-1.5 px-3 rounded-lg bg-[#5D3FD3] hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer">
                        <UserPlus className="w-3 h-3" />
                        <span>Create Account</span>
                      </button>
                    </SignUpButton>

                    <SignInButton mode="modal">
                      <button className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
                        <Lock className="w-3 h-3 text-slate-600" />
                        <span>Sign In</span>
                      </button>
                    </SignInButton>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Selected Plan Order Summary Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[9px] font-mono font-bold bg-purple-100 text-[#5D3FD3] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Selected Plan
                  </span>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    {selectedPlan.name}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-[#5D3FD3] text-2xl font-black">
                    {effectiveSymbol}{displayMonthly.toLocaleString()}
                    <span className="text-[11px] font-bold text-slate-500 ml-0.5">/ month</span>
                  </div>
                  {totalAmount > 0 && (
                    <div className="text-[9px] font-bold text-[#5D3FD3] bg-purple-50 px-2 py-0.5 rounded font-mono inline-block">
                      Billed annually ({effectiveSymbol}{totalAmount.toLocaleString()} / year)
                    </div>
                  )}
                </div>
              </div>

              {/* Feature Checklist - 2-Column Grid */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Included Tenant Capabilities:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium">
                      <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-600 mt-0.5 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Instant automated slot creation upon order confirmation</span>
              </div>
            </div>

          </div>

          {/* Right Column (7 Cols): Unified Single Card for Payment & WhatsApp Order Form */}
          <div className="md:col-span-7">
            
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
              
              {/* Payment Channel Selection Header */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    <Zap className="w-3 h-3" />
                    <span>SELECT PAYMENT CHANNEL</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Choose payment channel below</span>
                </div>

                {/* Horizontal Payment Option Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveChannel('whatsapp')}
                    className={`p-2 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                      activeChannel === 'whatsapp'
                        ? 'border-[#25D366] bg-emerald-50/40'
                        : 'border-slate-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                        <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">WhatsApp Direct</div>
                        <div className="text-[9px] font-bold text-emerald-700 font-mono">1ST CHOICE (ACTIVE)</div>
                      </div>
                    </div>
                    {activeChannel === 'whatsapp' && (
                      <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                    )}
                  </button>

                  <div 
                    className="p-2 rounded-xl border-2 border-slate-200 bg-slate-50/70 opacity-70 cursor-not-allowed text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate">Razorpay Gateway</div>
                        <div className="text-[9px] font-bold text-amber-800 font-mono">COMING SOON</div>
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
                    billingCycle="yearly"
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
  );
};
