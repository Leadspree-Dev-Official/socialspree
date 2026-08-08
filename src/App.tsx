import React, { useState, useEffect } from 'react';
import { useUser, useClerk, useSession } from '@clerk/react';
import { Tenant, SocialAccount, Post, PostLog, GoogleReview, CloudinaryConfig, ApiAllocationSlot, AiCreditLog, SubscriptionPlan, CurrencyCode, MediaAsset, AgencyBrand } from './types';
import { 
  INITIAL_TENANTS, 
  INITIAL_POST_LOGS, 
  INITIAL_REVIEWS, 
  SUPER_ADMIN_EMAIL,
  GLOBAL_DEFAULT_CLOUDINARY,
  GLOBAL_SYSTEM_SETTINGS,
  getStoredTenants,
  getStoredAccounts,
  getStoredPosts,
  getStoredPlans,
  getStoredAiLogs,
  getStoredMediaAssets,
  getStoredBrands,
  saveStoredBrands
} from './lib/store';

import { Sidebar, TabType } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { SuperAdminBanner } from './components/layout/SuperAdminBanner';
import { SystemModeBanner } from './components/layout/SystemModeBanner';

import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { AgencyBrandManager } from './components/agency/AgencyBrandManager';
import { InstagramGridPlanner } from './components/influencer/InstagramGridPlanner';
import { PostComposer } from './components/composer/PostComposer';
import { CalendarView } from './components/calendar/CalendarView';
import { AgentsView } from './components/agents/AgentsView';
import { MediaVaultView } from './components/media/MediaVaultView';
import { AutoResponderView } from './components/autoresponder/AutoResponderView';
import { SocialConnectionsView } from './components/connections/SocialConnectionsView';
import { AuditLogsView } from './components/logs/AuditLogsView';
import { GoogleReviewsView } from './components/reviews/GoogleReviewsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SuperAdminPortal, SuperAdminSubTab } from './components/admin/SuperAdminPortal';
import { SettingsView } from './components/settings/SettingsView';
import { HelpCenterView } from './components/help/HelpCenterView';

import { PublicNavbar, PublicSubView } from './components/public/PublicNavbar';
import { LandingHero } from './components/public/LandingHero';
import { FeaturesView } from './components/public/FeaturesView';
import { PricingView } from './components/public/PricingView';
import { TestimonialsView } from './components/public/TestimonialsView';
import { AboutContactView } from './components/public/AboutContactView';
import { PublicFooter } from './components/public/PublicFooter';
import { CheckoutModal } from './components/payment/CheckoutModal';
import { AuthGate } from './components/auth/AuthGate';
import { clearAuthenticatedCache, hydrateFromCloud, mapProfile, type Profile } from './lib/api';
import { auth } from './lib/api';
import { setClerkTokenProvider, supabase } from './lib/supabase';
import { tenants as cloudTenants, socialConnections as cloudAccounts, posts as cloudPosts, postLogs as cloudLogs, aiCreditLogs as cloudAiLogs, mediaAssets as cloudMedia } from './lib/api';


