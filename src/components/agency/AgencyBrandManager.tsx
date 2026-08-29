import React, { useState } from 'react';
import { AgencyBrand, SocialAccount, Post, MediaAsset } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  Share2, 
  Briefcase, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface AgencyBrandManagerProps {
  tenantId?: string;
  brands: AgencyBrand[];
  activeBrand: AgencyBrand | null;
  onSelectBrand: (brand: AgencyBrand | null) => void;
  onAddBrand: (brand: Omit<AgencyBrand, 'id' | 'createdAt'>) => void;
  onDeleteBrand: (brandId: string) => void;
  accounts: SocialAccount[];
  posts: Post[];
  mediaAssets: MediaAsset[];
}

export const AgencyBrandManager: React.FC<AgencyBrandManagerProps> = ({
  tenantId,
  brands,
  activeBrand,
  onSelectBrand,
  onAddBrand,
  onDeleteBrand,
  accounts,
  posts,
  mediaAssets
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [brandNameInput, setBrandNameInput] = useState('');
  const [industryInput, setIndustryInput] = useState('E-commerce & Retail');
  const [logoUrlInput, setLogoUrlInput] = useState('');

  const filteredBrands = brands
    .filter(b => !b.agencyTenantId || b.agencyTenantId === tenantId)
    .filter(b => 
      b.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.industry && b.industry.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const handleCreateBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandNameInput.trim()) return;

    onAddBrand({
      agencyTenantId: tenantId || '00000000-0000-0000-0000-000000000001',
      brandName: brandNameInput.trim(),
      industry: industryInput.trim(),
      logoUrl: logoUrlInput.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      connectedAccountIds: []
    });

    setBrandNameInput('');
    setLogoUrlInput('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-6 rounded-2xl border border-purple-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-900/40">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Agency Multi-Brand Management Suite</h2>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-500/30">
                AGENCY WORKSPACE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Manage multiple client businesses, isolate social accounts, brand media vaults, post schedules, and analytics per brand.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Client Brand / Business</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Total Client Brands</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{brands.length} Active Brands</div>
          </div>
          <Briefcase className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-20" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Active Selected Workspace</div>
            <div className="text-sm font-bold text-purple-900 dark:text-purple-300 mt-1 truncate max-w-[180px]">
              {activeBrand ? activeBrand.brandName : 'All Agency Brands'}
            </div>
          </div>
          <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Total Connected Channels</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{accounts.length} Channels</div>
          </div>
          <Share2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 opacity-20" />
        </div>
      </div>

      {/* Brands Grid & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Client Brand Portfolio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Switch workspace context to view or post for a specific brand</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search brands or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs w-64 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={() => onSelectBrand(null)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeBrand === null
                  ? 'bg-slate-900 dark:bg-purple-600 text-white border-slate-900 dark:border-purple-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              All Brands View
            </button>
          </div>
        </div>

        {/* Brands Grid */}
        {filteredBrands.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Client Brands Provisioned Yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create client brand profiles to organize multi-channel social connections, media assets, and scheduled campaigns into isolated workspaces.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision First Brand</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrands.map((brand) => {
              const isCurrentActive = activeBrand?.id === brand.id;
              return (
              <div
                key={brand.id}
                className={`rounded-2xl border transition-all p-5 space-y-4 flex flex-col justify-between ${
                  isCurrentActive
                    ? 'border-purple-500 dark:border-purple-400 bg-purple-50/40 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={brand.logoUrl}
                        alt={brand.brandName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          <span>{brand.brandName}</span>
                          {isCurrentActive && (
                            <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          )}
                        </h4>
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                          {brand.industry || 'General Business'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteBrand(brand.id)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                      title="Archive / Remove Brand"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-750">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {accounts.filter(a => brand.connectedAccountIds.includes(a.id) || brand.connectedAccountIds.includes(a.channelAccountId)).length || brand.connectedAccountIds.length}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Accounts</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-750">
                      <div className="font-bold text-purple-900 dark:text-purple-300">{posts.length}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Posts</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-750">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300">{mediaAssets.length}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Media</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectBrand(brand)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600'
                    }`}
                  >
                    <span>{isCurrentActive ? 'Active Workspace' : 'Switch to Brand Workspace'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* PROVISION BRAND MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Provision Client Brand</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateBrandSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand / Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starbucks Coffee Co."
                  value={brandNameInput}
                  onChange={(e) => setBrandNameInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry Category</label>
                <select
                  value={industryInput}
                  onChange={(e) => setIndustryInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold"
                >
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Apparel & Fashion">Apparel & Fashion</option>
                  <option value="Technology & SaaS">Technology & SaaS</option>
                  <option value="E-commerce & Retail">E-commerce & Retail</option>
                  <option value="Real Estate & Hospitality">Real Estate & Hospitality</option>
                  <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand Logo / Avatar URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md cursor-pointer">
                  Provision Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
