// empirical_test.js - Empirical Challenge Test Suite for SocialSpree SaaS

// Setup mock localStorage for Node.js environment
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

console.log('=== STARTING EMPIRICAL TEST SUITE ===\n');

// -------------------------------------------------------------
// TEST 1: Pricing Calculation & Multi-Currency Switcher Analysis
// -------------------------------------------------------------
console.log('--- TEST 1: Pricing Calculations & Multi-Currency Switcher ---');

const INITIAL_PLANS = [
  {
    id: 'plan-starter',
    name: 'Starter Plan (US/Global)',
    priceMonthly: 19,
    currency: 'USD',
    currencySymbol: '$',
    allocatedApiSlots: 1,
    maxSocialAccounts: 2,
    aiCredits: 500,
  },
  {
    id: 'plan-pro',
    name: 'Pro Agency Plan (India Region)',
    priceMonthly: 1499,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 3,
    maxSocialAccounts: 6,
    aiCredits: 2500,
    isPopular: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Agency Tier (UK/EU)',
    priceMonthly: 119,
    currency: 'GBP',
    currencySymbol: '£',
    allocatedApiSlots: 10,
    maxSocialAccounts: 20,
    aiCredits: 10000,
  }
];

function getCalculatedPrice(plan, selectedCurrency, billingCycle) {
  let baseMonthlyPrice = plan.priceMonthly;

  // Standardize price across currency switch if plan base currency differs
  if (plan.currency !== selectedCurrency) {
    if (selectedCurrency === 'USD') {
      baseMonthlyPrice = plan.currency === 'INR' ? 19 : 149;
    } else if (selectedCurrency === 'INR') {
      baseMonthlyPrice = plan.currency === 'USD' ? 1499 : 9999;
    } else if (selectedCurrency === 'GBP') {
      baseMonthlyPrice = plan.currency === 'USD' ? 15 : 119;
    }
  }

  if (billingCycle === 'yearly') {
    const discountedMonthly = Math.round(baseMonthlyPrice * 0.8);
    return {
      monthlyFormatted: discountedMonthly,
      totalYearly: discountedMonthly * 12,
      savings: Math.round(baseMonthlyPrice * 12 * 0.2)
    };
  }

  return {
    monthlyFormatted: baseMonthlyPrice,
    totalYearly: baseMonthlyPrice * 12,
    savings: 0
  };
}

let pricingFailures = [];

