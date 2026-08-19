import React, { useState, useEffect } from 'react';
import { MediaAsset, Post } from '../../types';
import { 
  Grid, 
  Instagram, 
  Sparkles, 
  Layers, 
  Move, 
  Plus, 
  Tag, 
  Eye, 
  Upload, 
  Share2, 
  CheckCircle2,
  Bookmark,
  Heart,
  MessageCircle,
  Play
} from 'lucide-react';

interface InstagramGridPlannerProps {
  mediaAssets: MediaAsset[];
  posts: Post[];
  onScheduleFromGrid?: (mediaUrl: string) => void;
}

export const InstagramGridPlanner: React.FC<InstagramGridPlannerProps> = ({
  mediaAssets,
  posts,
  onScheduleFromGrid
}) => {
  const [gridItems, setGridItems] = useState<MediaAsset[]>(() => {
    // Initial feed grid preview combining existing images/videos
    return mediaAssets.slice(0, 12);
  });

  useEffect(() => {
    if (mediaAssets.length > 0) {
      setGridItems(mediaAssets.slice(0, 12));
    }
  }, [mediaAssets]);

  const [activeTab, setActiveTab] = useState<'grid' | 'reels' | 'saved'>('grid');
  const [selectedItem, setSelectedItem] = useState<MediaAsset | null>(null);

  // Move grid item position left/right
  const handleMoveItem = (index: number, direction: 'left' | 'right') => {
    const nextGrid = [...gridItems];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextGrid.length) return;

    const temp = nextGrid[index];
    nextGrid[index] = nextGrid[targetIndex];
    nextGrid[targetIndex] = temp;
    setGridItems(nextGrid);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-700 to-indigo-900 text-white p-6 rounded-2xl border border-purple-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
            <Instagram className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Instagram & TikTok Feed Aesthetic Planner</h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                INFLUENCER / CREATOR SUITE
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              Visual 3-column feed simulator. Drag and re-arrange your grid aesthetics, preview reel covers, and schedule posts directly to your queue.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
            {gridItems.length} Feed Grid Posts
          </span>
        </div>
      </div>

      {/* Grid Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Instagram Profile Preview Phone Mockup */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Mock Profile Header */}
          <div className="space-y-4 border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                    CR
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <span>creator_aesthetic_pro</span>
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                    <span><strong>{gridItems.length}</strong> posts</span>
                    <span><strong>42.8K</strong> followers</span>
                    <span><strong>812</strong> following</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    ✨ Digital Creator & Lifestyle Influencer | Daily Aesthetic Feed 📸
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-Tabs: Feed Grid vs Reels */}
            <div className="flex items-center justify-center border-t border-slate-100 pt-3 gap-12 text-xs font-bold text-slate-500">
              <button
                onClick={() => setActiveTab('grid')}
                className={`flex items-center gap-1.5 pb-2 transition-all border-b-2 ${
                  activeTab === 'grid' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>POSTS GRID</span>
              </button>
              <button
                onClick={() => setActiveTab('reels')}
                className={`flex items-center gap-1.5 pb-2 transition-all border-b-2 ${
                  activeTab === 'reels' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>REELS PREVIEW</span>
              </button>
            </div>
          </div>

          {/* 3-Column Instagram Feed Grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {gridItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-2xs transition-all hover:ring-2 hover:ring-purple-500 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {item.type === 'video' ? (
                  <div className="relative w-full h-full">
                    <video src={item.url} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-slate-950/70 text-white p-1 rounded-full">
                      <Play className="w-3 h-3 fill-white" />
                    </div>
                  </div>
                ) : (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                )}

                {/* Grid Item Hover Actions Overlay */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="font-mono bg-purple-600 px-1.5 py-0.5 rounded font-bold">
                      #{index + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'left'); }}
                          className="p-1 bg-white/20 hover:bg-white/40 rounded"
                          title="Move Left"
                        >
                          ◀
                        </button>
                      )}
                      {index < gridItems.length - 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveItem(index, 'right'); }}
                          className="p-1 bg-white/20 hover:bg-white/40 rounded"
                          title="Move Right"
                        >
                          ▶
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 font-bold text-xs">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-white" /> 1.4k</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 fill-white" /> 84</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onScheduleFromGrid) onScheduleFromGrid(item.url);
                    }}
                    className="w-full py-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded text-center font-bold text-[10px]"
                  >
                    Schedule Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Influencer Media Vault & Content Tagging Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Sponsorship & Media Vault Selector</span>
            </h3>
            <p className="text-xs text-slate-500">Tap any media asset to insert into your grid planner feed</p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">Available Media Vault Assets</div>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setGridItems(prev => [asset, ...prev])}
                  className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 hover:border-purple-500 cursor-pointer transition-all"
                >
                  <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    + Add to Feed Grid
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Item Detail */}
          {selectedItem && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Selected Grid Item</span>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>
              <div className="flex items-center gap-3">
                <img src={selectedItem.url} className="w-12 h-12 rounded-lg object-cover border" />
                <div className="truncate">
                  <div className="font-bold text-slate-900 truncate">{selectedItem.title}</div>
                  <div className="text-[10px] text-purple-700 font-mono">Format: {selectedItem.type.toUpperCase()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
