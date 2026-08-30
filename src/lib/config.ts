/**
 * Contact and billing details that appear in customer-facing copy.
 *
 * These were previously hardcoded across several components, including a public
 * testimonial, so changing the sales number meant hunting through JSX. Override
 * any of them at build time without touching code.
 */
const env = (import.meta as any).env || {};

/** Digits only, including country code — this is what wa.me expects. */
export const SUPPORT_WHATSAPP_NUMBER: string =
  env.VITE_SUPPORT_WHATSAPP || '919051822558';

/** Human-readable form for display next to the WhatsApp link. */
export const SUPPORT_WHATSAPP_DISPLAY: string =
  env.VITE_SUPPORT_WHATSAPP_DISPLAY || '+91 90518 22558';

export const SUPPORT_EMAIL: string =
  env.VITE_SUPPORT_EMAIL || 'leadspree24x7@gmail.com';

/** Legal entity shown on invoices and receipts. */
export const BILLING_ENTITY_NAME: string =
  env.VITE_BILLING_ENTITY_NAME || 'SocialSpree';

/** Required on Indian B2B invoices. Empty until the operator supplies it. */
export const BILLING_GST_NUMBER: string =
  env.VITE_BILLING_GST_NUMBER || '';
