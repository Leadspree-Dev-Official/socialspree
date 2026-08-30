import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CreditCard, CheckCircle2, RefreshCw, XCircle, AlertCircle } from 'lucide-react';

interface PendingOrder {
  id: string;
  reference: string | null;
  amount_minor: number;
  currency: string;
  billing_cycle: string;
  created_at: string;
  plan_id: string;
  plans?: { name?: string; tier_code?: string } | null;
  tenants?: { name?: string; owner_email?: string } | null;
}

const formatAmount = (minor: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 })
    .format((minor || 0) / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Operator queue for payments taken outside Razorpay.
 *
 * Approving here calls the same entitlement grant as the payment webhook, so a
 * manually settled order provisions the tenant through exactly the path an
 * automated payment will use once Razorpay activation clears.
 */
export const PendingPaymentsQueue: React.FC = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refs, setRefs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('manual-checkout', {
        body: { action: 'pending' }
      });
      if (fnError || data?.error) throw new Error(data?.error || fnError?.message);
      setOrders(data?.orders ?? []);
    } catch (err: any) {
      setError(err?.message || 'Could not load pending payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const approve = async (order: PendingOrder) => {
    const manualReference = (refs[order.id] || '').trim();
    if (!manualReference) {
      setError('Enter the bank or UPI transaction reference before approving.');
      return;
    }

    setBusyId(order.id);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('manual-checkout', {
        body: { action: 'approve', orderId: order.id, manualReference }
      });
      if (fnError || data?.error) throw new Error(data?.error || fnError?.message);

      setNotice(`${order.reference ?? 'Order'} approved — workspace upgraded to ${order.plans?.name ?? order.plan_id}.`);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setTimeout(() => setNotice(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Approval failed.');
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (order: PendingOrder) => {
    setBusyId(order.id);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('manual-checkout', {
        body: { action: 'cancel', orderId: order.id }
      });
      if (fnError || data?.error) throw new Error(data?.error || fnError?.message);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setNotice(`${order.reference ?? 'Order'} cancelled.`);
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Could not cancel that order.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
            <span>Pending Payments</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Orders awaiting a bank transfer or UPI payment. Approving one upgrades the workspace immediately and records who approved it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void load(); }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading…' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {!loading && orders.length === 0 && !error && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">Nothing awaiting payment</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            New WhatsApp orders appear here as soon as a customer starts one.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => (
          <div
            key={order.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {order.reference ?? order.id.slice(0, 8)}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {order.plans?.name ?? order.plan_id}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {order.billing_cycle}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {order.tenants?.name ?? 'Unnamed workspace'}
                  {order.tenants?.owner_email ? ` · ${order.tenants.owner_email}` : ''}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Created {formatDate(order.created_at)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {formatAmount(order.amount_minor, order.currency)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={refs[order.id] || ''}
                onChange={e => setRefs(prev => ({ ...prev, [order.id]: e.target.value }))}
                placeholder="Bank / UPI transaction reference"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { void approve(order); }}
                disabled={busyId === order.id}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{busyId === order.id ? 'Approving…' : 'Mark paid & provision'}</span>
              </button>
              <button
                type="button"
                onClick={() => { void cancel(order); }}
                disabled={busyId === order.id}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 text-xs font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
