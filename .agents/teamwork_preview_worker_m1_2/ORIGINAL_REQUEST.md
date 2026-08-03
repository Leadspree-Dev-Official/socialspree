## 2026-07-29T12:38:30Z
You are Worker 2 working on SocialSpree SaaS (Defect Remediation for M1, M2, M3).
Working directory: /Users/aniruddhadas/Ani/Coding Projects/Google Antigravity/Development Products/SaaS/SocialSpree/.agents/teamwork_preview_worker_m1_2

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please read the defect findings in:
- `/Users/aniruddhadas/Ani/Coding Projects/Google Antigravity/Development Products/SaaS/SocialSpree/.agents/teamwork_preview_challenger_m1_1/handoff.md`
- `/Users/aniruddhadas/Ani/Coding Projects/Google Antigravity/Development Products/SaaS/SocialSpree/.agents/teamwork_preview_reviewer_m1_2/handoff.md`

Tasks:
1. Fix Pricing Savings Mismatch in `src/components/public/PricingView.tsx`:
   Calculate `savings` as `(baseMonthlyPrice - discountedMonthly) * 12` so the displayed annual savings badge matches the exact financial savings vs standard monthly billing.

2. Fix Multi-Currency Conversion Matrix in `src/components/public/PricingView.tsx`:
   Ensure seamless conversion for all base plan currencies (`USD`, `INR`, `GBP`) when switching currencies on the pricing matrix:
   - Starter ($19/mo base): $19 USD | ₹1,499 INR | £15 GBP
   - Pro (₹1,499/mo base): ₹1,499 INR | $29 USD | £24 GBP
   - Enterprise (£119/mo base): £119 GBP | $149 USD | ₹11,999 INR

3. Fix Currency Selection Retention in `src/App.tsx` & `src/components/payment/CheckoutModal.tsx`:
   - Update `handleOpenCheckout(planId, billingCycle, selectedCurrency)` in `App.tsx` to accept `selectedCurrency?: CurrencyCode` and `currencySymbol?: string`.
   - Pass the selected currency override down into `CheckoutModal`, `RazorpaySandbox`, and `WhatsAppCheckout` so prices render in the user's chosen currency (e.g. ₹1,499 in Checkout Modal when INR is selected).
   - Record `currency` and `currencySymbol` on the newly provisioned `Tenant` object in `handleSuccessfulPayment`.

4. Fix WhatsApp Markdown & Linebreak Sanitization in `src/components/payment/WhatsAppCheckout.tsx`:
   Sanitize `orgName` (strip/replace `*` and collapse multiline newlines `\n`) before interpolating into `formattedText` so WhatsApp bold formatting is never corrupted.

5. Fix API Slot Array Dynamic Provisioning in `src/App.tsx`:
   In `handleSuccessfulPayment`, populate `apiSlotDetails` array dynamically with `allocatedApiSlots` count (e.g. Array of 1 slot for Starter, 3 slots for Pro, 10 slots for Enterprise), each with unique ID (`slot-${Date.now()}-${i+1}`), `slotNumber: i+1`, `slotName: 'API Slot ${i+1}'`, and key.

6. Fix Yearly Renewal Date Calculation in `src/App.tsx`:
   Calculate `renewalDays = tenantData.billingCycle === 'yearly' ? 365 : 30` in `handleSuccessfulPayment` so annual plan subscriptions get a 1-year renewal date (`renewalDate: new Date(Date.now() + renewalDays * 86400000).toISOString().split('T')[0]`).

7. Fix Razorpay Sandbox Unmounted Timer Leak in `src/components/payment/RazorpaySandbox.tsx`:
   Store timer references using `useRef` or cleanup in `useEffect` so clicking Cancel or unmounting the modal clears all pending `setTimeout` timers without setting state on unmounted component or calling `onSuccess`.

8. Run `npm run build` using terminal / run_command to verify 100% build pass.

9. Document your changes in `/Users/aniruddhadas/Ani/Coding Projects/Google Antigravity/Development Products/SaaS/SocialSpree/.agents/teamwork_preview_worker_m1_2/handoff.md` and send message to parent (`3062ca88-40a7-4a45-a481-64bad3a9d766`).
