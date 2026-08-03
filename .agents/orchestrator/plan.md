# Execution Plan: SocialSpree SaaS Landing & Dual Payment Integration

## Overview
SocialSpree requires a high-converting, modern public SaaS landing page with seamless multi-page routing, plus dual subscription payment channels:
1. **Razorpay Sandbox Flow**: Simulated payment gateway modal for instant subscription purchasing & access provisioning.
2. **WhatsApp Offline Direct Payment**: Pre-filled cart order checkout link to `https://wa.me/919051822558` for manual admin fulfillment.

## Architecture Strategy
- **Public Navigation & Page Views**:
  - `LandingHeader` / `Navbar`: Public nav bar with Logo, Features, Pricing, Testimonials, About, Contact, "Launch App / Demo" button, and "Get Started" payment modal trigger.
  - `LandingHero`: Glassmorphic hero section with micro-animations, value proposition, live preview teaser, and primary CTA.
  - `FeaturesPage`: Interactive feature showcase (Multi-channel post composer, AI viral generator, Cloudinary CDN integration, live smartphone device preview, Super Admin multi-tenant API slot management).
  - `PricingPage`: Plan tiers (Starter, Pro Agency, Enterprise) with monthly/annual billing toggles, currency switcher (INR ₹, USD $, GBP £), and dual checkout triggers ("Pay with Razorpay (Sandbox)" & "Order via WhatsApp").
  - `TestimonialsPage`: Social proof, client success stories, agency reviews, and trust badges.
  - `AboutContactPage`: Company mission, feature highlights, contact form, and direct WhatsApp support link.
  - `AppDashboardView`: Seamless transition into the existing full SaaS application dashboard (`App.tsx` state toggle for Demo/Live app view).
- **Payment & Provisioning Engine**:
  - `PaymentModal`: Interactive checkout modal allowing plan selection, billing interval, regional currency selection, and dual channel action:
    - **Razorpay Sandbox Tab**: Simulated Razorpay gateway card UI (Card number, Expiry, CVV, OTP step, success animation), auto-provisioning simulated tenant subscription in local state / Supabase, and redirecting into active SaaS app workspace.
    - **WhatsApp Direct Tab**: Instant order summary formatting, pre-filled WhatsApp message URL generator targeting `wa.me/919051822558` with formatted plan name, price, currency, user email/org, and direct redirect button.

## Execution Milestones
1. **M1: Public Landing Page & Multi-Page Navigation**
   - Design public landing page & sub-views (`LandingHero`, `FeaturesView`, `PricingView`, `TestimonialsView`, `AboutContactView`, `PublicNavbar`, `PublicFooter`).
   - Seamless top-level routing between landing sub-pages and the main App Dashboard.
2. **M2: Razorpay Sandbox Integration & Provisioning**
   - Implement interactive Razorpay Sandbox payment gateway modal.
   - Simulate card payment processing, success confirmation, and instant tenant subscription status activation.
3. **M3: WhatsApp Direct Checkout Integration**
   - Implement pre-filled WhatsApp order link generator pointing to `wa.me/919051822558`.
   - Provide cart summary details, order breakdown, copyable text, and direct WhatsApp redirection button.

## Team Topology & Workflow
- **Explorer**: Inspect current `App.tsx` state management and design public landing component structure.
- **Worker**: Implement landing components, navigation state, Razorpay sandbox modal, and WhatsApp checkout module.
- **Reviewer**: Inspect UI aesthetics, responsiveness, routing integrity, and payment logic.
- **Challenger**: Run build/tests and stress-test payment flows (currencies, sandbox states, WhatsApp URL encodings).
- **Auditor**: Perform forensic audit for code integrity (no dummy hardcoding, authentic functionality).
