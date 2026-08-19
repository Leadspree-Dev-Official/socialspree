import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';
import { SubscriptionPlan } from '../../types';
import { Copy, ExternalLink, Check } from 'lucide-react';

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface WhatsAppCheckoutProps {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  onClose: () => void;
}

export const WhatsAppCheckout: React.FC<WhatsAppCheckoutProps> = ({
  plan,
  billingCycle,
}) => {
  const { user, isSignedIn } = useUser();
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentChannel] = useState('Bank Wire / UPI Direct');
  const [copied, setCopied] = useState(false);

  // Auto-fill details ONLY if user is signed in
  useEffect(() => {
    if (isSignedIn && user) {
      setOrgName(user.fullName ? `${user.fullName}'s Organization` : '');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
    } else {
      setOrgName('');
      setEmail('');
    }
  }, [isSignedIn, user]);

  // Compute amounts based on selected billing cycle
  const baseMonthly = plan.priceMonthly ?? 49;
  const isYearly = billingCycle === 'yearly';
  const totalAmount = isYearly ? (plan.priceYearly ?? (baseMonthly * 12)) : baseMonthly;
  const cycleLabel = isYearly ? 'Billed Annually (Yearly Payment)' : 'Billed Monthly (Monthly Payment)';
  const amountLabel = isYearly 
    ? `${plan.currencySymbol}${totalAmount.toLocaleString()} / year`
    : `${plan.currencySymbol}${totalAmount.toLocaleString()} / month`;

  const sanitizeWhatsAppText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\*/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const sanitizedOrgName = sanitizeWhatsAppText(orgName);
  const sanitizedEmail = sanitizeWhatsAppText(email);

  const formattedText = `🛒 *SOCIALSPREE SAAS ORDER INVOICE*
----------------------------------
📋 *Plan:* ${plan.name}
💳 *Billing Cycle:* ${cycleLabel}
💰 *Amount Due:* ${amountLabel}
🏢 *Organization:* ${sanitizedOrgName || 'N/A'}
📧 *Email:* ${sanitizedEmail || 'N/A'}
💳 *Payment Method:* ${paymentChannel}
----------------------------------
Please confirm offline payment instructions & instant key provisioning for our workspace.`;

  const whatsappUrl = `https://wa.me/919051822558?text=${encodeURIComponent(formattedText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="font-['Inter'] text-slate-900 space-y-3">
      
      {/* Customer Info Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Organization Name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Your Organization Name"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#25D366] focus:outline-none bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#25D366] focus:outline-none bg-slate-50/50"
          />
        </div>
      </div>

      {/* Invoice Breakdown Preview Card */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-slate-500">
          <span>Formatted Invoice Preview</span>
          <button
            onClick={handleCopy}
            className="text-[#25D366] hover:underline flex items-center gap-1 font-bold text-[10px] cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10.5px] leading-snug whitespace-pre-wrap border border-slate-800 shadow-inner">
          {formattedText}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex flex-row items-center gap-2">
        <button
          onClick={handleCopy}
          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 no-underline"
        >
          <WhatsAppIcon className="w-4 h-4 text-white" />
          <span>Launch WhatsApp Direct Order</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

    </div>
  );
};
