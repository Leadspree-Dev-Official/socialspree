// Web Speech Recognition, Web Speech Synthesis & Web Audio API Engine

export interface VoiceCommandResult {
  type: 'navigate' | 'composer' | 'generate_ai' | 'info' | 'chat' | 'dictate';
  text: string;
  responseText: string;
  targetTab?: string;
  data?: any;
}

// Check Speech Recognition Support
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

// Check Speech Synthesis Support
export const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
};

// Play subtle UI audio cues using native Web Audio API
export const playAudioCue = (type: 'start' | 'stop' | 'success' | 'speak') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'stop') {
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(390, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'speak') {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
};

// Text-To-Speech (Assistant Voice Output)
export const speakAssistantText = (
  text: string, 
  options: {
    muted?: boolean;
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
) => {
  if (typeof window === 'undefined' || !isSpeechSynthesisSupported() || options.muted) {
    if (options.onStart) options.onStart();
    if (options.onEnd) setTimeout(options.onEnd, 1000);
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    // Clean markdown/symbols from speech output
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate || 1.05;
    utterance.pitch = options.pitch || 1.0;

    // Pick natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Alex')))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      if (options.onError) options.onError(e);
      if (options.onEnd) options.onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (options.onError) options.onError(err);
    if (options.onEnd) options.onEnd();
  }
};

export const stopAssistantSpeech = () => {
  if (typeof window !== 'undefined' && isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
};

// SocialSpree Natural Language Voice Command Dispatcher
export const parseSocialSpreeVoiceCommand = (
  rawTranscript: string,
  context: {
    activeTab: string;
    tenantName: string;
    aiCredits: number;
    accountsCount: number;
    postsCount: number;
  }
): VoiceCommandResult => {
  const t = rawTranscript.toLowerCase().trim();

  // Navigation commands
  if (t.includes('go to composer') || t.includes('open composer') || t.includes('create post') || t.includes('new post') || t.includes('compose')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'composer',
      responseText: 'Opening Post Composer for you now. Ready to draft and publish!'
    };
  }

  if (t.includes('go to calendar') || t.includes('open calendar') || t.includes('view schedule') || t.includes('show schedule')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'calendar',
      responseText: 'Opening your Interactive Calendar Grid.'
    };
  }

  if (t.includes('go to agents') || t.includes('open agents') || t.includes('ai booking') || t.includes('autonomous agent')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'agents',
      responseText: 'Switching to AI Autonomous Booking Agents.'
    };
  }

  if (t.includes('go to media') || t.includes('open media') || t.includes('media vault') || t.includes('my assets') || t.includes('media assets')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'media',
      responseText: 'Opening your Unified Media Vault.'
    };
  }

  if (t.includes('go to autoresponder') || t.includes('open autoresponder') || t.includes('auto reply') || t.includes('dms')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'autoresponder',
      responseText: 'Opening Comment Keyword Auto-Responder & DMs.'
    };
  }

  if (t.includes('go to connections') || t.includes('open connections') || t.includes('social accounts') || t.includes('connected channels')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'connections',
      responseText: `Opening Social Connections. You currently have ${context.accountsCount} active social channels.`
    };
  }

  if (t.includes('go to analytics') || t.includes('open analytics') || t.includes('show stats') || t.includes('performance')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'analytics',
      responseText: 'Opening Analytics Engine.'
    };
  }

  if (t.includes('go to logs') || t.includes('audit logs') || t.includes('activity logs')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'logs',
      responseText: 'Navigating to Activity & Audit Logs.'
    };
  }

  if (t.includes('go to reviews') || t.includes('google reviews') || t.includes('show reviews')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'reviews',
      responseText: 'Opening Google Reviews management.'
    };
  }

  if (t.includes('go to admin') || t.includes('super admin') || t.includes('admin portal')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'admin',
      responseText: 'Navigating to Super Admin Portal.'
    };
  }

  if (t.includes('go to settings') || t.includes('open settings') || t.includes('system settings') || t.includes('my profile')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'settings',
      responseText: 'Opening System & Workspace Settings.'
    };
  }

  if (t.includes('go to help') || t.includes('open help') || t.includes('help center') || t.includes('support')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'help',
      responseText: 'Opening Help Center and Documentation.'
    };
  }

  if (t.includes('go to dashboard') || t.includes('open dashboard') || t.includes('home page') || t.includes('overview')) {
    return {
      type: 'navigate',
      text: rawTranscript,
      targetTab: 'dashboard',
      responseText: 'Returning to Dashboard Overview.'
    };
  }

  // Info queries
  if (t.includes('how many credits') || t.includes('ai credits') || t.includes('balance') || t.includes('check credits')) {
    return {
      type: 'info',
      text: rawTranscript,
      responseText: `You have ${context.aiCredits} AI Content Credits remaining in ${context.tenantName}.`
    };
  }

  if (t.includes('how many accounts') || t.includes('connected accounts') || t.includes('channels')) {
    return {
      type: 'info',
      text: rawTranscript,
      responseText: `You have ${context.accountsCount} social channels connected across your workspace.`
    };
  }

  if (t.includes('how many posts') || t.includes('total posts')) {
    return {
      type: 'info',
      text: rawTranscript,
      responseText: `You currently have ${context.postsCount} total posts published and scheduled.`
    };
  }

  // AI Content / Hashtag Generation by voice
  if (t.startsWith('generate hashtags') || t.includes('hashtags for') || t.includes('hashtag')) {
    const topic = rawTranscript.replace(/generate hashtags|hashtags for|hashtags/gi, '').trim() || 'trending content';
    return {
      type: 'generate_ai',
      text: rawTranscript,
      data: { mode: 'hashtags', topic },
      responseText: `Generating viral hashtags for ${topic}...`
    };
  }

  if (t.startsWith('write a caption') || t.startsWith('generate caption') || t.includes('write caption')) {
    const prompt = rawTranscript.replace(/write a caption for|generate caption for|write a caption|generate caption/gi, '').trim() || 'engaging social post';
    return {
      type: 'generate_ai',
      text: rawTranscript,
      data: { mode: 'caption', prompt },
      targetTab: 'composer',
      responseText: `Drafting a social media caption for: "${prompt}" and opening Composer.`
    };
  }

  // Dictate / Draft text
  if (t.startsWith('dictate') || t.startsWith('type this') || t.startsWith('write this') || t.startsWith('post this')) {
    const dictatedText = rawTranscript.replace(/^dictate|^type this|^write this|^post this/gi, '').trim();
    return {
      type: 'dictate',
      text: dictatedText,
      targetTab: 'composer',
      data: { content: dictatedText },
      responseText: `Dictating your message directly into the Composer: "${dictatedText}"`
    };
  }

  // General Conversational Response
  return {
    type: 'chat',
    text: rawTranscript,
    responseText: `I heard: "${rawTranscript}". You can tell me to navigate anywhere (e.g. "go to calendar", "open composer"), check your AI credits, or dictate a post!`
  };
};
