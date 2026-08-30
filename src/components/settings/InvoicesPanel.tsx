import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Receipt, RefreshCw, Printer, AlertCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  plan_name: string;
  billing_cycle: string;
  amount_minor: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  bill_to_name: string | null;
  bill_to_email: string | null;
  supplier_name: string | null;
  supplier_gst: string | null;
  issued_at: string;
}

const money = (minor: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency })
      .format((minor || 0) / 100);
  } catch {
    return `${currency} ${((minor || 0) / 100).toFixed(2)}`;
  }
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });

/**
 * Invoices a customer can hand to their own accounts team.
 *
 * Rows are read-only snapshots taken when payment settled, so renaming a plan
 * or changing its price later never rewrites history.
 */
export const InvoicesPanel: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from('invoices')
      .select('*')
      .order('issued_at', { ascending: false })
      .limit(100);

    if (dbError) {
      setError('Could not load your invoices. Please try again in a moment.');
    } else {
      setInvoices(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
            <span>Invoices</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Issued automatically when a payment settles, whether paid by card or by transfer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { void load(); }}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {invoices.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D3FD3]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {!loading && invoices.length === 0 && !error && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm font-bold text-slate-900 dark:text-white">No invoices yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your first invoice appears here once a payment settles.
          </p>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                <th className="text-left font-mono font-bold uppercase tracking-wide px-4 py-3">Invoice</th>
                <th className="text-left font-mono font-bold uppercase tracking-wide px-4 py-3">Plan</th>
                <th className="text-left font-mono font-bold uppercase tracking-wide px-4 py-3">Issued</th>
                <th className="text-left font-mono font-bold uppercase tracking-wide px-4 py-3">Paid via</th>
                <th className="text-right font-mono font-bold uppercase tracking-wide px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{inv.invoice_number}</div>
                    {inv.supplier_gst && (
                      <div className="text-[10px] text-slate-400 mt-0.5">GST {inv.supplier_gst}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {inv.plan_name}
                    <span className="text-slate-400"> · {inv.billing_cycle}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{day(inv.issued_at)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {inv.payment_method === 'manual' ? 'Bank / UPI' : 'Card'}
                    {inv.payment_reference && (
                      <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                        {inv.payment_reference}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    {money(inv.amount_minor, inv.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoices.some(i => !i.supplier_gst) && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          Some invoices carry no GST number. Set it in Super Admin → Settings so future invoices are compliant.
        </p>
      )}
    </div>
  );
};
