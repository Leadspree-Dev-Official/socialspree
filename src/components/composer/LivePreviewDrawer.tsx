import React, { useState } from 'react';
import { SocialPlatform } from '../../types';
import { 
  Instagram, 
  Linkedin, 
  Youtube, 
  Facebook, 
  Store, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  Wifi, 
  Battery, 
  Signal,
  ThumbsUp,
  Repeat,
  Share2,
  Play,
  Globe,
  MessageSquare
} from 'lucide-react';

interface LivePreviewDrawerProps {
  selectedPlatforms: SocialPlatform[];
  content: string;
  mediaUrls: string[];
  mediaType: 'none' | 'image' | 'video';
  tenantName: string;
}

type PreviewPlatform = 'instagram' | 'linkedin' | 'youtube' | 'facebook' | 'google_business';

export const LivePreviewDrawer: React.FC<LivePreviewDrawerProps> = ({
  selectedPlatforms,
  content,
  mediaUrls,
  mediaType,
  tenantName
}) => {
  // Always default to Instagram as requested
  const [activePlatform, setActivePlatform] = useState<PreviewPlatform>('instagram');

  const platformTabs: { id: PreviewPlatform; label: string; icon: any }[] = [
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'google_business', label: 'Google', icon: Store }
  ];

  const hasMedia = mediaUrls.length > 0 && mediaUrls[0].trim().length > 0;
  const currentMediaUrl = hasMedia ? mediaUrls[0] : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs font-['Inter'] space-y-4">
      {/* Top Header & Platform Selector Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs uppercase font-mono tracking-wider">
            iPhone Device Live Preview
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#5D3FD3] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Instagram Default
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {platformTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activePlatform === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePlatform(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#5D3FD3] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Authentic iPhone 16 Pro Smartphone Hardware Mockup Container */}
      <div className="mx-auto max-w-[310px] relative select-none">
        
        {/* Left Side Volume Rocker Buttons */}
        <div className="absolute -left-[5px] top-20 w-[5px] h-8 bg-slate-700 rounded-l-md border-l border-slate-600" />
        <div className="absolute -left-[5px] top-32 w-[5px] h-12 bg-slate-700 rounded-l-md border-l border-slate-600" />
        <div className="absolute -left-[5px] top-48 w-[5px] h-12 bg-slate-700 rounded-l-md border-l border-slate-600" />
        
        {/* Right Side Power Button */}
        <div className="absolute -right-[5px] top-28 w-[5px] h-14 bg-slate-700 rounded-r-md border-r border-slate-600" />

        {/* iPhone Chassis Outer Shell */}
        <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-[48px] p-2 shadow-2xl border-2 border-slate-700/80">
          
          {/* Inner Screen Viewport Container */}
          <div className="bg-white rounded-[40px] overflow-hidden text-slate-900 min-h-[460px] flex flex-col justify-between border border-slate-200 relative">
            
            {/* iPhone Top Status Bar & Dynamic Island */}
            <div className="bg-slate-950 text-white px-5 pt-2.5 pb-1 flex items-center justify-between z-20">
              <span className="text-[10px] font-bold font-mono tracking-tight">9:41</span>
              
              {/* Dynamic Island Camera Notch */}
              <div className="w-20 h-4 bg-black rounded-full shadow-inner flex items-center justify-end px-1.5 gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5 fill-white" />
              </div>
            </div>

            {/* INSTAGRAM PREVIEW DEFAULT */}
            {activePlatform === 'instagram' && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* IG Top App Bar */}
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                        <img 
                          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80" 
                          alt="avatar" 
                          className="w-full h-full rounded-full object-cover border border-white"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-none text-slate-900">{tenantName.split(' ')[0] || 'Brand'}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Sponsored</div>
                      </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Post Media Preview */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {mediaType === 'video' ? (
                      <div className="w-full h-full relative">
                        <img src={currentMediaUrl} alt="video preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white opacity-80" />
                        </div>
                      </div>
                    ) : (
                      <img src={currentMediaUrl} alt="post preview" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Actions & Caption */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-slate-700 hover:text-red-500 cursor-pointer" />
                        <MessageCircle className="w-4 h-4 text-slate-700" />
                        <Send className="w-4 h-4 text-slate-700" />
                      </div>
                      <Bookmark className="w-4 h-4 text-slate-700" />
                    </div>

                    <div className="text-[11px] font-bold text-slate-900">1,248 likes</div>

                    <div className="text-[11px] leading-relaxed text-slate-800 line-clamp-3">
                      <span className="font-bold mr-1">{tenantName.split(' ')[0].toLowerCase() || 'brand'}</span>
                      {content || 'Your caption will appear here in real time as you compose...'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LINKEDIN PREVIEW */}
            {activePlatform === 'linkedin' && (
              <div className="p-3 space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    IN
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{tenantName}</div>
                    <div className="text-[9px] text-slate-500">10,482 followers · 1h</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {content || 'Post content will be rendered here...'}
                </div>

                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  <img src={currentMediaUrl} alt="media" className="w-full h-full object-cover" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-600 text-[10px] font-semibold">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-blue-600" /> Like</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comment</span>
                  <span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> Repost</span>
                  <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Send</span>
                </div>
              </div>
            )}

            {/* YOUTUBE PREVIEW */}
            {activePlatform === 'youtube' && (
              <div className="space-y-2 flex-1">
                <div className="aspect-video bg-slate-900 relative">
                  <img src={currentMediaUrl} alt="youtube thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                    0:59
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="font-bold text-xs text-slate-900 line-clamp-2">
                    {content.split('\n')[0] || 'Shorts Title & Video Post Content'}
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                    <span>{tenantName}</span>
                    <span>· 42K views</span>
                    <span>· 2h ago</span>
                  </div>
                </div>
              </div>
            )}

            {/* FACEBOOK PREVIEW */}
            {activePlatform === 'facebook' && (
              <div className="p-3 space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
                    FB
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{tenantName}</div>
                    <div className="text-[9px] text-slate-500 flex items-center gap-1">
                      <span>Just now</span> · <Globe className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-800 leading-relaxed line-clamp-3">
                  {content || 'Facebook post text caption...'}
                </div>

                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  <img src={currentMediaUrl} alt="media" className="w-full h-full object-cover" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-600 text-[10px] font-semibold">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-blue-600" /> Like</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comment</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> Share</span>
                </div>
              </div>
            )}

            {/* GOOGLE BUSINESS PREVIEW */}
            {activePlatform === 'google_business' && (
              <div className="p-3 space-y-2.5 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    G
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{tenantName}</div>
                    <div className="text-[9px] text-emerald-700 font-semibold">Google Business Profile</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-800 leading-relaxed line-clamp-3">
                  {content || 'Update content will be displayed on your Google Business Listing...'}
                </div>

                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  <img src={currentMediaUrl} alt="media" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* iOS Home Indicator Bar */}
            <div className="py-2 bg-white flex justify-center">
              <div className="w-28 h-1 bg-slate-900/80 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
