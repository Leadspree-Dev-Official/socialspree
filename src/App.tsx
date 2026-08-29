import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Tenant, SocialAccount, Post, PostLog, GoogleReview, CloudinaryConfig, ApiAllocationSlot, AiCreditLog, SubscriptionPlan, CurrencyCode, MediaAsset, AgencyBrand, SystemSettings } from './types';
import { 
  INITIAL_TENANTS, 
  INITIAL_POST_LOGS, 
  INITIAL_REVIEWS, 
  SUPER_ADMIN_EMAIL,
  GLOBAL_DEFAULT_CLOUDINARY, 
  GLOBAL_SYSTEM_SETTINGS,
  getStoredSystemSettings,
  getStoredTenants,
  saveStoredTenants,
  getStoredAccounts,
  saveStoredAccounts,
  getStoredPosts,
  saveStoredPosts,
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
import { VoiceAssistantOverlay } from './components/assistant/VoiceAssistantOverlay';
import { MessageSquareCode } from 'lucide-react';

import { PublicNavbar } from './components/public/PublicNavbar';
import { LandingHero } from './components/public/LandingHero';
import { FeaturesView } from './components/public/FeaturesView';
import { PricingView } from './components/public/PricingView';
import { TestimonialsView } from './components/public/TestimonialsView';
import { AboutContactView } from './components/public/AboutContactView';
import { PublicFooter } from './components/public/PublicFooter';
import { CheckoutPage } from './components/payment/CheckoutPage';
import { AuthView } from './components/auth/AuthView';
import { SetNewPasswordView } from './components/auth/SetNewPasswordView';
import { clearAuthenticatedCache, hydrateFromCloud, mapProfile, type Profile, auth, socialConnections, tenants as cloudTenants, posts as cloudPosts, postLogs as cloudLogs, aiCreditLogs as cloudAiLogs, mediaAssets as cloudMedia, agencyBrands } from './lib/api';
import { supabase } from './lib/supabase';
import { executePublishing } from './lib/zernio';

function checkIsRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const path = window.location.pathname || '';
  return (
    hash.includes('type=recovery') ||
    (hash.includes('access_token=') && hash.includes('type=')) ||
    search.includes('type=recovery') ||
    path === '/set-password' ||
    path === '/reset-password' ||
    path === '/reset' ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('spree_recovery_active') === 'true')
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTabFromPath = (): { tab: TabType; view: 'public' | 'auth' | 'app'; authMode?: 'signin' | 'signup' | 'forgot' | 'set_password' } => {
    if (typeof window === 'undefined') return { tab: 'dashboard', view: 'public' };
    if (checkIsRecoveryUrl()) {
      try { sessionStorage.setItem('spree_recovery_active', 'true'); } catch { /* ignore */ }
      return { tab: 'dashboard', view: 'auth', authMode: 'set_password' };
    }
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path || path === 'features' || path === 'pricing' || path === 'testimonials' || path === 'about' || path === 'docs' || path === 'checkout' || path === 'cart') return { tab: 'dashboard', view: 'public' };
    if (path === 'login' || path === 'auth' || path === 'sign-in') return { tab: 'dashboard', view: 'auth', authMode: 'signin' };
    if (path === 'signup' || path === 'register') return { tab: 'dashboard', view: 'auth', authMode: 'signup' };
    if (path === 'reset' || path === 'reset-password' || path === 'forgot-password') return { tab: 'dashboard', view: 'auth', authMode: 'forgot' };
    if (path === 'set-password' || path === 'update-password') return { tab: 'dashboard', view: 'auth', authMode: 'set_password' };
    if (path === 'superadmin' || path === 'admin') return { tab: 'superadmin', view: 'app' };
    if (path === 'dashboard' || path === 'infludash' || path === 'influencer' || path === 'agency') {
      return { tab: 'dashboard', view: 'app' };
    }
    const validTabs: TabType[] = ['dashboard', 'agency_brands', 'grid_planner', 'composer', 'calendar', 'agents', 'media', 'autoresponder', 'connections', 'logs', 'reviews', 'analytics', 'admin', 'superadmin', 'settings', 'help'];
    if (validTabs.includes(path as TabType)) {
      return { tab: path as TabType, view: 'app' };
    }
    return { tab: 'dashboard', view: 'public' };
  };

  const initialRoute = getInitialTabFromPath();

  // Public vs App View Mode Router State
  const [viewMode, setViewMode] = useState<'public' | 'auth' | 'app'>(initialRoute.view);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'set_password'>(initialRoute.authMode || 'signin');
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const raw = localStorage.getItem('socialspree_user_profile_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [cloudReady, setCloudReady] = useState(false);

  // Checkout Page State
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [checkoutBillingCycle, setCheckoutBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutCurrency, setCheckoutCurrency] = useState<CurrencyCode>('USD');
  const [checkoutCurrencySymbol, setCheckoutCurrencySymbol] = useState<string>('$');

  const [tenants, setTenants] = useState<Tenant[]>(() => getStoredTenants());
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => {
    const list = getStoredTenants();
    return list[0] || INITIAL_TENANTS[0];
  });
  const [isSuperAdminMode, setIsSuperAdminMode] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('socialspree_user_profile_v1');
      if (raw) {
        const p = JSON.parse(raw);
        return p?.isSuperAdmin === true || p?.role === 'super_admin' || p?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      }
    } catch { /* ignore */ }
    return false;
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => getStoredSystemSettings());
  const [activeTab, setActiveTab] = useState<TabType>(initialRoute.tab);
  const [adminSubTab, setAdminSubTab] = useState<SuperAdminSubTab>('dashboard');

  const handleUpdateSystemSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    Object.assign(GLOBAL_SYSTEM_SETTINGS, newSettings);
    try {
      localStorage.setItem('spree_system_settings', JSON.stringify(newSettings));
    } catch {
      /* ignore storage quota errors */
    }
  };

  // Keep browser URL pathname synced with view mode, active tab, and role (app mode only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (checkIsRecoveryUrl() || authMode === 'set_password') {
      return;
    }
    // Only sync URL for auth and app modes — public mode uses react-router
    if (viewMode === 'auth') {
      const targetPath = authMode === 'signup' ? '/signup' : authMode === 'forgot' ? '/reset-password' : '/login';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } else if (viewMode === 'app') {
      let targetPath: string;
      if (activeTab === 'superadmin') {
        targetPath = '/superadmin';
      } else if (activeTab === 'dashboard') {
        targetPath = '/dashboard';
      } else if (activeTab === 'admin') {
        targetPath = profile?.isSuperAdmin || isSuperAdminMode ? '/superadmin' : '/dashboard';
      } else {
        targetPath = `/${activeTab}`;
      }
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  }, [viewMode, activeTab, authMode, profile?.role, profile?.isSuperAdmin]);

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

  // Listen to cross-window / cross-tab storage changes & custom account-sync events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'socialspree_accounts_v1' || e.key === 'socialspree_social_accounts') && e.newValue) {
        try {
          setAccounts(JSON.parse(e.newValue));
        } catch { /* ignore */ }
      }
    };

    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setAccounts(customEvent.detail);
      } else {
        setAccounts(getStoredAccounts());
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('socialspree_accounts_updated', handleCustomSync);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('socialspree_accounts_updated', handleCustomSync);
    };
  }, []);

  const handleAddBrand = (newBrand: Omit<AgencyBrand, 'id' | 'createdAt'>) => {
    const created: AgencyBrand = {
      ...newBrand,
      id: `brand-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setBrands(prev => [created, ...prev]);
    setActiveBrand(created);
    void agencyBrands.save(created).catch(() => {});
  };

  const handleDeleteBrand = (brandId: string) => {
    setBrands(prev => prev.filter(b => b.id !== brandId));
    if (activeBrand?.id === brandId) {
      setActiveBrand(null);
    }
    void agencyBrands.delete(brandId).catch(() => {});
  };

  const loadAuthenticatedWorkspace = async (targetUser?: any) => {
    if (checkIsRecoveryUrl() || authMode === 'set_password') {
      return;
    }
    setCloudLoading(true);
    setCloudError('');
    try {
      const activeUser = targetUser || supabaseUser || (await supabase.auth.getUser()).data.user;
      if (!activeUser) {
        setProfile(null);
        setViewMode('auth');
        return;
      }
      const primaryEmail = activeUser.email;
      if (!primaryEmail) throw new Error('Your Supabase account has no verified email address.');

      let userProfile: Profile | null = await auth.getProfile(primaryEmail);

      if (!userProfile) {
        const emailLower = primaryEmail.toLowerCase().trim();
        const isAdmin = emailLower === SUPER_ADMIN_EMAIL.toLowerCase();
        const fallbackTenantId = isAdmin ? '00000000-0000-0000-0000-000000000001' : crypto.randomUUID();

        userProfile = {
          id: activeUser.id || `user_${crypto.randomUUID().slice(0, 12)}`,
          email: emailLower,
          fullName: activeUser.user_metadata?.full_name || (isAdmin ? 'Aniruddha' : emailLower.split('@')[0]),
          avatarUrl: activeUser.user_metadata?.avatar_url || '',
          jobTitle: isAdmin ? 'Founder & CEO' : 'Business Owner',
          phoneNumber: '',
          timezone: 'UTC',
          notifications: { emailDigest: true, postFailureAlerts: true, securityAlerts: true },
          tenantId: fallbackTenantId,
          isSuperAdmin: isAdmin,
          role: isAdmin ? 'super_admin' : 'business_user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        void (async () => {
          try {
            await supabase.from('profiles').upsert({
              id: userProfile!.id,
              email: userProfile!.email,
              full_name: userProfile!.fullName,
              avatar_url: userProfile!.avatarUrl,
              tenant_id: userProfile!.tenantId,
              is_super_admin: userProfile!.isSuperAdmin,
              role: userProfile!.role
            });
          } catch { /* ignore */ }
        })();
      }

      setProfile(userProfile);
      try {
        localStorage.setItem('socialspree_user_profile_v1', JSON.stringify(userProfile));
      } catch { /* ignore */ }
      const isSuperAdmin = userProfile.isSuperAdmin;

      const cloud = await hydrateFromCloud().catch(() => ({
        tenants: [],
        plans: [],
        accounts: [],
        posts: [],
        logs: [],
        reviews: [],
        media: [],
        aiLogs: [],
        brands: [],
      }));

      const cloudList = cloud.tenants || [];
      const localList = getStoredTenants() || [];

      // Merge by tenant ID and ownerEmail so no registered tenant is ever missed
      const mergedMap = new Map<string, Tenant>();
      for (const t of INITIAL_TENANTS) {
        mergedMap.set(t.id, t);
        if (t.ownerEmail) mergedMap.set(t.ownerEmail.toLowerCase(), t);
      }
      for (const t of localList) {
        mergedMap.set(t.id, t);
        if (t.ownerEmail) mergedMap.set(t.ownerEmail.toLowerCase(), t);
      }
      for (const t of cloudList) {
        mergedMap.set(t.id, t);
        if (t.ownerEmail) mergedMap.set(t.ownerEmail.toLowerCase(), t);
      }

      let allTenants = Array.from(new Set(mergedMap.values()));

      // Also check Supabase profiles table for any signed-up users lacking a tenant entry
      try {
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
          for (const p of dbProfiles) {
            if (!p.email) continue;
            const emailLower = p.email.toLowerCase();
            const existing = allTenants.find(t => t.ownerEmail.toLowerCase() === emailLower);
            if (!existing) {
              const generatedTenant: Tenant = {
                id: p.tenant_id || crypto.randomUUID(),
                name: `${p.full_name || emailLower.split('@')[0]}'s Workspace`,
                ownerEmail: emailLower,
                apiKey: `spree_${crypto.randomUUID()}`,
                tierPlan: 'free',
                allocatedApiSlots: 1,
                maxSocialAccounts: 2,
                aiCredits: 1000,
                apiSlotDetails: [
                  { id: `slot-${crypto.randomUUID().slice(0, 8)}`, slotNumber: 1, slotName: 'API 1', provider: 'zernio', apiKey: '', maxChannels: 2, connectedAccountIds: [] }
                ],
                cloudinaryConfig: { ...GLOBAL_DEFAULT_CLOUDINARY },
                status: 'active',
                paymentStatus: 'paid',
                billingCycle: 'monthly',
                createdAt: p.created_at || new Date().toISOString()
              };
              allTenants.push(generatedTenant);
              void cloudTenants.save(generatedTenant).catch(() => {});
            }
          }
        }
      } catch {
        /* ignore network failures */
      }

      // Ensure Master Super Admin tenant is always included in allTenants
      if (!allTenants.some(t => t.ownerEmail === SUPER_ADMIN_EMAIL)) {
        allTenants = [INITIAL_TENANTS[0], ...allTenants];
      }

      let userTenants: Tenant[];

      if (isSuperAdmin) {
        userTenants = allTenants;
      } else {
        // Non-admin users only see tenants owned by their email
        userTenants = allTenants.filter(t => t.ownerEmail.toLowerCase() === primaryEmail.toLowerCase());
      }

      if (!userTenants.length) {
        const newPersonalTenant: Tenant = {
          id: userProfile.tenantId || crypto.randomUUID(),
          name: `${userProfile.fullName || primaryEmail.split('@')[0]}'s Workspace`,
          ownerEmail: primaryEmail,
          apiKey: `spree_${crypto.randomUUID()}`,
          tierPlan: 'free',
          allocatedApiSlots: 1,
          maxSocialAccounts: 2,
          aiCredits: 1000,
          apiSlotDetails: [
            { id: `slot-${crypto.randomUUID().slice(0, 8)}`, slotNumber: 1, slotName: 'API 1', provider: 'zernio', apiKey: '', maxChannels: 2, connectedAccountIds: [] }
          ],
          cloudinaryConfig: { ...GLOBAL_DEFAULT_CLOUDINARY },
          status: 'active',
          paymentStatus: 'paid',
          billingCycle: 'monthly',
          createdAt: new Date().toISOString()
        };
        userTenants = [newPersonalTenant];
        allTenants = [...allTenants, newPersonalTenant];
        saveStoredTenants(allTenants);
        void cloudTenants.save(newPersonalTenant).catch(() => {});
      } else {
        saveStoredTenants(allTenants);
      }

      setProfile(userProfile);
      setTenants(allTenants);
      setCurrentTenant(userTenants[0]);
      setAccounts(cloud.accounts);
      setPosts(cloud.posts);
      setLogs(cloud.logs);
      setAiLogs(cloud.aiLogs);
      setMediaAssets(cloud.media);
      if (cloud.reviews && cloud.reviews.length > 0) setReviews(cloud.reviews);
      if (cloud.brands && cloud.brands.length > 0) setBrands(cloud.brands);
      setCloudReady(true);
      setIsSuperAdminMode(isSuperAdmin);
      if (activeTab === 'superadmin' || activeTab === 'admin') {
        if (!isSuperAdmin) {
          setActiveTab('dashboard');
        } else {
          setActiveTab('superadmin');
        }
      }
      setViewMode('app');
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : 'Unable to load workspace.');
      setViewMode('app');
    } finally {
      setCloudLoading(false);
    }
  };

  // Sync route changes to viewMode and activeTab
  useEffect(() => {
    const route = getInitialTabFromPath();
    setViewMode(route.view);
    if (route.authMode) {
      setAuthMode(route.authMode);
    }
    if (route.view === 'app' && route.tab) {
      setActiveTab(route.tab);
    }
  }, [location.pathname, location.hash, location.search]);

  // Supabase Auth session & auth state change listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsAuthLoaded(true);

      if (checkIsRecoveryUrl()) {
        try { sessionStorage.setItem('spree_recovery_active', 'true'); } catch { /* ignore */ }
        setViewMode('auth');
        setAuthMode('set_password');
        setCloudLoading(false);
        return;
      }

      if (session?.user) {
        void loadAuthenticatedWorkspace(session.user);
      } else {
        setCloudLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSupabaseSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsAuthLoaded(true);

      if (event === 'PASSWORD_RECOVERY' || checkIsRecoveryUrl()) {
        try { sessionStorage.setItem('spree_recovery_active', 'true'); } catch { /* ignore */ }
        setViewMode('auth');
        setAuthMode('set_password');
        setCloudLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        if (!checkIsRecoveryUrl() && authMode !== 'set_password') {
          void loadAuthenticatedWorkspace(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        try { sessionStorage.removeItem('spree_recovery_active'); } catch { /* ignore */ }
        setProfile(null);
        setCloudReady(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime Supabase Database Sync for external posts (e.g. ChatGPT, background jobs)
  useEffect(() => {
    if (!cloudReady) return;

    const channel = supabase
      .channel('realtime_workspace_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async () => {
          try {
            const freshPosts = await cloudPosts.list();
            if (freshPosts && freshPosts.length > 0) {
              setPosts(freshPosts);
              saveStoredPosts(freshPosts);
            }
          } catch (e) {
            console.warn('Realtime posts refresh error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_logs' },
        async () => {
          try {
            const freshLogs = await cloudLogs.list();
            if (freshLogs) setLogs(freshLogs);
          } catch (e) {
            console.warn('Realtime logs refresh error:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cloudReady]);

  // Sync local cache state safely without triggering premature cross-tenant RLS writes
  useEffect(() => {
    if (cloudReady) {
      saveStoredTenants(tenants);
    }
  }, [tenants, cloudReady]);


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

  const handleLaunchApp = async () => {
    setCloudLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      void loadAuthenticatedWorkspace(session.user);
    } else {
      setCloudLoading(false);
      setViewMode('auth');
      navigate('/login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    clearAuthenticatedCache();
    setProfile(null);
    setCloudReady(false);
    setIsSuperAdminMode(false);
    setViewMode('auth');
    navigate('/login');
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
    setViewMode('public');
    navigate('/checkout');
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
      case 'superadmin': return 'Super Admin Platform Portal';
      case 'admin': return 'Super Admin Platform Portal';
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
      setActiveTab('superadmin');
      setAdminSubTab('dashboard');
    } else {
      setCurrentTenant(tenants[1] || tenants[0]);
      setActiveTab('dashboard');
    }
  };

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'superadmin' || tab === 'admin') {
      const isAuthorized = profile?.isSuperAdmin === true || isSuperAdminMode;
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
    let targetUpdatedTenant: Tenant | null = null;
    const updatedTenants = tenants.map(t => {
      if (t.id === tenantId) {
        newBalance = Math.max(0, (t.aiCredits ?? 1000) - amount);
        targetUpdatedTenant = { ...t, aiCredits: newBalance };
        return targetUpdatedTenant;
      }
      return t;
    });

    setTenants(updatedTenants);
    saveStoredTenants(updatedTenants);

    if (currentTenant.id === tenantId) {
      setCurrentTenant(prev => ({ ...prev, aiCredits: newBalance }));
    }

    if (targetUpdatedTenant) {
      void cloudTenants.save(targetUpdatedTenant).catch(() => {});
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
    void cloudAiLogs.create(newLog).catch(() => {});
  };

  const handleTopupAiCredits = (tenantId: string, amount: number, description: string) => {
    let newBalance = 0;
    let targetUpdatedTenant: Tenant | null = null;
    const updatedTenants = tenants.map(t => {
      if (t.id === tenantId) {
        newBalance = (t.aiCredits ?? 1000) + amount;
        targetUpdatedTenant = { ...t, aiCredits: newBalance };
        return targetUpdatedTenant;
      }
      return t;
    });

    setTenants(updatedTenants);
    saveStoredTenants(updatedTenants);

    if (currentTenant.id === tenantId) {
      setCurrentTenant(prev => ({ ...prev, aiCredits: newBalance }));
    }

    if (targetUpdatedTenant) {
      void cloudTenants.save(targetUpdatedTenant).catch(() => {});
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
    void cloudAiLogs.create(newLog).catch(() => {});
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
    saveStoredTenants(updated);
    void cloudTenants.save(newTenant).catch(() => {});
  };

  const handleDeleteTenant = (tenantId: string) => {
    const updated = tenants.filter(t => t.id !== tenantId);
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant(updated[0] || INITIAL_TENANTS[0]);
    }
  };

  const handleToggleTenantStatus = (tenantId: string) => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = {
          ...t,
          status: t.status === 'active' ? ('suspended' as const) : ('active' as const)
        };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantPaymentStatus = (tenantId: string, paymentStatus: 'paid' | 'unpaid' | 'overdue' | 'trial') => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = { ...t, paymentStatus };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, paymentStatus });
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantRenewalDate = (tenantId: string, renewalDate: string) => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = { ...t, renewalDate };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, renewalDate });
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantPlan = (tenantId: string, planId: string) => {
    const allPlans = getStoredPlans();
    const targetPlan = allPlans.find(p => p.id === planId);
    let targetUpdated: Tenant | null = null;

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

        targetUpdated = {
          ...t,
          planId: planId,
          tierPlan: (targetPlan ? targetPlan.name : t.tierPlan) as any,
          allocatedApiSlots: newSlotsCount,
          maxSocialAccounts: newSlotsCount * 2,
          aiCredits: targetPlan ? targetPlan.aiCredits : (t.aiCredits ?? 1000),
          apiSlotDetails: newSlotDetails
        };
        return targetUpdated;
      }
      return t;
    });

    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      const match = updated.find(t => t.id === tenantId);
      if (match) setCurrentTenant(match);
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantApiSlotDetails = (tenantId: string, slots: ApiAllocationSlot[]) => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        const slotsCount = slots.length;
        const firstKey = slots[0]?.apiKey || t.apiKey;
        targetUpdated = {
          ...t,
          apiKey: firstKey,
          apiSlotDetails: slots,
          allocatedApiSlots: slotsCount,
          maxSocialAccounts: slotsCount * 2
        };
        return targetUpdated;
      }
      return t;
    });

    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      const match = updated.find(t => t.id === tenantId);
      if (match) setCurrentTenant(match);
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantTier = (tenantId: string, tier: 'free' | 'pro' | 'agency') => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = { ...t, tierPlan: tier };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, tierPlan: tier });
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantLimit = (tenantId: string, limit: number) => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = { ...t, maxSocialAccounts: limit };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, maxSocialAccounts: limit });
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantApiKey = (tenantId: string, newApiKey: string) => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = { ...t, apiKey: newApiKey };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, apiKey: newApiKey });
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantApiSlots = (tenantId: string, slotsCount: number) => {
    let targetUpdated: Tenant | null = null;
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
        targetUpdated = { 
          ...t, 
          allocatedApiSlots: slotsCount,
          maxSocialAccounts: slotsCount * 2,
          apiSlotDetails: newSlotDetails
        };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      const match = updated.find(t => t.id === tenantId);
      if (match) setCurrentTenant(match);
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantCloudinary = (tenantId: string, config: CloudinaryConfig) => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = { ...t, cloudinaryConfig: config };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, cloudinaryConfig: config });
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
    }
  };

  const handleUpdateTenantProfile = (tenantId: string, name: string, ownerEmail: string) => {
    let targetUpdated: Tenant | null = null;
    const updated = tenants.map(t => {
      if (t.id === tenantId) {
        targetUpdated = { ...t, name, ownerEmail };
        return targetUpdated;
      }
      return t;
    });
    setTenants(updated);
    saveStoredTenants(updated);
    if (currentTenant.id === tenantId) {
      setCurrentTenant({ ...currentTenant, name, ownerEmail });
    }
    if (targetUpdated) {
      void cloudTenants.save(targetUpdated).catch(() => {});
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
    setAccounts(prev => {
      // Check if this exact channel already exists in the same slot to prevent stale overwrites
      const existing = prev.find(a => 
        a.tenantId === currentTenant.id && 
        a.platform === accInput.platform && 
        a.slotNumber === accInput.slotNumber
      );
      let updated: SocialAccount[];
      let targetAcc: SocialAccount;

      if (existing) {
        targetAcc = { ...existing, ...accInput, lastSyncedAt: new Date().toISOString() };
        updated = prev.map(a => a.id === existing.id ? targetAcc : a);
      } else {
        targetAcc = {
          ...accInput,
          id: crypto.randomUUID(),
          tenantId: currentTenant.id,
          lastSyncedAt: new Date().toISOString()
        };
        updated = [targetAcc, ...prev];
      }

      saveStoredAccounts(updated);
      try {
        window.dispatchEvent(new CustomEvent('socialspree_accounts_updated', { detail: updated }));
      } catch { /* ignore */ }

      // Authoritative Supabase Cloud Sync
      void socialConnections.save(targetAcc).catch(err => console.warn('Supabase social connection write info:', err));

      return updated;
    });
  };

  const handleUpdateAccount = (accountId: string, updates: Partial<SocialAccount>) => {
    const updatedAccs = accounts.map(a => a.id === accountId ? { ...a, ...updates, lastSyncedAt: new Date().toISOString() } : a);
    setAccounts(updatedAccs);
    saveStoredAccounts(updatedAccs);
    try {
      window.dispatchEvent(new CustomEvent('socialspree_accounts_updated', { detail: updatedAccs }));
    } catch { /* ignore */ }

    // Authoritative Supabase Cloud Sync
    void socialConnections.update(accountId, updates).catch(err => console.warn('Supabase social connection update info:', err));
  };

  const handleDeleteAccount = (accountId: string) => {
    const updatedAccs = accounts.filter(a => a.id !== accountId);
    setAccounts(updatedAccs);
    saveStoredAccounts(updatedAccs);
    try {
      window.dispatchEvent(new CustomEvent('socialspree_accounts_updated', { detail: updatedAccs }));
    } catch { /* ignore */ }

    // Authoritative Supabase Cloud Sync
    void socialConnections.remove(accountId).catch(err => console.warn('Supabase social connection delete info:', err));
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

  const handleRetryPublish = async (log: PostLog) => {
    const post = posts.find(p => p.id === log.postId);
    if (!post) {
      const retryLog: PostLog = {
        ...log,
        id: crypto.randomUUID(),
        httpStatus: 404,
        responsePayload: { error: 'Original post not found for retry' },
        createdAt: new Date().toISOString()
      };
      setLogs([retryLog, ...logs]);
      return;
    }

    try {
      const targetTenant = tenants.find(t => t.id === log.tenantId) || currentTenant;
      const { post: updatedPost, log: retryLog } = await executePublishing(post, targetTenant);
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
      setLogs([retryLog, ...logs]);
    } catch (err: any) {
      const failedLog: PostLog = {
        ...log,
        id: crypto.randomUUID(),
        httpStatus: 500,
        responsePayload: { error: err?.message || 'Publishing retry failed' },
        createdAt: new Date().toISOString()
      };
      setLogs([failedLog, ...logs]);
    }
  };

  // Top Priority: If in Password Recovery flow (hash or set_password route), immediately render SetNewPasswordView
  if (checkIsRecoveryUrl() || authMode === 'set_password') {
    return (
      <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#090D16] font-['Inter'] text-[#0B1C30] dark:text-slate-100 transition-colors duration-150 flex items-center justify-center p-4">
        <SetNewPasswordView
          onSuccess={() => {
            try { sessionStorage.removeItem('spree_recovery_active'); } catch { /* ignore */ }
            setCloudError('');
            setAuthMode('signin');
            setViewMode('auth');
            navigate('/login');
          }}
          onCancel={() => {
            try { sessionStorage.removeItem('spree_recovery_active'); } catch { /* ignore */ }
            setCloudError('');
            setViewMode('public');
            navigate('/');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#090D16] font-['Inter'] text-[#0B1C30] dark:text-slate-100 transition-colors duration-150">
      {viewMode === 'auth' ? (
        cloudLoading ? (
          <div className="min-h-screen flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">Loading secure workspace…</div>
        ) : (
          <div>
            {cloudError && <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300 shadow">{cloudError}</div>}
            <AuthView
              initialMode={authMode === 'signup' ? 'signup' : authMode === 'forgot' ? 'forgot' : 'signin'}
              onCancel={() => { setCloudError(''); setViewMode('public'); navigate('/'); }}
              onAuthSuccess={() => {
                setCloudError('');
                void loadAuthenticatedWorkspace();
              }}
            />
          </div>
        )
      ) : viewMode === 'public' ? (
        /* Public Marketing Pages — React Router */
        <div className="min-h-screen flex flex-col bg-[#F8FAFF] dark:bg-[#090D16] text-[#0B1C30] dark:text-slate-100 transition-colors duration-150">
          <PublicNavbar
            onLaunchApp={handleLaunchApp}
            onOpenCheckout={(planId) => handleOpenCheckout(planId)}
          />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={
                <LandingHero
                  onNavigate={(view) => navigate(`/${view === 'landing' ? '' : view}`)}
                  onLaunchApp={handleLaunchApp}
                  onOpenCheckout={(planId, cycle, curr, sym) => handleOpenCheckout(planId, cycle, curr, sym)}
                  plans={getStoredPlans()}
                />
              } />
              <Route path="/pricing" element={
                <PricingView
                  plans={getStoredPlans()}
                  onOpenCheckout={(planId, cycle, curr, sym) => handleOpenCheckout(planId, cycle, curr, sym)}
                />
              } />
              <Route path="/features" element={
                <FeaturesView
                  onOpenCheckout={(planId) => handleOpenCheckout(planId)}
                  onLaunchApp={handleLaunchApp}
                />
              } />
              <Route path="/testimonials" element={<TestimonialsView />} />
              <Route path="/about" element={<AboutContactView />} />
              <Route path="/checkout" element={
                <CheckoutPage
                  selectedPlan={selectedPlanForCheckout || (getStoredPlans().find(p => p.isPopular) || getStoredPlans()[0])}
                  billingCycle={checkoutBillingCycle}
                  selectedCurrency={checkoutCurrency}
                  currencySymbol={checkoutCurrencySymbol}
                  onLaunchApp={handleLaunchApp}
                />
              } />
              <Route path="/cart" element={
                <CheckoutPage
                  selectedPlan={selectedPlanForCheckout || (getStoredPlans().find(p => p.isPopular) || getStoredPlans()[0])}
                  billingCycle={checkoutBillingCycle}
                  selectedCurrency={checkoutCurrency}
                  currencySymbol={checkoutCurrencySymbol}
                  onLaunchApp={handleLaunchApp}
                />
              } />
              <Route path="/reset" element={<SetNewPasswordView onCancel={() => { setCloudError(''); setViewMode('public'); navigate('/'); }} />} />
              <Route path="/reset-password" element={<SetNewPasswordView onCancel={() => { setCloudError(''); setViewMode('public'); navigate('/'); }} />} />
              <Route path="/set-password" element={<SetNewPasswordView onCancel={() => { setCloudError(''); setViewMode('public'); navigate('/'); }} />} />
            </Routes>
          </main>

          <PublicFooter
            onLaunchApp={handleLaunchApp}
          />
        </div>
      ) : viewMode === 'app' ? (
        /* SaaS Dashboard Application View Mode */
        <div className="min-h-screen flex bg-[#F8FAFF] dark:bg-[#090D16] text-[#0B1C30] dark:text-slate-100 transition-colors duration-150">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleSelectTab}
            isSuperAdmin={isSuperAdminMode}
            isAgencyMode={systemSettings.agencyModeEnabled || currentTenant.tierPlan === 'agency'}
            isInfluencerMode={systemSettings.influencerModeEnabled || currentTenant.tierPlan === 'pro'}
            activeAdminSubTab={adminSubTab}
            onSelectAdminSubTab={setAdminSubTab}
            onReturnToPublic={() => { setViewMode('public'); navigate('/'); }}
            onSignOut={handleSignOut}
            userFullName={profile?.fullName || supabaseUser?.user_metadata?.full_name || undefined}
            userEmail={supabaseUser?.email || profile?.email || undefined}
            userRole={profile?.role || undefined}
            avatarUrl={profile?.avatarUrl || supabaseUser?.user_metadata?.avatar_url || undefined}
            aiCreditsEnabled={systemSettings.aiCreditsEnabled ?? false}
            automationAiEnabled={systemSettings.automationAiEnabled ?? false}
          />

          <div className="flex-1 flex flex-col md:ml-[260px] min-w-0">
            <SuperAdminBanner
              isSuperAdminMode={isSuperAdminMode}
              onToggleSuperAdmin={handleToggleSuperAdmin}
              userEmail={supabaseUser?.email || profile?.email || SUPER_ADMIN_EMAIL}
            />
            <SystemModeBanner />
            <Header
              tenants={tenants}
              currentTenant={currentTenant}
              onSelectTenant={setCurrentTenant}
              isSuperAdminMode={isSuperAdminMode}
              onToggleSuperAdmin={handleToggleSuperAdmin}
              pageTitle={getPageTitle(activeTab)}
              onReturnToPublic={() => { setViewMode('public'); navigate('/'); }}
              onSignOut={handleSignOut}
              userEmail={supabaseUser?.email || profile?.email || SUPER_ADMIN_EMAIL}
              userProfile={profile ? { ...profile, fullName: profile.fullName || supabaseUser?.user_metadata?.full_name } : null}
              onOpenUserProfile={() => setActiveTab('settings')}
              isAgencyMode={systemSettings.agencyModeEnabled || currentTenant.tierPlan === 'agency'}
              brands={brands}
              activeBrand={activeBrand}
              onSelectBrand={setActiveBrand}
              onOpenBrandManager={() => setActiveTab('agency_brands')}
              onOpenVoiceAssistant={systemSettings.voiceAssistantEnabled ? () => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', altKey: true }));
              } : undefined}
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
                  tenantId={currentTenant.id}
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

              {/* {activeTab === 'grid_planner' && (
                <InstagramGridPlanner
                  mediaAssets={mediaAssets}
                  posts={posts}
                  onScheduleFromGrid={() => setActiveTab('composer')}
                />
              )} */}

              {activeTab === 'composer' && (
                <PostComposer
                  key={currentTenant.id}
                  tenant={currentTenant}
                  accounts={accounts.filter(a => a.tenantId === currentTenant.id)}
                  aiLogs={aiLogs.filter(l => l.tenantId === currentTenant.id)}
                  aiCreditsEnabled={systemSettings.aiCreditsEnabled ?? false}
                  onDeductAiCredits={(amount, desc) => handleDeductAiCredits(currentTenant.id, amount, desc)}
                  onPostPublished={handlePostPublished}
                  onUpdateTenantCloudinary={handleUpdateTenantCloudinary}
                  onNavigateToCalendar={() => setActiveTab('calendar')}
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
                (systemSettings.automationAiEnabled || isSuperAdminMode) ? (
                  <AutoResponderView
                    key={currentTenant.id}
                    tenant={currentTenant}
                    accounts={accounts}
                    mediaAssets={mediaAssets.filter(m => m.tenantId === currentTenant.id)}
                  />
                ) : (
                  <div className="max-w-xl mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-xs space-y-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                      <MessageSquareCode className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Automation & AI Module Offline</h3>
                    <p className="text-sm text-slate-500">
                      The Automation & Auto-Responder module is currently turned off for this workspace by the system administrator.
                    </p>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="px-4 py-2 bg-[#5D3FD3] text-white font-bold rounded-xl text-xs hover:bg-[#4D32B8] transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )
              )}

              {activeTab === 'connections' && (
                <SocialConnectionsView
                  tenant={currentTenant}
                  accounts={accounts}
                  userProfile={profile}
                  onAddAccount={handleAddAccount}
                  onUpdateAccount={handleUpdateAccount}
                  onDeleteAccount={handleDeleteAccount}
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
                  onReturnToDashboard={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  tenant={currentTenant}
                  posts={posts}
                  accounts={accounts}
                />
              )}

              {(activeTab === 'superadmin' || (activeTab === 'admin' && (profile?.isSuperAdmin || isSuperAdminMode))) && (
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
                  onUpdateSystemSettings={handleUpdateSystemSettings}
                  activeSubTab={adminSubTab}
                  onSelectSubTab={setAdminSubTab}
                  onReturnToWorkspace={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  tenant={currentTenant}
                  userProfile={profile}
                  onUpdateUserProfile={(updated) => {
                    setProfile(updated);
                    try {
                      localStorage.setItem('socialspree_user_profile_v1', JSON.stringify(updated));
                    } catch { /* ignore */ }
                  }}
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

            {/* Voice AI Assistant Overlay & Floating Widget with Alt+V shortcut */}
            {systemSettings.voiceAssistantEnabled && (
              <VoiceAssistantOverlay
                activeTab={activeTab}
                onNavigateTab={handleSelectTab}
                tenantName={currentTenant.name}
                aiCredits={currentTenant.aiCredits ?? 1000}
                accountsCount={accounts.filter(a => a.tenantId === currentTenant.id).length}
                postsCount={posts.filter(p => p.tenantId === currentTenant.id).length}
                onInsertTextIntoComposer={(_text) => {
                  setActiveTab('composer');
                }}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