export function App() {
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { session } = useSession();
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    setClerkTokenProvider(async () => {
      if (!session) return null;
      try {
        const token = await session.getToken({ template: 'supabase' });
        if (token) return token;
      } catch {
        /* fallback if template is not named supabase */
      }
      return session.getToken();
    });
    return () => setClerkTokenProvider(null);
  }, [session]);

  const getInitialTabFromPath = (): { tab: TabType; view: 'public' | 'auth' | 'app' } => {
    if (typeof window === 'undefined') return { tab: 'dashboard', view: 'public' };
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return { tab: 'dashboard', view: 'public' };
    if (path === 'login' || path === 'auth' || path === 'sign-in') return { tab: 'dashboard', view: 'auth' };
    if (path === 'admin') return { tab: 'admin', view: 'app' };
    if (path === 'infludash' || path === 'influencer' || path === 'agency' || path === 'dashboard') {
      return { tab: 'dashboard', view: 'app' };
    }
    const validTabs: TabType[] = ['dashboard', 'composer', 'calendar', 'agents', 'media', 'autoresponder', 'connections', 'logs', 'reviews', 'analytics', 'admin', 'settings', 'help'];
    if (validTabs.includes(path as TabType)) {
      return { tab: path as TabType, view: 'app' };
    }
    return { tab: 'dashboard', view: 'public' };
  };

  const initialRoute = getInitialTabFromPath();

  // Public vs App View Mode Router State
  const [viewMode, setViewMode] = useState<'public' | 'auth' | 'app'>(initialRoute.view);
  const [publicSubView, setPublicSubView] = useState<PublicSubView>('landing');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [cloudReady, setCloudReady] = useState(false);

  // Checkout Modal State
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [checkoutBillingCycle, setCheckoutBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutCurrency, setCheckoutCurrency] = useState<CurrencyCode>('USD');
  const [checkoutCurrencySymbol, setCheckoutCurrencySymbol] = useState<string>('$');

  const [tenants, setTenants] = useState<Tenant[]>(() => getStoredTenants());
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => {
    const list = getStoredTenants();
    return list[0] || INITIAL_TENANTS[0];
  });
  const [isSuperAdminMode, setIsSuperAdminMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>(initialRoute.tab);
  const [adminSubTab, setAdminSubTab] = useState<SuperAdminSubTab>('dashboard');

  // Keep browser URL pathname synced with view mode, active tab, and role
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let targetPath = '/';
    if (viewMode === 'auth') {
      targetPath = '/login';
    } else if (viewMode === 'app') {
      if (activeTab === 'admin' || profile?.isSuperAdmin || profile?.role === 'super_admin') {
        targetPath = '/admin';
      } else if (activeTab === 'dashboard') {
        if (profile?.role === 'influencer') {
          targetPath = '/infludash';
        } else if (profile?.role === 'agency') {
          targetPath = '/agency';
        } else {
          targetPath = '/dashboard';
        }
      } else {
        targetPath = `/${activeTab}`;
      }
    }
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, [viewMode, activeTab, profile?.role, profile?.isSuperAdmin]);

  const [accounts, setAccounts] = useState<SocialAccount[]>(() => getStoredAccounts());
  const [posts, setPosts] = useState<Post[]>(() => getStoredPosts());
  const [logs, setLogs] = useState<PostLog[]>(INITIAL_POST_LOGS);
  const [reviews, setReviews] = useState<GoogleReview[]>(INITIAL_REVIEWS);
  const [aiLogs, setAiLogs] = useState<AiCreditLog[]>(() => getStoredAiLogs());
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => getStoredMediaAssets());
  const [agentPrefilledMedia, setAgentPrefilledMedia] = useState<string[]>([]);
  
  // Agency Multi-Brand State
  const [brands, setBrands] = useState<AgencyBrand[]>(() => getStoredBrands());
  const [activeBrand, setActiveBrand] = useState<AgencyBrand | null>(null);

  useEffect(() => {
    saveStoredBrands(brands);
  }, [brands]);

  const handleAddBrand = (newBrand: Omit<AgencyBrand, 'id' | 'createdAt'>) => {
    const created: AgencyBrand = {
      ...newBrand,
      id: `brand-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setBrands(prev => [created, ...prev]);
    setActiveBrand(created);
  };

  const handleDeleteBrand = (brandId: string) => {
    setBrands(prev => prev.filter(b => b.id !== brandId));
    if (activeBrand?.id === brandId) {
      setActiveBrand(null);
    }
  };

  const loadAuthenticatedWorkspace = async () => {
    setCloudLoading(true);
    setCloudError('');
    try {
      if (!user) {
        setProfile(null);
        setViewMode('auth');
        return;
      }
      const primaryEmail = user.primaryEmailAddress?.emailAddress;
      if (!primaryEmail) throw new Error('Your Clerk account has no verified primary email.');

      const { data: provisionData, error: provisionError } = await supabase.rpc('ensure_clerk_profile', {
        p_email: primaryEmail,
        p_full_name: user.fullName || user.firstName || 'User',
        p_avatar_url: user.imageUrl || null,
      });
      if (provisionError) throw new Error(`Unable to provision your workspace profile: ${provisionError.message}`);

      let userProfile: Profile | null = null;
      if (provisionData) {
        userProfile = mapProfile(Array.isArray(provisionData) ? provisionData[0] : provisionData);
      }
      if (!userProfile) {
        userProfile = await auth.getProfile(primaryEmail);
      }
      if (!userProfile) throw new Error('Your workspace profile is not available yet. Please try again.');
      const isSuperAdmin = userProfile.isSuperAdmin;

      const cloud = await hydrateFromCloud().catch(() => ({
        tenants: [],
        accounts: [],
        posts: [],
        logs: [],
        reviews: [],
        aiLogs: [],
        media: []
      }));

      let activeTenants = cloud.tenants;
      if (!activeTenants.length) {
        const defaultTenant: Tenant = {
          id: userProfile.tenantId || crypto.randomUUID(),
          name: `${userProfile.fullName || 'User'}'s Workspace`,
          ownerEmail: userProfile.email,
          apiKey: `spree_${crypto.randomUUID()}`,
          tierPlan: isSuperAdmin ? 'enterprise' : 'starter',
          allocatedApiSlots: 5,
          maxSocialAccounts: 10,
          aiCredits: 1000,
          apiSlotDetails: [],
          cloudinaryConfig: { ...GLOBAL_DEFAULT_CLOUDINARY },
          status: 'active',
          createdAt: new Date().toISOString()
        };
        activeTenants = [defaultTenant];
        void cloudTenants.save(defaultTenant).catch(() => {});
      }

      setProfile(userProfile);
      setTenants(activeTenants);
      setCurrentTenant(activeTenants[0]);
      setAccounts(cloud.accounts);
      setPosts(cloud.posts);
      setLogs(cloud.logs);
      setAiLogs(cloud.aiLogs);
      setMediaAssets(cloud.media);
      setCloudReady(true);
      setIsSuperAdminMode(isSuperAdmin);
      if (isSuperAdmin && ['composer', 'calendar', 'connections', 'autoresponder', 'media'].includes(activeTab)) {
        setActiveTab('admin');
      }
      setViewMode('app');
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : 'Unable to load workspace.');
      setViewMode('app');
    } finally {
      setCloudLoading(false);
    }
  };

  useEffect(() => {
    if (!isClerkLoaded) return;

    if (isSignedIn && user && session) {
      void loadAuthenticatedWorkspace();
    } else {
      setCloudLoading(false);
      if (viewMode === 'app' && !profile) {
        setViewMode('auth');
      }
    }
  }, [isClerkLoaded, isSignedIn, user, session]);

  // Sync state to storage
  useEffect(() => { if (cloudReady && isSignedIn) void cloudTenants.saveAll(tenants).catch((e: any) => setCloudError(e.message)); }, [tenants, cloudReady, isSignedIn]);

  useEffect(() => { if (cloudReady && isSignedIn) void Promise.all(accounts.map(a => cloudAccounts.save(a))).catch((e: any) => setCloudError(e.message)); }, [accounts, cloudReady, isSignedIn]);

  useEffect(() => { if (cloudReady && isSignedIn) void Promise.all(posts.map(p => cloudPosts.save(p))).catch((e: any) => setCloudError(e.message)); }, [posts, cloudReady, isSignedIn]);

  useEffect(() => { if (cloudReady && isSignedIn) void Promise.all(logs.map(l => cloudLogs.create(l))).catch((e: any) => setCloudError(e.message)); }, [logs, cloudReady, isSignedIn]);

  useEffect(() => { if (cloudReady && isSignedIn) void Promise.all(aiLogs.map(l => cloudAiLogs.create(l))).catch((e: any) => setCloudError(e.message)); }, [aiLogs, cloudReady, isSignedIn]);

  useEffect(() => { if (cloudReady && isSignedIn) void Promise.all(mediaAssets.map(m => cloudMedia.create(m))).catch((e: any) => setCloudError(e.message)); }, [mediaAssets, cloudReady, isSignedIn]);


  const handleAddMediaAsset = (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => {
    if (asset.tenantId !== currentTenant.id) return;
    const newAsset: MediaAsset = {
      ...asset,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const updated = [newAsset, ...mediaAssets];
    setMediaAssets(updated);
  };

  const handleDeleteMediaAsset = (id: string) => {
    const target = mediaAssets.find(m => m.id === id);
    if (!target || target.tenantId !== currentTenant.id) return;
    const updated = mediaAssets.filter(m => m.id !== id);
    setMediaAssets(updated);
  };

  // Public Navigation Handlers
  const handleNavigatePublic = (view: PublicSubView) => {
    setViewMode('public');
    setPublicSubView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchApp = async () => {
    setCloudLoading(true);
    if (isSignedIn) {
      void loadAuthenticatedWorkspace();
    } else {
      setCloudLoading(false);
      setViewMode('auth');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await clerkSignOut();
    setClerkTokenProvider(null);
    clearAuthenticatedCache();
    setProfile(null);
    setCloudReady(false);
    setIsSuperAdminMode(false);
    setViewMode('auth');
  };


  const handleOpenCheckout = (
    planId?: string, 
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    selectedCurrency?: CurrencyCode,
    currencySymbol?: string
  ) => {
    const allPlans = getStoredPlans();
    const target = allPlans.find(p => p.id === planId) || allPlans.find(p => p.isPopular) || allPlans[0];
    setSelectedPlanForCheckout(target);
    setCheckoutBillingCycle(billingCycle);
    const curr = selectedCurrency || target.currency || 'USD';
    const sym = currencySymbol || target.currencySymbol || '$';
    setCheckoutCurrency(curr);
    setCheckoutCurrencySymbol(sym);
    setCheckoutOpen(true);
  };

  const getPageTitle = (tab: TabType): string => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'agency_brands': return 'Agency Multi-Brand Management Suite';
      case 'grid_planner': return 'Instagram & TikTok Feed Grid Planner';
      case 'composer': return 'Post Composer';
      case 'calendar': return 'Interactive Calendar Scheduling Grid';
      case 'agents': return 'AI Autonomous Booking Agents';
      case 'media': return 'Unified Media Vault';
      case 'autoresponder': return 'Comment Keyword Auto-Responder & DMs';
      case 'connections': return 'Social Connections';
      case 'logs': return 'Activity Logs';
      case 'reviews': return 'Google Reviews';
      case 'analytics': return 'Analytics Engine';
      case 'admin': return 'Super Admin Portal';
      case 'settings': return 'System Settings';
      case 'help': return 'Help Center & Documentation';
      default: return 'SocialSpree SaaS';
    }
  };

  // Toggle Super Admin Mode handler
  const handleToggleSuperAdmin = () => {
    if (!profile?.isSuperAdmin) return;
    const nextMode = !isSuperAdminMode;
    setIsSuperAdminMode(nextMode);
    if (nextMode) {
      setCurrentTenant(tenants[0] || INITIAL_TENANTS[0]); // Reset to Master Super Admin
      setActiveTab('admin');
      setAdminSubTab('dashboard');
    } else {
      setCurrentTenant(tenants[1] || tenants[0]);
      setActiveTab('dashboard');
    }
  };

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'admin') {
      const isAuthorized = profile?.isSuperAdmin === true;
      if (!isAuthorized) {
        setActiveTab('dashboard');
        return;
      }
      setCurrentTenant(tenants[0] || INITIAL_TENANTS[0]);
    }
    setActiveTab(tab);
  };

  // AI Credit Handlers
  const handleDeductAiCredits = (tenantId: string, amount: number, description: string) => {
    let newBalance = 0;
    const updatedTenants = tenants.map(t => {
      if (t.id === tenantId) {
        newBalance = Math.max(0, (t.aiCredits ?? 1000) - amount);
        return { ...t, aiCredits: newBalance };
      }
      return t;
    });

    setTenants(updatedTenants);

    if (currentTenant.id === tenantId) {
      setCurrentTenant(prev => ({ ...prev, aiCredits: newBalance }));
    }

    // Record AI Credit Log
    const targetTenant = tenants.find(t => t.id === tenantId);
    const newLog: AiCreditLog = {
      id: crypto.randomUUID(),
      tenantId,
      tenantName: targetTenant ? targetTenant.name : 'Organization',
      action: description.toLowerCase().includes('hashtag') ? 'hashtag_generation' : 'text_generation',
      creditsAmount: -amount,
      remainingBalance: newBalance,
      description,
      timestamp: new Date().toISOString()
    };

    const updatedLogs = [newLog, ...aiLogs];
    setAiLogs(updatedLogs);
  };

  const handleTopupAiCredits = (tenantId: string, amount: number, description: string) => {
    let newBalance = 0;
    const updatedTenants = tenants.map(t => {
      if (t.id === tenantId) {
        newBalance = (t.aiCredits ?? 1000) + amount;
        return { ...t, aiCredits: newBalance };
      }
      return t;
    });

    setTenants(updatedTenants);

    if (currentTenant.id === tenantId) {
      setCurrentTenant(prev => ({ ...prev, aiCredits: newBalance }));
    }

    const targetTenant = tenants.find(t => t.id === tenantId);
    const newLog: AiCreditLog = {
      id: crypto.randomUUID(),
      tenantId,
      tenantName: targetTenant ? targetTenant.name : 'Organization',
      action: 'superadmin_topup',
      creditsAmount: amount,
      remainingBalance: newBalance,
      description: description || `Super Admin Top-Up (+${amount} AI Credits)`,
      timestamp: new Date().toISOString()
    };

    const updatedLogs = [newLog, ...aiLogs];
    setAiLogs(updatedLogs);
  };

  // Tenant Handlers
  const handleAddTenant = (tenantInput: Omit<Tenant, 'id' | 'createdAt'>) => {
    const newTenant: Tenant = {
      ...tenantInput,
      id: crypto.randomUUID(),
      aiCredits: tenantInput.aiCredits ?? 1000,
      createdAt: new Date().toISOString()
    };
    const updated = [newTenant, ...tenants];
    setTenants(updated);
  };

  const handleDeleteTenant = (tenantId: string) => {
    const updated = tenants.filter(t => t.id !== tenantId);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant(updated[0] || INITIAL_TENANTS[0]);
    }
  };

  const handleToggleTenantStatus = (tenantId: string) => {
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: t.status === 'active' ? ('suspended' as const) : ('active' as const)
        };
      }
      return t;
    });
    setTenants(updated);
  };

  const handleUpdateTenantPaymentStatus = (tenantId: string, paymentStatus: 'paid' | 'unpaid' | 'overdue' | 'trial') => {
    const updated = tenants.map(t => t.id === tenantId ? { ...t, paymentStatus } : t);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, paymentStatus });
    }
  };

  const handleUpdateTenantRenewalDate = (tenantId: string, renewalDate: string) => {
    const updated = tenants.map(t => t.id === tenantId ? { ...t, renewalDate } : t);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, renewalDate });
    }
  };

  const handleUpdateTenantPlan = (tenantId: string, planId: string) => {
    const allPlans = getStoredPlans();
    const targetPlan = allPlans.find(p => p.id === planId);

    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        const newSlotsCount = targetPlan ? targetPlan.allocatedApiSlots : t.allocatedApiSlots;
        const currentSlots = t.apiSlotDetails || [];
        let newSlotDetails = [...currentSlots];

        if (newSlotDetails.length < newSlotsCount) {
          for (let i = newSlotDetails.length; i < newSlotsCount; i++) {
            newSlotDetails.push({
              id: crypto.randomUUID(),
              slotNumber: i + 1,
              slotName: `API ${i + 1}`,
              apiKey: '',
              maxChannels: 2,
              connectedAccountIds: []
            });
          }
        } else if (newSlotDetails.length > newSlotsCount) {
          newSlotDetails = newSlotDetails.slice(0, newSlotsCount);
        }

        return {
          ...t,
          planId: planId,
          tierPlan: (targetPlan ? targetPlan.name : t.tierPlan) as any,
          allocatedApiSlots: newSlotsCount,
          maxSocialAccounts: newSlotsCount * 2,
          aiCredits: targetPlan ? targetPlan.aiCredits : (t.aiCredits ?? 1000),
          apiSlotDetails: newSlotDetails
        };
      }
      return t;
    });

    setTenants(updated);
    if (currentTenant.id === tenantId) {
      const match = updated.find(t => t.id === tenantId);
      if (match) setCurrentTenant(match);
    }
  };

  const handleUpdateTenantApiSlotDetails = (tenantId: string, slots: ApiAllocationSlot[]) => {
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        const slotsCount = slots.length;
        const firstKey = slots[0]?.apiKey || t.apiKey;
        return {
          ...t,
          apiKey: firstKey,
          apiSlotDetails: slots,
          allocatedApiSlots: slotsCount,
          maxSocialAccounts: slotsCount * 2
        };
      }
      return t;
    });

    setTenants(updated);
    if (currentTenant.id === tenantId) {
      const match = updated.find(t => t.id === tenantId);
      if (match) setCurrentTenant(match);
    }
  };

  const handleUpdateTenantTier = (tenantId: string, tier: 'free' | 'pro' | 'agency') => {
    const updated = tenants.map(t => t.id === tenantId ? { ...t, tierPlan: tier } : t);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, tierPlan: tier });
    }
  };

  const handleUpdateTenantLimit = (tenantId: string, limit: number) => {
    const updated = tenants.map(t => t.id === tenantId ? { ...t, maxSocialAccounts: limit } : t);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, maxSocialAccounts: limit });
    }
  };

  const handleUpdateTenantApiKey = (tenantId: string, newApiKey: string) => {
    const updated = tenants.map(t => t.id === tenantId ? { ...t, apiKey: newApiKey } : t);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, apiKey: newApiKey });
    }
  };

  const handleUpdateTenantApiSlots = (tenantId: string, slotsCount: number) => {
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        const currentSlots = t.apiSlotDetails || [];
        let newSlotDetails = [...currentSlots];
        if (newSlotDetails.length < slotsCount) {
          for (let i = newSlotDetails.length; i < slotsCount; i++) {
            newSlotDetails.push({
              id: crypto.randomUUID(),
              slotNumber: i + 1,
              slotName: `API ${i + 1}`,
              apiKey: '',
              maxChannels: 2,
              connectedAccountIds: []
            });
          }
        } else if (newSlotDetails.length > slotsCount) {
          newSlotDetails = newSlotDetails.slice(0, slotsCount);
        }
        return { 
          ...t, 
          allocatedApiSlots: slotsCount,
          maxSocialAccounts: slotsCount * 2,
          apiSlotDetails: newSlotDetails
        };
      }
      return t;
    });
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      const match = updated.find(t => t.id === tenantId);
      if (match) setCurrentTenant(match);
    }
  };

  const handleUpdateTenantCloudinary = (tenantId: string, config: CloudinaryConfig) => {
    const updated = tenants.map(t => t.id === tenantId ? { ...t, cloudinaryConfig: config } : t);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, cloudinaryConfig: config });
    }
  };

  const handleUpdateTenantProfile = (tenantId: string, name: string, ownerEmail: string) => {
    const updated = tenants.map(t => t.id === tenantId ? { ...t, name, ownerEmail } : t);
    setTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, name, ownerEmail });
    }
  };

  const handlePostPublished = (post: Post, log: PostLog) => {
    if (post.tenantId !== currentTenant.id || log.tenantId !== currentTenant.id) return;
    const updatedPosts = [post, ...posts];
    setPosts(updatedPosts);
    setLogs([log, ...logs]);
  };

  const handleDeletePost = (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (!target || target.tenantId !== currentTenant.id) return;
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
  };

  const handleAddAccount = (accInput: Omit<SocialAccount, 'id' | 'tenantId' | 'lastSyncedAt'>) => {
    const newAcc: SocialAccount = {
      ...accInput,
      id: crypto.randomUUID(),
      tenantId: currentTenant.id,
      lastSyncedAt: new Date().toISOString()
    };
    const updatedAccs = [newAcc, ...accounts];
    setAccounts(updatedAccs);
  };

  const handleReplyReview = (reviewId: string, replyText: string) => {
    const target = reviews.find(r => r.id === reviewId);
    if (!target || target.tenantId !== currentTenant.id) return;
    setReviews(reviews.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          reply: {
            text: replyText,
            repliedAt: 'Just now'
          }
        };
      }
      return r;
    }));
  };

  const handleRetryPublish = (log: PostLog) => {
    const retryLog: PostLog = {
      ...log,
      id: crypto.randomUUID(),
      httpStatus: 200,
      createdAt: new Date().toISOString()
    };
    setLogs([retryLog, ...logs]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] font-['Inter'] text-[#0B1C30]">
      {viewMode === 'auth' ? (
        cloudLoading ? (
          <div className="min-h-screen flex items-center justify-center font-bold text-slate-600">Loading secure workspace…</div>
        ) : (
          <div>
            {cloudError && <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow">{cloudError}</div>}
            <AuthGate
              onCancel={() => { setCloudError(''); setViewMode('public'); }}
            />
          </div>
        )
      ) : viewMode === 'public' ? (
        /* Public Marketing Landing View Mode */
        <div className="min-h-screen flex flex-col">
          <PublicNavbar
            currentPublicView={publicSubView}
            onNavigate={handleNavigatePublic}
            onLaunchApp={handleLaunchApp}
            onOpenCheckout={(planId) => handleOpenCheckout(planId)}
          />

          <main className="flex-1">
            {publicSubView === 'landing' && (
              <LandingHero
                onNavigate={handleNavigatePublic}
                onLaunchApp={handleLaunchApp}
                onOpenCheckout={(planId) => handleOpenCheckout(planId)}
              />
            )}
            {publicSubView === 'features' && (
              <FeaturesView
                onOpenCheckout={(planId) => handleOpenCheckout(planId)}
                onLaunchApp={handleLaunchApp}
              />
            )}
            {publicSubView === 'pricing' && (
              <PricingView
                plans={getStoredPlans()}
                onOpenCheckout={(planId, cycle, curr, sym) => handleOpenCheckout(planId, cycle, curr, sym)}
              />
            )}
            {publicSubView === 'testimonials' && <TestimonialsView />}
            {publicSubView === 'about' && <AboutContactView />}
          </main>

          <PublicFooter
            onNavigate={handleNavigatePublic}
            onLaunchApp={handleLaunchApp}
          />
        </div>
      ) : viewMode === 'app' ? (
        /* SaaS Dashboard Application View Mode */
        <div className="min-h-screen flex bg-[#F8FAFF]">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleSelectTab}
            isSuperAdmin={isSuperAdminMode}
            isAgencyMode={GLOBAL_SYSTEM_SETTINGS.agencyModeEnabled || currentTenant.tierPlan === 'agency'}
            isInfluencerMode={GLOBAL_SYSTEM_SETTINGS.influencerModeEnabled || currentTenant.tierPlan === 'pro'}
            activeAdminSubTab={adminSubTab}
            onSelectAdminSubTab={setAdminSubTab}
            onReturnToPublic={() => setViewMode('public')}
            userFullName={profile?.fullName || undefined}
            userEmail={profile?.email || undefined}
            userRole={profile?.role || undefined}
          />

          <div className="flex-1 flex flex-col md:ml-[260px] min-w-0">
            <SuperAdminBanner
              isSuperAdminMode={isSuperAdminMode}
              onToggleSuperAdmin={handleToggleSuperAdmin}
              userEmail={profile?.email || SUPER_ADMIN_EMAIL}
            />
            <SystemModeBanner />
            <Header
              tenants={tenants}
              currentTenant={currentTenant}
              onSelectTenant={setCurrentTenant}
              isSuperAdminMode={isSuperAdminMode}
              onToggleSuperAdmin={handleToggleSuperAdmin}
              pageTitle={getPageTitle(activeTab)}
              onReturnToPublic={() => setViewMode('public')}
              onSignOut={handleSignOut}
              userEmail={profile?.email || SUPER_ADMIN_EMAIL}
              userProfile={profile}
              onOpenUserProfile={() => setActiveTab('settings')}
              isAgencyMode={GLOBAL_SYSTEM_SETTINGS.agencyModeEnabled || currentTenant.tierPlan === 'agency'}
              brands={brands}
              activeBrand={activeBrand}
              onSelectBrand={setActiveBrand}
              onOpenBrandManager={() => setActiveTab('agency_brands')}
            />


            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  tenant={currentTenant}
                  posts={posts}
                  accounts={accounts}
                  logs={logs}
                  reviews={reviews}
                  onNavigate={setActiveTab}
                  isSuperAdmin={isSuperAdminMode}
                />
              )}

              {activeTab === 'agency_brands' && (
                <AgencyBrandManager
                  brands={brands}
                  activeBrand={activeBrand}
                  onSelectBrand={setActiveBrand}
                  onAddBrand={handleAddBrand}
                  onDeleteBrand={handleDeleteBrand}
                  accounts={accounts}
                  posts={posts}
                  mediaAssets={mediaAssets}
                />
              )}

              {activeTab === 'grid_planner' && (
                <InstagramGridPlanner
                  mediaAssets={mediaAssets}
                  posts={posts}
                  onScheduleFromGrid={() => setActiveTab('composer')}
                />
              )}

              {activeTab === 'composer' && (
                <PostComposer
                  key={currentTenant.id}
                  tenant={currentTenant}
                  accounts={accounts.filter(a => a.tenantId === currentTenant.id)}
                  aiLogs={aiLogs.filter(l => l.tenantId === currentTenant.id)}
                  onDeductAiCredits={(amount, desc) => handleDeductAiCredits(currentTenant.id, amount, desc)}
                  onPostPublished={handlePostPublished}
                  onUpdateTenantCloudinary={handleUpdateTenantCloudinary}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  key={currentTenant.id}
                  tenant={currentTenant}
                  accounts={accounts}
                  posts={posts}
                  onPostPublished={handlePostPublished}
                  onDeletePost={handleDeletePost}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'agents' && (
                <AgentsView
                  key={currentTenant.id}
                  tenant={currentTenant}
                  accounts={accounts}
                  aiLogs={aiLogs.filter(l => l.tenantId === currentTenant.id)}
                  prefilledMediaUrls={agentPrefilledMedia}
                  onDeductAiCredits={(amount, desc) => handleDeductAiCredits(currentTenant.id, amount, desc)}
                  onPostPublished={handlePostPublished}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'media' && (
                <MediaVaultView
                  key={currentTenant.id}
                  tenant={currentTenant}
                  mediaAssets={mediaAssets.filter(asset => asset.tenantId === currentTenant.id)}
                  onAddMediaAsset={handleAddMediaAsset}
                  onDeleteMediaAsset={handleDeleteMediaAsset}
                  onUseInComposer={(_urls) => {
                    setActiveTab('composer');
                  }}
                  onReferInAgent={(urls) => {
                    setAgentPrefilledMedia(urls);
                    setActiveTab('agents');
                  }}
                />
              )}

              {activeTab === 'autoresponder' && (
                <AutoResponderView
                  key={currentTenant.id}
                  tenant={currentTenant}
                  accounts={accounts}
                  mediaAssets={mediaAssets.filter(m => m.tenantId === currentTenant.id)}
                />
              )}

              {activeTab === 'connections' && (
                <SocialConnectionsView
                  tenant={currentTenant}
                  accounts={accounts}
                  onAddAccount={handleAddAccount}
                />
              )}

              {activeTab === 'logs' && (
                <AuditLogsView
                  tenant={currentTenant}
                  logs={logs}
                  posts={posts}
                  onRetryPublish={handleRetryPublish}
                />
              )}

              {activeTab === 'reviews' && (
                <GoogleReviewsView
                  tenant={currentTenant}
                  reviews={reviews}
                  onReplyReview={handleReplyReview}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  tenant={currentTenant}
                  posts={posts}
                  accounts={accounts}
                />
              )}

              {activeTab === 'admin' && (
                <SuperAdminPortal
                  tenants={tenants}
                  aiLogs={aiLogs}
                  onAddTenant={handleAddTenant}
                  onDeleteTenant={handleDeleteTenant}
                  onUpdateTenantTier={handleUpdateTenantTier}
                  onUpdateTenantLimit={handleUpdateTenantLimit}
                  onUpdateTenantApiKey={handleUpdateTenantApiKey}
                  onUpdateTenantCloudinary={handleUpdateTenantCloudinary}
                  onUpdateTenantApiSlots={handleUpdateTenantApiSlots}
                  onUpdateTenantApiSlotDetails={handleUpdateTenantApiSlotDetails}
                  onToggleTenantStatus={handleToggleTenantStatus}
                  onUpdateTenantPaymentStatus={handleUpdateTenantPaymentStatus}
                  onUpdateTenantRenewalDate={handleUpdateTenantRenewalDate}
                  onUpdateTenantPlan={handleUpdateTenantPlan}
                  onTopupAiCredits={handleTopupAiCredits}
                  activeSubTab={adminSubTab}
                  onSelectSubTab={setAdminSubTab}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  tenant={currentTenant}
                  userProfile={profile}
                  onUpdateUserProfile={setProfile}
                  onUpdateTenantCloudinary={handleUpdateTenantCloudinary}
                  onUpdateTenantProfile={handleUpdateTenantProfile}
                />
              )}

              {activeTab === 'help' && (
                <HelpCenterView />
              )}
            </main>

            <MobileNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isSuperAdmin={isSuperAdminMode}
            />
          </div>
        </div>
      ) : (
        <AuthGate onCancel={() => { setCloudError(''); setViewMode('public'); }} />
      )}

      {/* Dual Payment Modal */}
      {checkoutOpen && selectedPlanForCheckout && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          selectedPlan={selectedPlanForCheckout}
          initialBillingCycle={checkoutBillingCycle}
          selectedCurrency={checkoutCurrency}
          currencySymbol={checkoutCurrencySymbol}
        />
      )}
    </div>
  );
}
