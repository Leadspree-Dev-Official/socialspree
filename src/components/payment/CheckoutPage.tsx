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

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (5 Cols): Account Verification & Plan Details Summary */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Account Authentication Requirement Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4 relative overflow-hidden">
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
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center gap-3">
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || 'User Avatar'} 
                    className="w-11 h-11 rounded-2xl object-cover border border-purple-200 shadow-sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{user.fullName || 'SocialSpree User'}</h4>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      {user.primaryEmailAddress?.emailAddress || 'User Email'}
                    </p>
                    <p className="text-[10px] text-purple-700 font-bold mt-1">
                      ⚡ Ready to receive instant API slot allocation
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <UserPlus className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Create an Account or Sign In Required</h4>
                      <p className="text-xs text-amber-800 leading-relaxed mt-1">
                        To provision your isolated multi-tenant workspace and issue API keys, please create a free account or sign in first.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <SignUpButton mode="modal">
                      <button className="w-full py-2.5 px-4 rounded-xl bg-[#5D3FD3] hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Account</span>
                      </button>
                    </SignUpButton>

                    <SignInButton mode="modal">
                      <button className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Sign In</span>
                      </button>
                    </SignInButton>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Selected Plan Order Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-[#5D3FD3] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Selected Plan
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {selectedPlan.name}
                  </h2>
                </div>
                  <div className="text-[#5D3FD3] text-3xl font-black">
                    {effectiveSymbol}{totalAmount.toLocaleString()}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                    / year
                  </span>
                  {selectedPlan.priceMonthly > 0 && (
                    <div className="mt-1 text-[10px] font-bold text-[#5D3FD3] bg-purple-50 px-2 py-0.5 rounded font-mono">
                      (equivalent to {effectiveSymbol}{displayMonthly.toLocaleString()}/mo)
                    </div>
                  )}
                </div>
              </div>

              {/* Allocation Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">API Slots</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {selectedPlan.allocatedApiSlots} {selectedPlan.allocatedApiSlots === 1 ? 'Slot' : 'Slots'} ({selectedPlan.maxSocialAccounts} Channels)
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <div className="text-[11px] text-purple-700 font-medium">Monthly AI Ledger</div>
                  <div className="text-sm font-bold text-purple-900 font-mono mt-0.5">
                    {selectedPlan.aiCredits.toLocaleString()} Credits/mo
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
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

              {/* SLA Guarantee */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant automated slot creation upon order confirmation</span>
              </div>

            </div>

          </div>

          {/* Right Column (7 Cols): Payment Methods Hierarchy */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Payment Method Selector Tabs */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
              
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                  <Zap className="w-3.5 h-3.5" />
                  <span>SELECT PROVISIONING PAYMENT CHANNEL</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Choose How You Want to Pay
                </h3>
              </div>

              {/* Payment Method Hierarchy Options */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* 1ST METHOD: WHATSAPP DIRECT ORDER (ACTIVE & DEFAULT) */}
                <div 
                  onClick={() => setActiveChannel('whatsapp')}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    activeChannel === 'whatsapp'
                      ? 'border-[#25D366] bg-emerald-50/30 shadow-md'
                      : 'border-slate-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md">
                        <WhatsAppIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">WhatsApp Direct Order</span>
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase font-mono">
                            1ST CHOICE (ACTIVE)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          Instant offline invoice generation & direct sales desk provisioning.
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      activeChannel === 'whatsapp' ? 'border-[#25D366] bg-[#25D366]' : 'border-slate-300'
                    }`}>
                      {activeChannel === 'whatsapp' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                </div>

                {/* 2ND METHOD: RAZORPAY SECURE CHECKOUT (COMING SOON BADGE) */}
                <div 
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 opacity-90 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">Razorpay Secure Automated Checkout</span>
                          {/* BRIGHT COMING SOON BADGE */}
                          <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-purple-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono shadow-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> COMING SOON
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Automated online credit card & UPI gateway integration is in sandbox testing and coming soon.
                        </p>
                      </div>
                    </div>

                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px] text-amber-800 font-medium flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Please use WhatsApp Direct Order above for instant manual tenant activation & invoice delivery.</span>
                  </div>
                </div>

              </div>

              {/* Active Channel Component Display */}
              <div className="pt-4 border-t border-slate-100">
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
