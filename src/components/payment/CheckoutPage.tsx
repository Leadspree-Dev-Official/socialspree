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
    <div className="min-h-screen bg-slate-50 font-['Inter'] text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Link 
              to="/pricing" 
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center gap-2 no-underline text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Plans</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-[#5D3FD3] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  STEP 2 OF 2
                </span>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Checkout & Workspace Order</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Review your order details and choose your preferred provisioning channel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted Workspace Provisioning</span>
          </div>
        </div>

        {/* Main 2-Column Responsive Layout: Left (Plan & Auth) vs Right (Payment & WhatsApp Order) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* Left Column (5 Cols): Account Verification & Selected Plan Summary */}
          <div className="md:col-span-5 space-y-4">
            
            {/* 1. Account Authentication Requirement Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500">
                  <UserCheck className="w-4 h-4 text-[#5D3FD3]" />
                  <span>Account Verification</span>
                </div>
                {isLoaded && isSignedIn && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                )}
              </div>

              {isLoaded && isSignedIn ? (
                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center gap-3">
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || 'User Avatar'} 
                    className="w-10 h-10 rounded-xl object-cover border border-purple-200 shadow-xs"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{user.fullName || 'SocialSpree User'}</h4>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      {user.primaryEmailAddress?.emailAddress || 'User Email'}
                    </p>
                    <p className="text-[10px] text-purple-700 font-bold mt-0.5">
                      ⚡ Ready for instant workspace provisioning
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <UserPlus className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Create an Account or Sign In Required</h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                        To provision your isolated multi-tenant workspace and issue API keys, please create a free account or sign in first.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <SignUpButton mode="modal">
                      <button className="w-full py-2 px-3 rounded-xl bg-[#5D3FD3] hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Account</span>
                      </button>
                    </SignUpButton>

                    <SignInButton mode="modal">
                      <button className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Sign In</span>
                      </button>
                    </SignInButton>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Identity verified via Clerk authentication</span>
              </div>
            </div>

            {/* 2. Selected Plan Order Summary Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-[#5D3FD3] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Selected Plan
                  </span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    {selectedPlan.name}
                  </h2>
                </div>

                <div className="text-right">
                  <div className="text-[#5D3FD3] text-2xl font-black">
                    {effectiveSymbol}{displayMonthly.toLocaleString()}
                    <span className="text-xs font-bold text-slate-500 ml-1">/ month</span>
                  </div>
                  {totalAmount > 0 && (
                    <div className="mt-0.5 text-[10px] font-bold text-[#5D3FD3] bg-purple-50 px-2 py-0.5 rounded font-mono inline-block">
                      Billed annually ({effectiveSymbol}{totalAmount.toLocaleString()} / year)
                    </div>
                  )}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-900 uppercase font-mono tracking-wider mb-1">
                  Included Tenant Capabilities:
                </div>
                {selectedPlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-600 mt-0.5 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant automated slot creation upon order confirmation</span>
              </div>
            </div>

          </div>

          {/* Right Column (7 Cols): Payment Channels & WhatsApp Direct Order Form */}
          <div className="md:col-span-7 space-y-4">
            
            {/* 1. SELECT PROVISIONING PAYMENT CHANNEL Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  <Zap className="w-3 h-3" />
                  <span>SELECT PROVISIONING PAYMENT CHANNEL</span>
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Choose How You Want to Pay
                </h3>
              </div>

              {/* Payment Method Hierarchy Options */}
              <div className="grid grid-cols-1 gap-3">
                
                {/* 1ST METHOD: WHATSAPP DIRECT ORDER */}
                <div 
                  onClick={() => setActiveChannel('whatsapp')}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                    activeChannel === 'whatsapp'
                      ? 'border-[#25D366] bg-emerald-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0">
                        <WhatsAppIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">WhatsApp Direct Order</span>
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                            1ST CHOICE (ACTIVE)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Instant offline invoice generation & direct sales desk provisioning.
                        </p>
                      </div>
                    </div>
                    {activeChannel === 'whatsapp' && (
                      <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>

                {/* 2ND METHOD: RAZORPAY AUTOMATED CHECKOUT (COMING SOON) */}
                <div 
                  className="p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/70 opacity-80 relative cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs shrink-0">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Razorpay Secure Automated Checkout</span>
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> COMING SOON
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Automated online credit card & UPI gateway integration coming soon.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-800 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Please use WhatsApp Direct Order below for instant manual tenant activation & invoice delivery.</span>
              </div>

            </div>

            {/* 2. WhatsApp Direct Order Form (Directly below SELECT PROVISIONING PAYMENT CHANNEL) */}
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
  );
};
