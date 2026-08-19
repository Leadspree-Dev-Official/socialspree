import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Square, 
  X, 
  Sparkles, 
  Bot, 
  Send, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Zap, 
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Coins,
  MessageSquare
} from 'lucide-react';
import { 
  isSpeechRecognitionSupported, 
  isSpeechSynthesisSupported, 
  speakAssistantText, 
  stopAssistantSpeech, 
  playAudioCue, 
  parseSocialSpreeVoiceCommand,
  VoiceCommandResult
} from '../../lib/speech';
import { TabType } from '../layout/Sidebar';

export interface VoiceAssistantProps {
  activeTab: TabType;
  onNavigateTab: (tab: TabType) => void;
  tenantName: string;
  aiCredits: number;
  accountsCount: number;
  postsCount: number;
  onInsertTextIntoComposer?: (text: string) => void;
}

export const VoiceAssistantOverlay: React.FC<VoiceAssistantProps> = ({
  activeTab,
  onNavigateTab,
  tenantName,
  aiCredits,
  accountsCount,
  postsCount,
  onInsertTextIntoComposer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string>(
    `Hi! I'm your SocialSpree AI Voice Assistant. Press Alt+V or click to talk to me.`
  );
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: `Hello! 👋 How can I help you manage your social channels today? You can say "Go to Analytics", "Check AI Credits", or dictate a caption.`,
      time: 'Just now'
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const audioAnimationRef = useRef<number | null>(null);

  // Initialize Speech Recognition
  const initSpeechRecognition = useCallback(() => {
    if (!isSpeechRecognitionSupported()) return null;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setIsThinking(false);
      stopAssistantSpeech();
      setIsSpeaking(false);
      playAudioCue('start');
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          currentFinal += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (currentFinal) {
        setTranscript(prev => (prev ? `${prev} ${currentFinal}` : currentFinal));
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, []);

  // Process User Voice Command
  const processTranscript = useCallback((textToProcess: string) => {
    const rawText = textToProcess.trim();
    if (!rawText) {
      setIsListening(false);
      return;
    }

    setIsThinking(true);
    setIsListening(false);
    playAudioCue('stop');

    // Add user message to history
    const userMsg = { sender: 'user' as const, text: rawText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setConversationHistory(prev => [...prev, userMsg]);

    setTimeout(() => {
      const result: VoiceCommandResult = parseSocialSpreeVoiceCommand(rawText, {
        activeTab,
        tenantName,
        aiCredits,
        accountsCount,
        postsCount
      });

      // Execute Action
      if (result.targetTab && result.targetTab !== activeTab) {
        onNavigateTab(result.targetTab as TabType);
      }

      if (result.type === 'dictate' && result.data?.content && onInsertTextIntoComposer) {
        onInsertTextIntoComposer(result.data.content);
      }

      // Add assistant response to history
      const assistantMsg = { 
        sender: 'assistant' as const, 
        text: result.responseText, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setConversationHistory(prev => [...prev, assistantMsg]);
      setLastResponse(result.responseText);
      setIsThinking(false);

      // Speak back assistant answer
      speakAssistantText(result.responseText, {
        muted: isMuted,
        onStart: () => {
          setIsSpeaking(true);
          playAudioCue('speak');
        },
        onEnd: () => {
          setIsSpeaking(false);
        }
      });

      setTranscript('');
      setInterimTranscript('');
    }, 450);
  }, [activeTab, tenantName, aiCredits, accountsCount, postsCount, onNavigateTab, onInsertTextIntoComposer, isMuted]);

  // Start Listening Handler
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    stopAssistantSpeech();
    setIsSpeaking(false);
    setTranscript('');
    setInterimTranscript('');
    setIsOpen(true);

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initSpeechRecognition();
      }
      recognitionRef.current?.start();
    } catch {
      // If already started, stop and restart
      try {
        recognitionRef.current?.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      } catch {
        // ignore
      }
    }
  }, [initSpeechRecognition]);

  // Stop Listening and Process / Send Data Handler
  const stopAndSendData = useCallback(() => {
    const fullText = `${transcript} ${interimTranscript}`.trim();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);

    if (fullText) {
      processTranscript(fullText);
    }
  }, [transcript, interimTranscript, processTranscript]);

  // Toggle Voice Assistant via Keyboard Shortcut (Alt+V or Option+V)
  const toggleVoiceAssistant = useCallback(() => {
    if (isListening) {
      stopAndSendData();
    } else if (isSpeaking) {
      stopAssistantSpeech();
      setIsSpeaking(false);
      startListening();
    } else {
      startListening();
    }
  }, [isListening, isSpeaking, stopAndSendData, startListening]);

  // Global Keyboard Listener for Alt+V
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt + V / Option + V (e.altKey && e.code === 'KeyV' or key === 'v' / 'V' / '√' on Mac)
      const isAltV = e.altKey && (e.code === 'KeyV' || e.key.toLowerCase() === 'v' || e.key === '√');
      
      if (isAltV) {
        e.preventDefault();
        e.stopPropagation();
        toggleVoiceAssistant();
      }

      // Escape to cancel/close voice overlay
      if (e.key === 'Escape' && (isOpen || isListening || isSpeaking)) {
        if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
        }
        stopAssistantSpeech();
        setIsSpeaking(false);
        setIsOpen(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVoiceAssistant, isOpen, isListening, isSpeaking]);

  // Simulated dynamic audio level waveform animation
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening, isSpeaking]);

  const currentDisplaySpeech = interimTranscript || transcript || (isListening ? 'Listening to your voice...' : lastResponse);

  return (
    <>
      {/* 1. TOP FLOATING VOICE ASSISTANT BANNER (Image 4 Aesthetic) */}
      {isOpen && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-[#111827]/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-purple-900/40 text-white flex items-center justify-between gap-3 font-['Inter'] ring-1 ring-white/10">
            
            {/* Glowing Orb / Mic Icon on Left */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={toggleVoiceAssistant}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#5D3FD3] via-purple-500 to-indigo-500 shadow-lg shadow-purple-500/50 animate-pulse'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/50'
                    : isThinking
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 animate-spin'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Click or press Alt+V to toggle"
              >
                {isListening ? (
                  <Mic className="w-5 h-5 text-white animate-bounce" />
                ) : isSpeaking ? (
                  <Volume2 className="w-5 h-5 text-white animate-pulse" />
                ) : isThinking ? (
                  <Sparkles className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}

                {/* Animated Glow Rings when Listening */}
                {isListening && (
                  <span className="absolute inset-0 rounded-xl bg-purple-500/30 animate-ping pointer-events-none" />
                )}
              </button>

              {/* Status / Live Transcription Display */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-purple-300 flex items-center gap-1.5">
                    {isListening ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                        Listening to your voice...
                      </>
                    ) : isSpeaking ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
                        Assistant Speaking...
                      </>
                    ) : isThinking ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        AI Voice Assistant
                      </>
                    )}
                  </span>
                  <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-700">
                    Alt+V
                  </span>
                </div>

                <div className="text-xs sm:text-sm font-medium text-slate-100 truncate mt-0.5">
                  {interimTranscript || transcript || (isListening ? 'Speak now... (say "Go to Calendar", "Dictate post...", etc.)' : lastResponse)}
                </div>
              </div>
            </div>

            {/* Right Control Action Buttons (Image 4: Speaker + Red Stop/Send Button) */}
            <div className="flex items-center gap-1.5 shrink-0">
              
              {/* Speaker Mute/Unmute Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopAssistantSpeech();
                  setIsMuted(!isMuted);
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isMuted ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-cyan-400 hover:bg-slate-800'
                }`}
                title={isMuted ? 'Unmute Assistant Voice' : 'Mute Assistant Voice'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Expand Full Assistant Dialog */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand Full Assistant"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Red Square Stop & Send Button (Image 4) */}
              {isListening ? (
                <button
                  type="button"
                  onClick={stopAndSendData}
                  className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-red-600/40 cursor-pointer"
                  title="Stop & Send Voice (Alt+V)"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              ) : isSpeaking ? (
                <button
                  type="button"
                  onClick={() => {
                    stopAssistantSpeech();
                    setIsSpeaking(false);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Stop Speaking"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startListening}
                  className="w-8 h-8 rounded-xl bg-[#5D3FD3] hover:bg-purple-600 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-purple-600/40 cursor-pointer"
                  title="Start Listening (Alt+V)"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              {/* Close Overlay */}
              <button
                type="button"
                onClick={() => {
                  if (isListening) recognitionRef.current?.stop();
                  stopAssistantSpeech();
                  setIsListening(false);
                  setIsSpeaking(false);
                  setIsOpen(false);
                  setIsExpanded(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. EXPANDED ASSISTANT MODAL WITH 3D GLOWING ORB (Image 2 Aesthetic) */}
      {isExpanded && isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0F172A] border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white font-['Inter'] space-y-6 overflow-hidden">
            
            {/* Background Ambient Aura */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-purple-600/20 via-blue-600/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#5D3FD3] text-white flex items-center justify-center shadow-md shadow-purple-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    SocialSpree Voice AI
                    <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                      Interactive Live Mode
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Talk naturally to automate social posting and navigation</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setIsOpen(false);
                    stopAssistantSpeech();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Glowing 3D Orb Centerpiece (Image 2) */}
            <div className="relative py-8 flex flex-col items-center justify-center">
              
              {/* Outer Pulse Rings */}
              <div className={`absolute w-56 h-56 rounded-full transition-all duration-700 pointer-events-none ${
                isListening
                  ? 'bg-purple-500/20 scale-125 animate-ping'
                  : isSpeaking
                  ? 'bg-cyan-500/20 scale-110 animate-pulse'
                  : 'bg-indigo-500/10 scale-90'
              }`} />

              <div className={`absolute w-44 h-44 rounded-full transition-all duration-500 pointer-events-none ${
                isListening
                  ? 'border-2 border-purple-400/40 animate-pulse'
                  : isSpeaking
                  ? 'border-2 border-cyan-400/40 animate-spin'
                  : 'border border-slate-700/50'
              }`} />

              {/* 3D Glowing Orb Core (Image 2) */}
              <button
                type="button"
                onClick={toggleVoiceAssistant}
                className={`relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#5D3FD3] via-[#7C3AED] to-[#38BDF8] shadow-purple-500/60 scale-105 ring-4 ring-purple-400/40'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-[#0284C7] via-[#38BDF8] to-[#818CF8] shadow-cyan-500/60 animate-pulse ring-4 ring-cyan-400/40'
                    : isThinking
                    ? 'bg-gradient-to-tr from-[#D97706] via-[#F59E0B] to-[#EC4899] shadow-amber-500/60 animate-spin'
                    : 'bg-gradient-to-tr from-[#4338CA] via-[#6366F1] to-[#93C5FD] shadow-indigo-500/40 hover:scale-105'
                }`}
                title="Click or press Alt+V to speak"
              >
                {/* Internal Spherical Gradient / Light Glow */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/40 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute top-3 left-6 w-12 h-6 bg-white/40 rounded-full blur-xs rotate-[-30deg] pointer-events-none" />

                {/* Center Icon */}
                <div className="relative z-10 text-white flex flex-col items-center justify-center">
                  {isListening ? (
                    <>
                      <Mic className="w-9 h-9 animate-bounce drop-shadow-md" />
                      <span className="text-[10px] font-black tracking-wider uppercase mt-1">Listening</span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <Volume2 className="w-9 h-9 animate-pulse drop-shadow-md" />
                      <span className="text-[10px] font-black tracking-wider uppercase mt-1">Speaking</span>
                    </>
                  ) : isThinking ? (
                    <>
                      <Sparkles className="w-9 h-9 animate-spin drop-shadow-md" />
                      <span className="text-[10px] font-black tracking-wider uppercase mt-1">Thinking</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-9 h-9 drop-shadow-md" />
                      <span className="text-[10px] font-black tracking-wider uppercase mt-1">Tap to Talk</span>
                    </>
                  )}
                </div>
              </button>

              {/* Waveform Equalizer Display (Image 3) */}
              <div className="flex items-center gap-1 mt-6 h-6">
                {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.8, 0.3].map((val, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isListening
                        ? 'bg-purple-400'
                        : isSpeaking
                        ? 'bg-cyan-400'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: (isListening || isSpeaking) ? `${Math.max(6, (audioLevel * val) * 24)}px` : '4px'
                    }}
                  />
                ))}
              </div>

              {/* Status Message */}
              <p className="mt-3 text-sm text-center font-medium text-slate-300 max-w-md px-4 leading-relaxed">
                {interimTranscript || transcript || lastResponse}
              </p>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Quick Voice Commands:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  '🚀 Go to Composer',
                  '📅 Open Calendar Grid',
                  '📊 Show Analytics',
                  '💳 How many AI credits do I have?',
                  '🌐 How many accounts are connected?',
                  '✨ Generate hashtags for social marketing',
                  '📝 Dictate a launch post'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => processTranscript(chip.replace(/^[^\w\s]+/, '').trim())}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-xs font-semibold text-slate-200 border border-slate-700 transition-all hover:scale-105 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span>Shortcut:</span>
                <kbd className="bg-slate-800 text-purple-300 px-2 py-1 rounded border border-slate-700 font-bold">
                  Alt + V
                </kbd>
                <span>to start/send</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  <span>{isMuted ? 'Voice Muted' : 'Voice Active'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. FLOATING CAPSULE LAUNCHER PILL WIDGET (Image 1 & 3 Aesthetic) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in duration-200 font-['Inter']">
          <div className="group flex items-center bg-[#111827]/95 backdrop-blur-xl border border-slate-700/80 rounded-full p-1.5 shadow-2xl shadow-purple-950/50 hover:border-purple-500/80 transition-all">
            
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={startListening}
              className="flex items-center gap-2.5 pl-3 pr-3.5 py-2 text-white hover:text-purple-300 transition-all cursor-pointer"
              title="Activate AI Voice Assistant (Alt + V)"
            >
              <div className="relative">
                <Mic className="w-4 h-4 text-slate-200 group-hover:text-purple-300 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#5D3FD3] rounded-full animate-ping" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 group-hover:text-white">
                  Voice AI
                </span>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold">
                  Alt+V
                </span>
              </div>
            </button>

            {/* Waveform Action Button (Image 3: Blue circular soundwave button) */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setIsExpanded(true);
              }}
              className="w-9 h-9 rounded-full bg-[#0066FF] hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Open Voice AI Assistant"
            >
              {/* 4-bar soundwave icon */}
              <div className="flex items-center gap-0.5 h-3.5">
                <span className="w-0.5 h-2 bg-white rounded-full"></span>
                <span className="w-0.5 h-3.5 bg-white rounded-full"></span>
                <span className="w-0.5 h-2.5 bg-white rounded-full"></span>
                <span className="w-0.5 h-1.5 bg-white rounded-full"></span>
              </div>
            </button>

          </div>
        </div>
      )}
    </>
  );
};