['monthly', 'yearly'].forEach(cycle => {
  ['USD', 'INR', 'GBP'].forEach(curr => {
    INITIAL_PLANS.forEach(plan => {
      const calc = getCalculatedPrice(plan, curr, cycle);
      console.log(`[Plan: ${plan.id}] Cycle: ${cycle.padEnd(7)} Curr: ${curr} -> Monthly: ${calc.monthlyFormatted}, TotalYearly: ${calc.totalYearly}, Savings: ${calc.savings}`);
      
      // Check 1: Savings calculation discrepancy
      if (cycle === 'yearly') {
        const effectiveBase = plan.currency !== curr ? (curr === 'USD' ? (plan.currency === 'INR' ? 19 : 149) : curr === 'INR' ? (plan.currency === 'USD' ? 1499 : 9999) : (plan.currency === 'USD' ? 15 : 119)) : plan.priceMonthly;
        const fullYearlyPrice = effectiveBase * 12;
        const actualSavings = fullYearlyPrice - calc.totalYearly;
        if (calc.savings !== actualSavings) {
          pricingFailures.push({
            issue: 'Savings Calculation Discrepancy (Roundoff Flaw)',
            plan: plan.id,
            currency: curr,
            cycle,
            baseMonthlyPrice: effectiveBase,
            discountedMonthly: calc.monthlyFormatted,
            totalYearlyBilled: calc.totalYearly,
            claimedSavings: calc.savings,
            actualSavings: actualSavings,
            diff: Math.abs(calc.savings - actualSavings)
          });
        }
      }

      // Check 2: Currency Conversion Hardcoding Flaws
      if (plan.currency === 'GBP' && curr === 'USD') {
        // plan.currency is GBP, selected is USD. Logic: plan.currency === 'INR' ? 19 : 149 -> 149 USD.
        // Enterprise plan (119 GBP) maps to 149 USD, while Starter USD is 19 USD.
        pricingFailures.push({
          issue: 'Hardcoded Currency Switch Logic Bug',
          plan: plan.id,
          planBaseCurrency: plan.currency,
          selectedCurrency: curr,
          basePrice: plan.priceMonthly,
          calculatedBasePrice: 149,
          explanation: 'GBP base currency plan fallback evaluates plan.currency === INR (false) and sets USD price to 149 USD regardless of actual base plan value.'
        });
      }

      if (plan.currency === 'GBP' && curr === 'INR') {
        pricingFailures.push({
          issue: 'Hardcoded Currency Switch Logic Bug',
          plan: plan.id,
          planBaseCurrency: plan.currency,
          selectedCurrency: curr,
          basePrice: plan.priceMonthly,
          calculatedBasePrice: 9999,
          explanation: 'GBP base currency plan fallback evaluates plan.currency === USD (false) and sets INR price to 9999 INR.'
        });
      }

      if (plan.currency === 'INR' && curr === 'GBP') {
        pricingFailures.push({
          issue: 'Hardcoded Currency Switch Logic Bug',
          plan: plan.id,
          planBaseCurrency: plan.currency,
          selectedCurrency: curr,
          basePrice: plan.priceMonthly,
          calculatedBasePrice: 119,
          explanation: 'INR base currency plan fallback evaluates plan.currency === USD (false) and sets GBP price to 119 GBP (maps Pro INR 1499 to 119 GBP instead of ~15 GBP).'
        });
      }
    });
  });
});

console.log('\n[Pricing Failure Report Summary]: Found', pricingFailures.length, 'discrepancy patterns.');
console.log(JSON.stringify(pricingFailures, null, 2));

// -------------------------------------------------------------
// TEST 2: WhatsApp URI Encoding & Invoice Generation Edge Cases
// -------------------------------------------------------------
console.log('\n--- TEST 2: WhatsApp URI Encoding & Invoice Generation ---');

function generateWhatsAppUrl(plan, billingCycle, orgName, email, paymentChannel) {
  const baseMonthly = plan.priceMonthly;
  const finalMonthly = billingCycle === 'yearly' ? Math.round(baseMonthly * 0.8) : baseMonthly;
  const totalAmount = billingCycle === 'yearly' ? finalMonthly * 12 : finalMonthly;

  const formattedText = `🛒 *SOCIALSPREE SAAS ORDER INVOICE*
----------------------------------
📋 *Plan:* ${plan.name}
💳 *Billing Cycle:* ${billingCycle === 'yearly' ? 'Yearly (20% OFF)' : 'Monthly'}
💰 *Amount Due:* ${plan.currencySymbol}${totalAmount.toLocaleString()} / ${billingCycle === 'yearly' ? 'year' : 'month'}
🔑 *API Key Slots:* ${plan.allocatedApiSlots} Slots (${plan.maxSocialAccounts} Social Channels)
🤖 *Monthly AI Credits:* ${plan.aiCredits.toLocaleString()} Credits
🏢 *Organization:* ${orgName || 'N/A'}
📧 *Email:* ${email || 'N/A'}
💳 *Payment Method:* ${paymentChannel}
----------------------------------
Please confirm offline payment instructions & instant key provisioning for our workspace.`;

  const whatsappUrl = `https://wa.me/919051822558?text=${encodeURIComponent(formattedText)}`;
  return { formattedText, whatsappUrl };
}

