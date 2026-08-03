# Project: SocialSpree SaaS Landing Page & Dual Payment Engine

## Architecture
- **Tech Stack:** React 19 + Vite + TypeScript + Tailwind CSS v4 + Lucide Icons + Supabase JS Client
- **Public Layer:** Multi-page marketing landing system (Landing, Features, Pricing, Testimonials, About/Contact) integrated into Vite React app with smooth navigation and app dashboard entry.
- **Payment & Provisioning Engine:** Dual checkout options:
  1. **Razorpay Sandbox Payment**: Simulated card checkout with success provisioning callback.
  2. **WhatsApp Direct Payment**: Formatted `wa.me/919051822558` pre-filled order breakdown message.

## Code Layout
- `src/components/public/`
  - `PublicNavbar.tsx` — Sticky glassmorphic navbar with active page switching & Launch App trigger.
  - `LandingHero.tsx` — Hero section with micro-animations, value proposition, and CTA buttons.
  - `FeaturesView.tsx` — Detailed interactive features page.
  - `PricingView.tsx` — Interactive pricing plans with monthly/annual billing, currency switcher, and checkout triggers.
  - `TestimonialsView.tsx` — Social proof, customer reviews, rating cards, trust badges.
  - `AboutContactView.tsx` — About SocialSpree, core values, contact form, and direct WhatsApp contact.
  - `PublicFooter.tsx` — Marketing footer with links, brand identity, and social icons.
- `src/components/payment/`
  - `CheckoutModal.tsx` — Dual-mode payment modal (Razorpay Sandbox vs WhatsApp Checkout).
  - `RazorpaySandbox.tsx` — Interactive simulated Razorpay payment gateway screen.
  - `WhatsAppCheckout.tsx` — Order breakdown summary and `wa.me/919051822558` link launcher.
- `src/App.tsx` — Main application controller integrating Public Landing navigation mode and SaaS Dashboard mode.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Public SaaS Landing Page & Navigation | Build `src/components/public/` components and integrate public routing layer into `App.tsx` | none | IN_PROGRESS |
| 2 | Razorpay Sandbox Payment & Instant Provisioning | Build `src/components/payment/RazorpaySandbox.tsx` and integrate subscription activation | M1 | PLANNED |
| 3 | WhatsApp Offline Checkout & Order Formatting | Build `src/components/payment/WhatsAppCheckout.tsx` with pre-filled `wa.me/919051822558` integration | M1 | PLANNED |

## Interface Contracts
### Public Navigation Controller ↔ SaaS App Engine
- State: `currentView` (`'landing' | 'features' | 'pricing' | 'testimonials' | 'about' | 'app'`)
- Action: `onNavigate(view: string)`, `onOpenCheckout(planId?: string)`
- Payment Modal State: `checkoutOpen: boolean`, `selectedPlan: Plan`, `paymentChannel: 'razorpay' | 'whatsapp'`
