import React, { useState } from 'react';
import { SubscriptionPlan } from '../../types';
import { MessageSquare, Copy, ExternalLink, Check, FileText } from 'lucide-react';

interface WhatsAppCheckoutProps {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  onClose: () => void;
}

export const WhatsAppCheckout: React.FC<WhatsAppCheckoutProps> = ({
  plan,
  billingCycle,
  onClose,
}) => {
  const [orgName, setOrgName] = useState('Apex Growth Media');
  const [email, setEmail] = useState('alex@apexgrowth.com');
  const [paymentChannel, setPaymentChannel] = useState('Bank Wire / UPI Direct');
  const [copied, setCopied] = useState(false);

  // Compute final amounts
  const baseMonthly = plan.priceMonthly;
  const finalMonthly = billingCycle === 'yearly' ? Math.round(baseMonthly * 0.8) : baseMonthly;
  const totalAmount = billingCycle === 'yearly' ? finalMonthly * 12 : finalMonthly;

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
💳 *Billing Cycle:* ${billingCycle === 'yearly' ? 'Yearly (20% OFF)' : 'Monthly'}
💰 *Amount Due:* ${plan.currencySymbol}${totalAmount.toLocaleString()} / ${billingCycle === 'yearly' ? 'year' : 'month'}
🔑 *API Key Slots:* ${plan.allocatedApiSlots} Slots (${plan.maxSocialAccounts} Social Channels)
🤖 *Monthly AI Credits:* ${plan.aiCredits.toLocaleString()} Credits
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
    <div className="font-['Inter'] text-slate-900 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md">
            <MessageSquare className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">WhatsApp Direct Offline Order</h3>
            <p className="text-xs text-slate-500 font-medium">Pre-filled invoice message for wa.me/919051822558</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
          Direct Sales Desk
        </span>
      </div>

      {/* Customer Info Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Apex Growth Media"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#25D366] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Owner Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@apexgrowth.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#25D366] focus:outline-none"
          />
        </div>
      </div>

      {/* Invoice Breakdown Preview Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-500">
          <span>Formatted Invoice Preview</span>
          <button
            onClick={handleCopy}
            className="text-[#25D366] hover:underline flex items-center gap-1 font-bold text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw Text'}</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner">
          {formattedText}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleCopy}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          <span>{copied ? 'Copied!' : 'Copy Order Text'}</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4 fill-white" />
          <span>Launch WhatsApp Direct Order (wa.me/919051822558)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </div>
  );
};
