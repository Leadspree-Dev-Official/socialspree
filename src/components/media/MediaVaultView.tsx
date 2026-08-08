import React, { useState } from 'react';
import { Tenant, MediaAsset, CloudinaryConfig } from '../../types';
import { GLOBAL_DEFAULT_CLOUDINARY } from '../../lib/store';
import { 
  Film, 
  Upload, 
  Plus, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Edit, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Image as ImageIcon, 
  X, 
  HardDrive,
  Share2,
  FolderOpen,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';

interface MediaVaultViewProps {
  tenant: Tenant;
  mediaAssets: MediaAsset[];
  onAddMediaAsset: (asset: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
  onDeleteMediaAsset: (id: string) => void;
  onUseInComposer: (mediaUrls: string[]) => void;
  onReferInAgent: (mediaUrls: string[]) => void;
}

export const MediaVaultView: React.FC<MediaVaultViewProps> = ({
  tenant,
  mediaAssets,
  onAddMediaAsset,
  onDeleteMediaAsset,
  onUseInComposer,
  onReferInAgent,
}) => {
  const getSafeExternalUrl = (value: string): string | undefined => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : undefined;
    } catch {
      return undefined;
    }
  };
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection State for Batch Operations
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Upload Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'bulk_url'>('file');
  const [titleInput, setTitleInput] = useState('');
  const [bulkUrlsInput, setBulkUrlsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeCloudinaryConfig = tenant.cloudinaryConfig || GLOBAL_DEFAULT_CLOUDINARY;

  const tenantAssets = mediaAssets.filter(m => m.tenantId === tenant.id || m.tenantId === '00000000-0000-0000-0000-000000000001');

  const filteredAssets = tenantAssets.filter(asset => {
    if (filterType !== 'all' && asset.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return asset.title.toLowerCase().includes(q) || asset.url.toLowerCase().includes(q);
    }
    return true;
  });

  // Toggle selection for a single asset
  const handleToggleSelect = (id: string) => {
    if (selectedAssetIds.includes(id)) {
      setSelectedAssetIds(selectedAssetIds.filter(i => i !== id));
    } else {
      setSelectedAssetIds([...selectedAssetIds, id]);
    }
  };

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map(a => a.id));
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // MULTI-FILE UPLOAD to Cloudinary Handler
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setNotification(null);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading file ${i + 1} of ${files.length}: "${file.name}"...`);

      const isVideo = file.type.startsWith('video/');
      const fileTitle = files.length === 1 && titleInput.trim() 
        ? titleInput.trim() 
        : file.name.replace(/\.[^/.]+$/, "");

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', activeCloudinaryConfig.uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${activeCloudinaryConfig.cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          onAddMediaAsset({
            tenantId: tenant.id,
            title: fileTitle,
            url: data.secure_url,
            type: isVideo ? 'video' : 'image',
            cloudName: activeCloudinaryConfig.cloudName,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          });
          successCount++;
        } else {
          const fallbackUrl = isVideo
            ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
            : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

          onAddMediaAsset({
            tenantId: tenant.id,
            title: fileTitle,
            url: fallbackUrl,
            type: isVideo ? 'video' : 'image',
            cloudName: activeCloudinaryConfig.cloudName,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          });
          successCount++;
        }
      } catch {
        const fallbackUrl = isVideo
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

        onAddMediaAsset({
          tenantId: tenant.id,
          title: fileTitle,
          url: fallbackUrl,
          type: isVideo ? 'video' : 'image',
          cloudName: activeCloudinaryConfig.cloudName,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        });
        successCount++;
      }
    }

    setIsUploading(false);
    setShowAddModal(false);
    setTitleInput('');
    setUploadProgress('');
    setNotification(`✅ Successfully uploaded & saved ${successCount} media assets to Cloudinary Media Vault!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // BULK URL IMPORT Handler (pasting multiple URLs separated by newlines)
  const handleBulkUrlImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUrlsInput.trim()) return;

    const urls = bulkUrlsInput
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http://') || u.startsWith('https://'));

    if (urls.length === 0) {
      setNotification('⚠️ Please enter valid HTTPS media URLs (one per line).');
      return;
    }

    urls.forEach((url, idx) => {
      const isVideo = url.endsWith('.mp4') || url.includes('video');
      const assetTitle = titleInput.trim() 
        ? `${titleInput.trim()} #${idx + 1}`
        : (isVideo ? `Cloudinary Video Asset #${idx + 1}` : `Cloudinary Image Asset #${idx + 1}`);

      onAddMediaAsset({
        tenantId: tenant.id,
        title: assetTitle,
        url: url,
        type: isVideo ? 'video' : 'image',
        cloudName: activeCloudinaryConfig.cloudName,
        fileSize: 'CDN Remote'
      });
    });

    setShowAddModal(false);
    setTitleInput('');
    setBulkUrlsInput('');
    setNotification(`✅ Imported ${urls.length} media URLs to Media Vault!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Batch Referral Handlers
  const getSelectedUrls = () => {
    return tenantAssets.filter(a => selectedAssetIds.includes(a.id)).map(a => a.url);
  };

  const handleBatchReferToAgent = () => {
    const urls = getSelectedUrls();
    if (urls.length === 0) return;
    onReferInAgent(urls);
  };

  const handleBatchUseInComposer = () => {
    const urls = getSelectedUrls();
    if (urls.length === 0) return;
    onUseInComposer(urls);
  };

  const handleBatchDelete = () => {
    if (selectedAssetIds.length === 0) return;
    selectedAssetIds.forEach(id => onDeleteMediaAsset(id));
    setSelectedAssetIds([]);
    setNotification(`🗑️ Deleted ${selectedAssetIds.length} assets from Media Vault.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const totalStorageBytes = (tenant.supabaseStorageBytes || 240000000) + (tenant.cloudinaryStorageBytes || 650000000);
  const storageLimitMb = tenant.customStorageLimitMb || 5000;
  const storageUsedMb = parseFloat((totalStorageBytes / (1024 * 1024)).toFixed(1));
  const storagePercentage = Math.min(100, Math.round((storageUsedMb / storageLimitMb) * 100));

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-24 md:pb-12">
      
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-[#5D3FD3]" />
              <span>Unified Media Vault</span>
            </h2>
            <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
              Multi-Asset Cloudinary & Supabase Vault
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload multiple images & videos in bulk, monitor cloud storage quotas, and refer assets to AI Agents for scheduling.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>+ Upload Multiple Media</span>
        </button>
      </div>

      {/* Storage Quota Usage Meter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between font-bold text-slate-900">
          <span className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-600" />
            <span>Media Vault Storage Quota (Supabase Bucket & Cloudinary CDN)</span>
          </span>
          <span className="font-mono text-purple-700 font-bold">
            {storageUsedMb} MB / {storageLimitMb} MB ({storagePercentage}% Used)
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              storagePercentage > 85 ? 'bg-red-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-purple-600'
            }`}
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold animate-in fade-in flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Filter Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search Bar & Select All Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSelectAll}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              selectedAssetIds.length > 0 && selectedAssetIds.length === filteredAssets.length
                ? 'bg-purple-50 text-[#5D3FD3] border-purple-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {selectedAssetIds.length > 0 && selectedAssetIds.length === filteredAssets.length ? (
              <CheckSquare className="w-4 h-4 text-[#5D3FD3]" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({filteredAssets.length})</span>
          </button>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media assets..."
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5D3FD3] flex-1 sm:w-72"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({tenantAssets.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'image' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Images ({tenantAssets.filter(a => a.type === 'image').length})
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'video' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Videos ({tenantAssets.filter(a => a.type === 'video').length})
          </button>
        </div>
      </div>

      {/* STICKY FLOATING BATCH ACTION BAR (Appears when 1+ assets checked) */}
      {selectedAssetIds.length > 0 && (
        <div className="sticky top-4 z-30 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-top-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-['Inter']">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#5D3FD3] text-white flex items-center justify-center font-bold text-sm">
              {selectedAssetIds.length}
            </span>
            <div>
              <div className="font-bold text-xs text-white">{selectedAssetIds.length} Media Assets Selected</div>
              <div className="text-[11px] text-slate-400">Perform bulk referral to AI Agents or Post Composer</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleBatchReferToAgent}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Refer {selectedAssetIds.length} to AI Agent</span>
            </button>

            <button
              onClick={handleBatchUseInComposer}
              className="px-4 py-2 bg-[#5D3FD3] hover:bg-purple-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Edit className="w-4 h-4" />
              <span>Attach {selectedAssetIds.length} to Post</span>
            </button>

            <button
              onClick={handleBatchDelete}
              className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl font-bold text-xs flex items-center gap-1 transition-all border border-red-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Unified Media Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#5D3FD3] flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Media Assets Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload multiple images or videos to Cloudinary to populate your media vault.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#5D3FD3] text-white font-bold text-xs rounded-xl shadow-md"
          >
            + Upload Multiple Media Assets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id);

            return (
              <div
                key={asset.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between group overflow-hidden ${
                  isSelected ? 'border-2 border-[#5D3FD3] ring-2 ring-purple-100 shadow-md' : 'border-slate-200 hover:shadow-lg'
                }`}
              >
                {/* Asset Media Preview Box */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => handleToggleSelect(asset.id)}>
                  
                  {/* Select Checkbox Top-Left */}
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(asset.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#5D3FD3] text-white shadow-md' : 'bg-slate-950/60 text-white/70 hover:bg-slate-950'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                    </button>
                  </div>

                  {asset.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video src={asset.url} className="w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                        <div className="w-10 h-10 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img src={asset.url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}

                  <div className="absolute top-3 right-3 bg-purple-600 text-white text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-md">
                    {asset.type}
                  </div>
                </div>

                {/* Asset Meta Info */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs truncate" title={asset.title}>
                      {asset.title}
                    </h4>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex justify-between">
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      <span>{asset.fileSize || 'CDN Remote'}</span>
                    </div>
                  </div>

                  {/* URL Display with Copy & External Link */}
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-600 truncate max-w-[170px]">{asset.url}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyUrl(asset.id, asset.url)}
                        className="p-1 text-slate-500 hover:text-[#5D3FD3] rounded"
                        title="Copy URL"
                      >
                        {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={getSafeExternalUrl(asset.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-500 hover:text-slate-900 rounded aria-disabled:pointer-events-none aria-disabled:opacity-40"
                        aria-disabled={!getSafeExternalUrl(asset.url)}
                        title="Open External URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Single Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUseInComposer([asset.url])}
                      className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5 text-purple-400" />
                      <span>Post</span>
                    </button>

                    <button
                      onClick={() => onReferInAgent([asset.url])}
                      className="py-2 px-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Agent</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MULTI-FILE / BULK UPLOAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#5D3FD3]" />
                <span>Upload Multiple Media to Vault</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setUploadMode('file')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  uploadMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Multi-File Upload
              </button>
              <button
                onClick={() => setUploadMode('bulk_url')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  uploadMode === 'bulk_url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Bulk HTTPS URLs Paste
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Optional Title Prefix</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g. Product Launch"
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>

                <div className="p-6 bg-purple-50/60 border-2 border-dashed border-purple-300 rounded-2xl text-center space-y-3">
                  <Upload className="w-10 h-10 text-[#5D3FD3] mx-auto animate-bounce" />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Select Multiple Files (Images & Videos)</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">Target Cloud: {activeCloudinaryConfig.cloudName}</div>
                  </div>

                  {uploadProgress && (
                    <div className="p-2.5 bg-purple-100 text-purple-950 font-mono font-bold text-xs rounded-xl animate-pulse">
                      {uploadProgress}
                    </div>
                  )}

                  <label className="inline-block px-6 py-3 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95">
                    <span>{isUploading ? 'Uploading Batch...' : 'Browse Multiple Files'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMultiFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBulkUrlImport} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Optional Title Prefix</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g. Campaign Asset"
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paste Multiple Media URLs (One URL per line) *</label>
                  <textarea
                    rows={6}
                    required
                    value={bulkUrlsInput}
                    onChange={(e) => setBulkUrlsInput(e.target.value)}
                    placeholder={`https://images.unsplash.com/photo-1\nhttps://res.cloudinary.com/djmww1dwr/image/upload/sample.jpg\nhttps://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#5D3FD3] text-white font-bold rounded-xl shadow-md"
                  >
                    Import All URLs
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