const whatsappEdgeCases = [
  {
    name: 'Special Characters & Symbols (&, #, ?, =, %, +, @, ", <, >)',
    orgName: 'M&M Co. & Sons <Rock & Roll> #1 "Top" Agency',
    email: 'user+test@domain.co.uk',
    paymentChannel: 'UPI & NetBanking / Cash'
  },
  {
    name: 'Line Breaks & Multiline Input (\n, \r\n)',
    orgName: 'Line1\nLine2\r\nLine3',
    email: 'test\n@domain.com',
    paymentChannel: 'Wire\nTransfer'
  },
  {
    name: 'WhatsApp Markdown Formatting Injection (*, _, ~)',
    orgName: 'Star * Agency * Bold _Italic_ ~Strikethrough~',
    email: 'alex@star.com',
    paymentChannel: 'Card'
  },
  {
    name: 'Unicode & Currency Symbols & Emojis',
    orgName: 'Global Agency 🚀 🇮🇳 £ € ₹ $ 🔥',
    email: 'global@agency.org',
    paymentChannel: 'Crypto 💎'
  },
  {
    name: 'Ultra Long String (500 chars)',
    orgName: 'A'.repeat(500),
    email: 'a'.repeat(200) + '@example.com',
    paymentChannel: 'Bank'
  }
];

let whatsappFailures = [];

whatsappEdgeCases.forEach((tc, idx) => {
  const res = generateWhatsAppUrl(INITIAL_PLANS[0], 'yearly', tc.orgName, tc.email, tc.paymentChannel);
  console.log(`\nCase ${idx + 1}: ${tc.name}`);
  console.log('URL length:', res.whatsappUrl.length);

  // Check URL decoding roundtrip
  const textQuery = res.whatsappUrl.split('?text=')[1];
  const decodedText = decodeURIComponent(textQuery);
  const isMatch = decodedText === res.formattedText;
  console.log('Roundtrip URI Decoding Match?:', isMatch);
  
  if (!isMatch) {
    whatsappFailures.push({
      case: tc.name,
      issue: 'URL Parameter Roundtrip Mismatch',
      expected: res.formattedText,
      got: decodedText
    });
  }

  // Check Markdown / Linebreak injection risks
  if (tc.orgName.includes('*') || tc.orgName.includes('\n')) {
    whatsappFailures.push({
      case: tc.name,
      issue: 'Unsanitized Field Injection into WhatsApp Markdown Template',
      orgName: tc.orgName,
      impact: 'Unsanitized user input containing markdown asterisks or line breaks breaks WhatsApp template rendering structure.'
    });
  }
});

console.log('\n[WhatsApp Failure Report Summary]: Found', whatsappFailures.length, 'injection/formatting vulnerabilities.');
console.log(JSON.stringify(whatsappFailures, null, 2));

// -------------------------------------------------------------
// TEST 3: State Persistence & handleSuccessfulPayment Stress Test
// -------------------------------------------------------------
console.log('\n--- TEST 3: handleSuccessfulPayment State Persistence ---');

const GLOBAL_DEFAULT_CLOUDFLARE = {
  publicDomain: 'https://pub-4921029102.r2.dev',
  bucketName: 'socialspree-media-vault',
  useSystemDefault: true,
};

const GLOBAL_DEFAULT_CLOUDINARY = {
  cloudName: 'djmww1dwr',
  uploadPreset: 'ml_default',
  bucketName: 'socialspree-media-vault',
  useSuperAdminDefault: true,
  selectedDefaultAccountId: 'cld-master-01',
  accounts: []
};

