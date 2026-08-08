import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://qglhbesenigpspgkgbac.supabase.co https://api.openai.com https://api.razorpay.com https://api.cloudinary.com https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://challenges.cloudflare.com; frame-src https://api.razorpay.com https://checkout.razorpay.com https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'"
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
    headers: securityHeaders
  },
  preview: {
    headers: securityHeaders
  }
});
