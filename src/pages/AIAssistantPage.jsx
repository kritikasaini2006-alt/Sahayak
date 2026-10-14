import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  ShieldCheck,
  User,
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Globe,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  Info,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../data/translations';
import { loadCitizenProfile } from '../utils/eligibilityEngine';

export default function AIAssistantPage() {
  // Language state (defaults to English or saved preference)
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('sahayak_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Stored Citizen Profile
  const [profile, setProfile] = useState(null);

  // Chat message history
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: TRANSLATIONS[language]?.welcomeMessage || TRANSLATIONS.en.welcomeMessage,
      sources: ['india.gov.in', 'myscheme.gov.in'],
      isDemoMode: false,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  // References
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Load citizen profile on mount
  useEffect(() => {
    const loadedProfile = loadCitizenProfile();
    if (loadedProfile && (loadedProfile.age || loadedProfile.state || loadedProfile.occupation)) {
      setProfile(loadedProfile);
    }
  }, []);

  // Save language preference and update welcome if only welcome message exists
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('sahayak_lang', newLang);
    } catch (e) {
      console.warn('Unable to store language preference:', e);
    }

    // If chat only contains the initial welcome message, translate it
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: TRANSLATIONS[newLang]?.welcomeMessage || TRANSLATIONS.en.welcomeMessage,
          sources: ['india.gov.in', 'myscheme.gov.in'],
          isDemoMode: false,
        },
      ]);
    }
  };

  // Scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Clean up any ongoing TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Speech-to-Text (STT) Setup
  const handleToggleListening = () => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setSpeechError(t.sttUnsupported);
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError(t.sttDenied);
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setSpeechError('Could not start microphone service.');
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  // Text-to-Speech (TTS) Read-Aloud
  const handleToggleSpeak = (msgId, text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert(t.ttsUnsupported);
      return;
    }

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown characters for clearer speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/•/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/#+\s/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    // Pick best available voice matching target language
    const voices = window.speechSynthesis.getVoices();
    const targetLangCode = language === 'hi' ? 'hi' : 'en';
    const matchedVoice = voices.find((v) => v.lang.startsWith(targetLangCode));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setSpeakingId(null);
    };

    utterance.onerror = () => {
      setSpeakingId(null);
    };

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy Message to Clipboard
  const handleCopyMessage = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Send Message to Server API /api/chat
  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = (customPrompt !== null ? customPrompt : inputPrompt).trim();
    if (!textToSend || isTyping) return;

    // Stop active speech recognition or speech synthesis
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
    if (speakingId && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    const userMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
    };

    // Append user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      // Build conversation history for context
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textToSend,
          history: historyPayload,
          language,
          profile,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(t.errorRateLimit);
        }
        if (res.status === 504) {
          throw new Error(t.errorTimeout);
        }
        throw new Error(data.error || 'Request failed');
      }

      const assistantMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.reply,
        sources: data.sources || ['india.gov.in', 'myscheme.gov.in'],
        isDemoMode: !!data.isDemoMode,
        demoReason: data.demoReason,
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat API Error:', err);

      const errorMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: err.message || t.errorNetwork,
        isError: true,
        canRetry: true,
        originalPrompt: textToSend,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Clear conversation history
  const handleClearChat = () => {
    if (window.confirm(t.clearConfirm)) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingId(null);
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: t.welcomeMessage,
          sources: ['india.gov.in', 'myscheme.gov.in'],
          isDemoMode: false,
        },
      ]);
    }
  };

  // Safe formatting for bold text and bullet points
  const formatMessageText = (content) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      // Check for bullet lines
      const isBullet = line.startsWith('• ') || line.startsWith('- ');
      const cleanLine = isBullet ? line.substring(2) : line;

      // Parse bold segments **bold** and links [text](url)
      const parts = [];
      const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
          parts.push(
            <strong key={`bold-${lineIdx}-${match.index}`} className="font-semibold text-navy-950">
              {token.slice(2, -2)}
            </strong>
          );
        } else if (token.startsWith('[') && token.includes('](')) {
          const textEnd = token.indexOf('](');
          const linkText = token.slice(1, textEnd);
          const linkUrl = token.slice(textEnd + 2, -1);
          parts.push(
            <a
              key={`link-${lineIdx}-${match.index}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 underline font-medium"
            >
              {linkText}
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          );
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-teal-600 font-bold leading-none mt-1">•</span>
            <div className="flex-1">{parts.length > 0 ? parts : cleanLine}</div>
          </div>
        );
      }

      // Empty line for paragraph spacing
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2" />;
      }

      return (
        <div key={lineIdx} className="leading-relaxed">
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

  return (
    <div className="py-6 md:py-8 flex-1 flex flex-col max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-navy-900">
                {t.title}
              </h1>
              <Badge variant="teal">{t.badgeStatus}</Badge>
            </div>
            <p className="text-xs text-slate-500">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Top Controls: Language Switcher & Clear Chat */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Globe className="w-4 h-4 text-slate-500 ml-1.5" />
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  language === lang.code
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-200/60'
                }`}
                title={`Switch to ${lang.label}`}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
            title={t.clearChat}
            aria-label={t.clearChat}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Citizen Profile Status Banner */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
          {profile ? (
            <span>
              <strong className="text-teal-900">{t.profileActive}</strong>{' '}
              {profile.age ? `${profile.age} yrs` : ''}
              {profile.gender ? `, ${profile.gender}` : ''}
              {profile.state ? ` • ${profile.state}` : ''}
              {profile.occupation ? ` • ${profile.occupation.replace('_', ' ')}` : ''}
              {profile.farmerLandholding ? ` (${profile.farmerLandholding})` : ''}
              {profile.annualIncome !== '' && profile.annualIncome !== undefined
                ? ` • ₹${Number(profile.annualIncome).toLocaleString('en-IN')}/yr`
                : ''}
            </span>
          ) : (
            <span className="text-slate-600">
              {t.noProfile}
            </span>
          )}
        </div>
        <Link
          to="/check-eligibility"
          className="font-medium text-teal-800 hover:text-teal-950 underline self-start sm:self-auto shrink-0"
        >
          {t.editProfile}
        </Link>
      </div>

      {/* Chat Thread Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm mt-4 flex flex-col overflow-hidden min-h-[480px]">
        {/* Messages List */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-navy-800 text-white shadow-sm'
                    : msg.isError
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : msg.isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] md:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-navy-800 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50/80 border border-rose-200 text-rose-900 rounded-tl-none space-y-3'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none space-y-3'
                }`}
              >
                {/* Message Header Bar (Metadata & Badges) */}
                <div className="flex items-center justify-between text-[11px] gap-2 pb-1 border-b border-slate-200/50">
                  <span className={msg.sender === 'user' ? 'text-teal-200 font-medium' : 'text-slate-500 font-semibold'}>
                    {msg.sender === 'user' ? 'You' : 'Sahayak AI'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {msg.isDemoMode && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300">
                        {t.offlineModeTag}
                      </span>
                    )}
                    {msg.sender === 'assistant' && !msg.isDemoMode && !msg.isError && (
                      <span className="bg-teal-100 text-teal-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-teal-300">
                        {t.liveGeminiTag}
                      </span>
                    )}
                    <span className={`flex items-center gap-0.5 ${msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'}`}>
                      <Clock className="w-3 h-3" />
                      {msg.time}
                    </span>
                  </div>
                </div>

                {/* Formatted Text Content */}
                <div className="space-y-1">
                  {formatMessageText(msg.text)}
                </div>

                {/* Demo reason note if offline catalog was used */}
                {msg.demoReason && (
                  <div className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{msg.demoReason}</span>
                  </div>
                )}

                {/* Sources & Official Portals */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-600">{t.sourcesHeader}</span>
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-teal-700 font-medium"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Retry action for failed requests */}
                {msg.canRetry && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleSendMessage(msg.originalPrompt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.retry}
                    </button>
                  </div>
                )}

                {/* Assistant Controls: Text-To-Speech & Copy */}
                {msg.sender === 'assistant' && !msg.isError && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2 text-slate-500 text-xs">
                    {/* Read Aloud Button */}
                    <button
                      onClick={() => handleToggleSpeak(msg.id, msg.text)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/60 transition-colors ${
                        speakingId === msg.id ? 'text-teal-700 font-semibold bg-teal-100' : ''
                      }`}
                      title={speakingId === msg.id ? t.stopSpeaking : t.speak}
                      aria-label={speakingId === msg.id ? t.stopSpeaking : t.speak}
                    >
                      {speakingId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
                          <span>{t.stopSpeaking}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{t.speak}</span>
                        </>
                      )}
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200/60 transition-colors"
                      title={t.copy}
                      aria-label={t.copy}
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">{t.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.copy}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin text-teal-700" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-600 flex items-center gap-2">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></span>
                </div>
                <span>{t.typingIndicator}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="p-3 bg-slate-50/90 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            {t.suggestedQuestionsTitle}
          </span>
          {t.suggestedPrompts.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="shrink-0 text-xs text-navy-800 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 px-3 py-1.5 rounded-lg transition-colors text-left font-medium shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Speech Error Banner if permission denied or unsupported */}
        {speechError && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button (Speech-to-Text) */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse shadow-md'
                  : 'bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border-slate-200'
              }`}
              title={isListening ? t.micListening : t.micStart}
              aria-label={isListening ? t.micListening : t.micStart}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={isListening ? t.micListening : t.inputPlaceholder}
              disabled={isTyping}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                isListening
                  ? 'bg-rose-50/50 border-rose-300 placeholder-rose-700'
                  : 'bg-slate-50/70 border-slate-300'
              }`}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isTyping}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center shrink-0"
              aria-label={t.send}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Civic Disclaimer */}
          <p className="text-[11px] text-slate-400 mt-2 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 inline" />
            <span>{t.disclaimerBar}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