function simulateHandleSuccessfulPayment(tenantData, existingTenants) {
  const newTenant = {
    id: `tenant-${Date.now()}`,
    name: tenantData.name,
    ownerEmail: tenantData.ownerEmail,
    apiKey: `key_live_${Math.random().toString(36).substring(2, 9)}`,
    tierPlan: tenantData.tierPlan,
    planId: tenantData.planId,
    allocatedApiSlots: tenantData.allocatedApiSlots,
    maxSocialAccounts: tenantData.maxSocialAccounts,
    aiCredits: tenantData.aiCredits,
    apiSlotDetails: [
      { 
        id: `slot-${Date.now()}-1`, 
        slotNumber: 1, 
        slotName: 'API Slot 1', 
        apiKey: `zern_live_${Math.random().toString(36).substring(2, 8)}`, 
        maxChannels: 2, 
        connectedAccountIds: [] 
      }
    ],
    cloudflareConfig: { ...GLOBAL_DEFAULT_CLOUDFLARE },
    cloudinaryConfig: { ...GLOBAL_DEFAULT_CLOUDINARY },
    status: 'active',
    paymentStatus: 'paid',
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billingCycle: tenantData.billingCycle,
    createdAt: new Date().toISOString()
  };

  const updated = [newTenant, ...existingTenants];
  localStorage.setItem('socialspree_tenants_v1', JSON.stringify(updated));
  return { newTenant, updated };
}

let persistenceFailures = [];

INITIAL_PLANS.forEach(plan => {
  ['monthly', 'yearly'].forEach(cycle => {
    const tenantData = {
      name: `Test Organization for ${plan.name}`,
      ownerEmail: `owner_${plan.id}@test.com`,
      tierPlan: plan.name,
      planId: plan.id,
      allocatedApiSlots: plan.allocatedApiSlots,
      maxSocialAccounts: plan.maxSocialAccounts,
      aiCredits: plan.aiCredits,
      billingCycle: cycle
    };

    const res = simulateHandleSuccessfulPayment(tenantData, []);
    const created = res.newTenant;

    // Defect 1: API Slot Array Under-provisioning Bug
    if (created.allocatedApiSlots !== created.apiSlotDetails.length) {
      persistenceFailures.push({
        issue: 'API Slot Array Under-provisioning Defect',
        plan: plan.id,
        planName: plan.name,
        allocatedApiSlots: created.allocatedApiSlots,
        actualApiSlotDetailsLength: created.apiSlotDetails.length,
        description: `Plan '${plan.name}' specifies ${created.allocatedApiSlots} API slots, but handleSuccessfulPayment initializes apiSlotDetails with only ${created.apiSlotDetails.length} slot!`
      });
    }

    // Defect 2: Renewal Date Calculation for Annual Subscriptions
    const now = new Date();
    const renewal = new Date(created.renewalDate);
    const diffDays = Math.round((renewal - now) / (1000 * 60 * 60 * 24));
    
    if (cycle === 'yearly' && diffDays < 300) {
      persistenceFailures.push({
        issue: 'Yearly Subscription Renewal Date Defect',
        plan: plan.id,
        billingCycle: cycle,
        renewalDate: created.renewalDate,
        actualDaysGranted: diffDays,
        expectedDaysGranted: 365,
        description: `Yearly subscription tenant renewal date was hardcoded to 30 days (${created.renewalDate}) instead of 365 days!`
      });
    }

    // Defect 3: LocalStorage serialization check
    const storedRaw = localStorage.getItem('socialspree_tenants_v1');
    const parsed = JSON.parse(storedRaw);
    if (!parsed || parsed[0].id !== created.id) {
      persistenceFailures.push({
        issue: 'LocalStorage Persistence Failure',
        plan: plan.id,
        expectedId: created.id
      });
    }

    // Check default CDN configs
    if (!created.cloudflareConfig || !created.cloudinaryConfig || !created.cloudinaryConfig.cloudName) {
      persistenceFailures.push({
        issue: 'Missing Default CDN Configurations',
        plan: plan.id
      });
    }
  });
});

console.log('\n[Persistence Failure Report Summary]: Found', persistenceFailures.length, 'state & provisioning defects.');
console.log(JSON.stringify(persistenceFailures, null, 2));

console.log('\n=== EMPIRICAL TEST SUITE COMPLETED ===');
