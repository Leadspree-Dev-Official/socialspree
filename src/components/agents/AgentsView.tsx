import React, { useState, useRef, useEffect } from 'react';
import { Tenant, SocialAccount, Post, SocialPlatform, SelectedAccountRef, AiCreditLog } from '../../types';
import { executePublishing } from '../../lib/zernio';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Zap, 
  Coins, 
  X, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Youtube, 
  Twitter, 
  Store, 
  MessageSquare, 
  ArrowRight,
  RefreshCw,
  Trash2,
  ExternalLink,
  Plus
} from 'lucide-react';

interface AgentsViewProps {
  tenant: Tenant;
  accounts: SocialAccount[];
  aiLogs?: AiCreditLog[];
  prefilledMediaUrls?: string[];
  onDeductAiCredits?: (amount: number, description: string) => void;
  onPostPublished: (post: Post, log: any) => void;
  onNavigate: (tab: any) => void;
}

export interface ScheduledPostInfo {
  postId: string;
  content: string;
  channels: SocialPlatform[];
  scheduledFor: string;
  mediaUrls?: string[];
  status: 'booked' | 'cancelled';
  sequenceIndex?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  text: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video';
  scheduledPosts?: ScheduledPostInfo[];
  timestamp: string;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  tenant,
  accounts,
  aiLogs = [],
  prefilledMediaUrls = [],
  onDeductAiCredits,
  onPostPublished,
  onNavigate,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<'scheduler' | 'curator' | 'viral'>('scheduler');
  const [inputMessage, setInputMessage] = useState('');
  const [attachedMediaUrls, setAttachedMediaUrls] = useState<string[]>(prefilledMediaUrls);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video'>('image');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledMediaUrls && prefilledMediaUrls.length > 0) {
      setAttachedMediaUrls(prefilledMediaUrls);
      setNotification(`📎 Attached ${prefilledMediaUrls.length} media assets from Media Vault!`);
      setTimeout(() => setNotification(null), 3000);
    }
  }, [prefilledMediaUrls]);

  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);
  const currentAiCredits = tenant.aiCredits ?? 1000;

  // Initial Agent Welcome Conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'agent',
      agentName: 'SocialSpree AI Booking Agent',
      text: `Hello ${tenant.name}! 👋 I am your Autonomous AI Booking & Scheduling Agent.\n\nYou can chat with me or attach media files, and I will draft captions, pick the optimal social channels (${tenantAccounts.length} connected), and automatically book/schedule posts for you!`,
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle direct media file upload simulation
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingMedia(true);
    setTimeout(() => {
      const newUrls = files.map(file => 
        file.type.startsWith('video/')
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
      );

      setAttachedMediaUrls(prev => [...prev, ...newUrls]);
      setAttachedMediaType(files.some(f => f.type.startsWith('video/')) ? 'video' : 'image');
      setIsUploadingMedia(false);
      setNotification(`📎 ${files.length} Media assets attached!`);
      setTimeout(() => setNotification(null), 2500);
    }, 600);
  };

  const agentsList = [
    {
      id: 'scheduler',
      name: 'Auto-Booking & Schedule Agent',
      badge: 'POPULAR',
      icon: Calendar,
      color: 'bg-[#5D3FD3] text-white',
      description: 'Parses chat prompts & media to automatically generate captions and book scheduled posts.',
    },
    {
      id: 'curator',
      name: 'Visual Media Curator Agent',
      badge: 'CREATIVE',
      icon: ImageIcon,
      color: 'bg-[#0052FF] text-white',
      description: 'Recommends high-converting visual media, Cloudinary CDN presets, and channel branding.',
    },
    {
      id: 'viral',
      name: 'Viral Campaign Growth Agent',
      badge: 'ANALYTICS',
      icon: Zap,
      color: 'bg-emerald-600 text-white',
      description: 'Generates viral hook strategies and multi-channel posting timetables.',
    },
  ];

  const quickPrompts = [
    '📅 Schedule an Instagram & LinkedIn post for tomorrow at 10:00 AM with attached media',
    '🚀 Book a viral tech tip post across all channels for Friday 4:00 PM',
    '✨ Create a launch announcement post scheduled for next Monday',
  ];

  // Helper to format local date time as YYYY-MM-DDTHH:mm
  const formatLocalDateTime = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper to parse date and time from user chat text accurately
  const parseScheduleDateFromPrompt = (text: string): Date => {
    const now = new Date();
    let targetDate = new Date(now);
    const lower = text.toLowerCase();

    const monthsMap: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };

    let dateFound = false;

    // Check Day + Month or Month + Day e.g. "1 Aug", "1st August", "Aug 1", "August 1st"
    const dayMonthMatch = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
    const monthDayMatch = lower.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);

    if (dayMonthMatch) {
      const day = parseInt(dayMonthMatch[1], 10);
      const mStr = dayMonthMatch[2].toLowerCase();
      const mIdx = monthsMap[mStr] !== undefined ? monthsMap[mStr] : monthsMap[mStr.substring(0, 3)];
      let year = now.getFullYear();
      if (mIdx < now.getMonth() || (mIdx === now.getMonth() && day < now.getDate())) {
        year += 1;
      }
      targetDate = new Date(year, mIdx, day);
      dateFound = true;
    } else if (monthDayMatch) {
      const mStr = monthDayMatch[1].toLowerCase();
      const day = parseInt(monthDayMatch[2], 10);
      const mIdx = monthsMap[mStr] !== undefined ? monthsMap[mStr] : monthsMap[mStr.substring(0, 3)];
      let year = now.getFullYear();
      if (mIdx < now.getMonth() || (mIdx === now.getMonth() && day < now.getDate())) {
        year += 1;
      }
      targetDate = new Date(year, mIdx, day);
      dateFound = true;
    } else if (lower.includes('day after tomorrow')) {
      targetDate.setDate(now.getDate() + 2);
      dateFound = true;
    } else if (lower.includes('tomorrow')) {
      targetDate.setDate(now.getDate() + 1);
      dateFound = true;
    } else if (lower.includes('today')) {
      targetDate.setDate(now.getDate());
      dateFound = true;
    } else {
      const daysMatch = lower.match(/(?:in|after)\s+(\d+)\s+days?/);
      if (daysMatch) {
        const numDays = parseInt(daysMatch[1], 10);
        targetDate.setDate(now.getDate() + numDays);
        dateFound = true;
      } else {
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const foundDayIdx = weekdays.findIndex(w => lower.includes(w));
        if (foundDayIdx !== -1) {
          const currentDayIdx = now.getDay();
          let diff = foundDayIdx - currentDayIdx;
          if (diff <= 0) diff += 7;
          targetDate.setDate(now.getDate() + diff);
          dateFound = true;
        } else {
          const isoMatch = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
          if (isoMatch) {
            targetDate = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
            dateFound = true;
          }
        }
      }
    }

    if (!dateFound) {
      targetDate.setDate(now.getDate() + 1); // Default to tomorrow if not specified
    }

    // 2. Strict Time Parsing (Targeting explicit AM/PM or HH:MM)
    let hours = 9;
    let minutes = 0;

    const ampmMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    const colonTimeMatch = lower.match(/\b(\d{1,2}):(\d{2})\b/);

    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
      const ampm = ampmMatch[3].toLowerCase();

      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      if (h >= 0 && h <= 23) hours = h;
      if (m >= 0 && m <= 59) minutes = m;
    } else if (colonTimeMatch) {
      const h = parseInt(colonTimeMatch[1], 10);
      const m = parseInt(colonTimeMatch[2], 10);
      if (h >= 0 && h <= 23) hours = h;
      if (m >= 0 && m <= 59) minutes = m;
    }

    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate;
  };

  // Helper to detect requested duplication count
  const detectDuplicationCount = (text: string): number => {
    const lower = text.toLowerCase();
    const dupMatch = lower.match(/(?:duplicate|repeat|create|schedule)\s*(?:it|this|post)?\s*(?:for)?\s*(\d+)\s*(?:times|posts|days|slots)?/);
    if (dupMatch) {
      const count = parseInt(dupMatch[1], 10);
      if (count >= 1 && count <= 10) return count;
    }
    if (lower.includes('duplicate') || lower.includes('repeat')) {
      return 2;
    }
    return 1;
  };

  // Helper to detect if prompt is a question or inquiry (Assistant Mode)
  const checkIfQuestionOrInquiry = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    if (lower.endsWith('?')) return true;

    const questionPatterns = [
      'how to', 'how do i', 'how can i', 'how does', 'what is', 'what are',
      'why', 'explain', 'can you tell', 'help me', 'where do i', 'is it possible',
      'can i', 'should i', 'tell me about', 'guide'
    ];

    return questionPatterns.some(pattern => lower.startsWith(pattern) || lower.includes(pattern));
  };

  // Conversational Assistant Knowledge Base Response Generator
  const generateAssistantAnswer = (text: string): string => {
    const lower = text.toLowerCase();

    if (lower.includes('multiple') || lower.includes('bulk') || lower.includes('sequence') || lower.includes('batch')) {
      return `### 🚀 How to Schedule Multiple Posts at Once in SocialSpree

You have **3 fast ways** to schedule multiple posts at once:

1. **📁 Via Unified Media Vault (Recommended):**
   - Navigate to the **Media Vault** menu from the sidebar.
   - Check the boxes on multiple media assets (or click **Select All**).
   - Click the bottom floating action **\`Refer [X] to AI Agent\`**.
   - Type in chat: *"Schedule 3 posts for consecutive days starting tomorrow at 10 AM"*.

2. **🤖 Via AI Agent Chat:**
   - Attach your images/videos using the upload button below.
   - Type an explicit command like:
     - *"Duplicate this post 3 times for 10:00 AM"*
     - *"Schedule 4 posts for Friday, Saturday, Sunday, Monday"*

3. **📅 Via Interactive Light Calendar:**
   - Go to the **Calendar** tab from the main sidebar.
   - Switch between Day, Week, or Month grid views.
   - Click **\`+ Quick Schedule\`** on any calendar date cell to drop posts into specific slots!

💡 *Need me to schedule posts for you right now? Simply attach your media files or specify dates like "Schedule for Aug 1 at 9 AM"!*`;
    }

    if (lower.includes('media') || lower.includes('vault') || lower.includes('upload') || lower.includes('cloudinary')) {
      return `### 📁 Managing Media in SocialSpree

- **Multi-File Upload:** Go to **Media Vault** and click **\`+ Upload Multiple Media\`** to upload multiple images or videos directly to Cloudinary CDN.
- **Bulk URL Paste:** Paste multiple HTTPS CDN links (one per line) to import external media instantly.
- **Using Media:** Click **\`Use in Post\`** or **\`Refer in Agent\`** on any media card to attach it to your post composer or AI Chat prompt!`;
    }

    if (lower.includes('connect') || lower.includes('channel') || lower.includes('account') || lower.includes('instagram') || lower.includes('linkedin')) {
      return `### 🔗 Connecting Social Media Accounts

- Go to **Social Connections** in the left menu.
- Click **\`+ Connect Channel\`** for Instagram, LinkedIn, Facebook, YouTube, X (Twitter), or Google Business.
- Connected accounts are automatically available to your Post Composer and AI Booking Agents!`;
    }

    if (lower.includes('credit') || lower.includes('pricing') || lower.includes('plan')) {
      return `### 🪙 AI Credits & Billing Info

- Each AI Booking or Assistant interaction deducts **15 AI Credits**.
- You can check your remaining AI Credit balance in the top banner badge.
- If you run out of credits, contact your Super Admin to top up your balance!`;
    }

    return `Hello! 👋 I am your **SocialSpree Autonomous AI Assistant & Booking Agent**.

I can answer questions about the app, guide you through features, or automatically book and schedule posts for you.

- **To ask a question:** Just type your question (e.g. *"How do I connect Instagram?"* or *"How to schedule multiple posts?"*).
- **To book/schedule a post:** Attach your media and type a scheduling command (e.g. *"Schedule an Instagram post for tomorrow at 10 AM"* or *"Duplicate 3 times for Friday 4 PM"*).

How can I assist you today? 😊`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && attachedMediaUrls.length === 0) return;

    if (currentAiCredits < 15) {
      setNotification('⚠️ Insufficient AI Credits (Requires 15 Credits). Please contact Super Admin for top-up.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    const lower = text.toLowerCase();
    const isQuestion = checkIfQuestionOrInquiry(text) && attachedMediaUrls.length === 0;
    const isRescheduleCommand = lower.includes('change date') || lower.includes('change time') || lower.includes('reschedule') || lower.includes('update date') || lower.includes('update time') || lower.includes('move date') || lower.includes('move to');

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text || `Book post with ${attachedMediaUrls.length} attached media assets`,
      mediaUrls: attachedMediaUrls.length > 0 ? attachedMediaUrls : undefined,
      mediaType: attachedMediaType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    const currentMediaList = [...attachedMediaUrls];
    const currentType = attachedMediaType;
    setAttachedMediaUrls([]);
    setIsThinking(true);

    // Deduct 15 AI Credits
    if (onDeductAiCredits) {
      onDeductAiCredits(15, isQuestion ? `AI Assistant Chat: "${text.substring(0, 30)}..."` : `AI Agent Booking: "${text.substring(0, 30)}..."`);
    }

    // IF QUESTION / INQUIRY INTENT -> REPLY AS CONVERSATIONAL ASSISTANT (DO NOT BOOK A POST)
    if (isQuestion) {
      setTimeout(() => {
        const assistantReplyText = generateAssistantAnswer(text);
        const agentReply: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'agent',
          agentName: 'SocialSpree AI Assistant',
          text: assistantReplyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setIsThinking(false);
        setMessages(prev => [...prev, agentReply]);
      }, 900);
      return;
    }

    // Parse target date and duplication count
    const baseScheduleDate = parseScheduleDateFromPrompt(text);
    const postCount = isRescheduleCommand ? 1 : detectDuplicationCount(text);

    // Simulate Agent Thinking & Scheduling Execution
    setTimeout(async () => {
      const activeChannels: SocialPlatform[] = tenantAccounts.length > 0
        ? tenantAccounts.map(a => a.platform)
        : ['instagram', 'linkedin', 'facebook'];

      const targetAccountRefs: SelectedAccountRef[] = tenantAccounts.length > 0
        ? tenantAccounts.map(a => ({ platform: a.platform, accountId: a.channelAccountId }))
        : [{ platform: 'instagram', accountId: 'chn_inst_demo' }, { platform: 'linkedin', accountId: 'chn_li_demo' }];

      // Check if user is asking to RESCHEDULE a previous post
      const lastMsgWithPost = [...messages].reverse().find(m => m.scheduledPosts && m.scheduledPosts.length > 0);

      if (isRescheduleCommand && lastMsgWithPost && lastMsgWithPost.scheduledPosts) {
        const lastPostInfo = lastMsgWithPost.scheduledPosts[0];
        const newScheduledIso = formatLocalDateTime(baseScheduleDate);

        const updatedPost: Post = {
          id: lastPostInfo.postId,
          tenantId: tenant.id,
          content: lastPostInfo.content,
          mediaUrls: lastPostInfo.mediaUrls || ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'],
          mediaType: currentType,
          isCloudflareHosted: false,
          selectedAccountIds: targetAccountRefs,
          status: 'scheduled',
          scheduledFor: newScheduledIso,
          createdAt: new Date().toISOString()
        };

        try {
          const { post: pubPost, log } = await executePublishing(updatedPost, tenant);
          onPostPublished(pubPost, log);
        } catch (err) {
          console.error('Rescheduling post error:', err);
        }

        const rescheduledItem: ScheduledPostInfo = {
          ...lastPostInfo,
          scheduledFor: baseScheduleDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
          status: 'booked'
        };

        const agentReply: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'agent',
          agentName: 'SocialSpree AI Booking Agent',
          text: `I have updated your scheduled post's date & time to **${baseScheduleDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}**! 📅`,
          scheduledPosts: [rescheduledItem],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setIsThinking(false);
        setMessages(prev => [...prev, agentReply]);
        return;
      }

      const bookedPostsList: ScheduledPostInfo[] = [];

      for (let i = 0; i < postCount; i++) {
        const slotDate = new Date(baseScheduleDate);
        slotDate.setDate(slotDate.getDate() + i); // Shift duplicate posts by +1 day each
        const scheduledIso = formatLocalDateTime(slotDate);

        const suffix = postCount > 1 ? ` (Day ${i + 1} Sequence)` : '';
        const cleanTitle = text.replace(/change|date|time|reschedule|schedule|book|an|a|post|for|tomorrow|at|with|attached|this|media|duplicate|\d+\s*times/gi, '').trim();
        const generatedContent = cleanTitle.length > 3
          ? `🚀 ${cleanTitle}${suffix}\n\nAutomated via SocialSpree AI Agent. #Growth #Marketing`
          : `✨ Premium Campaign Post${suffix}\n\nAutomated via SocialSpree AI Agent. #SocialSpree #SaaS`;

        const postId = `post-agent-${Date.now()}-${i}`;
        const newPost: Post = {
          id: postId,
          tenantId: tenant.id,
          content: generatedContent,
          mediaUrls: currentMediaList.length > 0 ? currentMediaList : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'],
          mediaType: currentType,
          isCloudflareHosted: false,
          selectedAccountIds: targetAccountRefs,
          status: 'scheduled',
          scheduledFor: scheduledIso,
          createdAt: new Date().toISOString()
        };

        try {
          const { post: updatedPost, log } = await executePublishing(newPost, tenant);
          onPostPublished(updatedPost, log);
        } catch (err) {
          console.error('Agent booking execution:', err);
        }

        bookedPostsList.push({
          postId: postId,
          content: generatedContent,
          channels: activeChannels,
          scheduledFor: slotDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
          mediaUrls: currentMediaList.length > 0 ? currentMediaList : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'],
          status: 'booked',
          sequenceIndex: i + 1
        });
      }

      const agentReply: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'agent',
        agentName: 'SocialSpree AI Booking Agent',
        text: postCount > 1
          ? `I have parsed your request, set the date & time, and **successfully booked ${postCount} duplicated scheduled posts** across your requested timeline! 📅`
          : `I have parsed your request, set the date & time to **${baseScheduleDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}**, and **successfully booked/scheduled** your post! 📅`,
        scheduledPosts: bookedPostsList,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setIsThinking(false);
      setMessages(prev => [...prev, agentReply]);
    }, 1400);
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
      case 'linkedin': return <Linkedin className="w-3.5 h-3.5 text-blue-600" />;
      case 'facebook': return <Facebook className="w-3.5 h-3.5 text-blue-700" />;
      case 'youtube': return <Youtube className="w-3.5 h-3.5 text-red-600" />;
      case 'x': return <Twitter className="w-3.5 h-3.5 text-slate-900" />;
      case 'google_business': return <Store className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <Share2 className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl border border-purple-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] to-purple-400 text-white flex items-center justify-center font-black shadow-lg shadow-purple-900/50">
            <Bot className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">AI Booking & Scheduling Agents</h2>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full uppercase">
                AUTONOMOUS ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Book and schedule posts directly through AI chat prompts and media uploads.
            </p>
          </div>
        </div>

        {/* AI Credits Badge & Balance */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{currentAiCredits} AI Credits Available</span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs font-semibold animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Agent Selector (4 cols), Right Chat Console (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Agent Selector & Quick Prompts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Agent Selection Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500">
              Select Active AI Agent
            </h3>

            <div className="space-y-3">
              {agentsList.map(agent => {
                const Icon = agent.icon;
                const isSelected = selectedAgent === agent.id;

                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id as any)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#5D3FD3] bg-purple-50/50 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${agent.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{agent.name}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                          {agent.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        {agent.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Prompts Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested AI Prompts</span>
            </h3>

            <div className="space-y-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full p-3 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-200 rounded-xl text-xs text-slate-700 text-left transition-all font-medium flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#5D3FD3] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Agent Chat Console */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-[650px] overflow-hidden">
          
          {/* Chat Header Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5D3FD3] text-white flex items-center justify-center font-bold">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">SocialSpree Autonomous Agent</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">ONLINE</span>
                </div>
                <p className="text-[11px] text-slate-500">Connected to {tenantAccounts.length} Social Accounts & Cloud Dispatcher</p>
              </div>
            </div>

            <button
              onClick={() => setMessages(messages.length > 0 ? [messages[0]] : [])}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          </div>

          {/* Chat Messages Stream Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="w-8 h-8 rounded-xl bg-[#5D3FD3] text-white flex items-center justify-center font-bold shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4 text-amber-300" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* Text Bubble */}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#5D3FD3] text-white font-medium rounded-tr-none shadow-md'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                  }`}>
                    {msg.sender === 'agent' && (
                      <div className="text-[10px] font-mono font-bold text-[#5D3FD3] mb-1">
                        {msg.agentName || 'AI Agent'}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Attached User Media Preview */}
                    {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-400/30 rounded-lg overflow-hidden flex flex-wrap gap-2">
                        {msg.mediaUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Attached media"
                            className="max-h-36 max-w-[200px] object-cover rounded-lg border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Post Booking Cards (Generated by Agent) */}
                  {msg.scheduledPosts && msg.scheduledPosts.length > 0 && (
                    <div className="space-y-3 w-full">
                      {msg.scheduledPosts.map((postItem, idx) => (
                        <div key={postItem.postId} className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-md space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                            <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>POST #{postItem.sequenceIndex || (idx + 1)} BOOKED & SCHEDULED</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              {msg.scheduledPosts && msg.scheduledPosts.length > 1 ? `DUPLICATE #${idx + 1}` : 'AUTO-DISPATCH QUEUED'}
                            </span>
                          </div>

                          {/* Content Preview */}
                          <p className="text-xs text-slate-800 font-sans leading-relaxed">
                            {postItem.content}
                          </p>

                          {/* Media Preview if attached */}
                          {postItem.mediaUrls && postItem.mediaUrls.length > 0 && (
                            <div className="rounded-xl overflow-hidden flex flex-wrap gap-2 border border-slate-200 p-1 bg-slate-50">
                              {postItem.mediaUrls.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt="Booked Post Media"
                                  className="h-28 max-w-[180px] object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}

                          {/* Scheduled Details Footer */}
                          <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-slate-500">Scheduled Time:</span>
                              <span className="font-bold text-slate-900 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#5D3FD3]" />
                                {postItem.scheduledFor}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-mono">Target Channels:</span>
                              <div className="flex items-center gap-1.5">
                                {postItem.channels.map((ch, chIdx) => (
                                  <span key={chIdx} className="p-1 bg-white border rounded" title={ch}>
                                    {getPlatformIcon(ch)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Navigation Link to Calendar / Composer */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => onNavigate('calendar')}
                              className="py-2 bg-purple-50 hover:bg-purple-100 text-[#5D3FD3] border border-purple-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>View Calendar</span>
                            </button>
                            <button
                              onClick={() => onNavigate('composer')}
                              className="py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>View Composer</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`text-[10px] text-slate-400 font-mono ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking Spinner */}
            {isThinking && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#5D3FD3] text-white flex items-center justify-center font-bold animate-pulse">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none text-xs text-slate-500 font-medium flex items-center gap-2 shadow-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5D3FD3]" />
                  <span>Agent is analyzing chat prompt, drafting caption & booking scheduled post...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input & Media Attachment Controls */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            
            {/* Attached Media Chips List */}
            {attachedMediaUrls.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-purple-900 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#5D3FD3]" />
                    <span>{attachedMediaUrls.length} Media Assets Attached from Vault</span>
                  </span>
                  <button
                    onClick={() => setAttachedMediaUrls([])}
                    className="text-[11px] font-bold text-purple-700 hover:text-red-600"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pt-1">
                  {attachedMediaUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-white border border-purple-200 rounded-lg text-[11px] font-mono text-slate-800 shadow-2xs">
                      <span className="truncate max-w-[140px]">{url}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedMediaUrls(attachedMediaUrls.filter((_, i) => i !== idx))}
                        className="p-0.5 text-slate-400 hover:text-red-600 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Media File Upload Button */}
              <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors shrink-0" title="Attach Media Files">
                <Upload className="w-4 h-4 text-slate-600" />
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  disabled={isUploadingMedia}
                  className="hidden"
                />
              </label>

              {/* Text Input */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask AI agent to book or schedule a post (e.g. Schedule post for tomorrow 10 AM)..."
                className="flex-1 p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isThinking || isUploadingMedia || (!inputMessage.trim() && attachedMediaUrls.length === 0)}
                className="px-5 py-3 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send & Book</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
