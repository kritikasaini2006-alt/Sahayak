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
  Loader2,
  X,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import MicrophonePermissionModal from '../components/common/MicrophonePermissionModal';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../data/translations';
import { loadCitizenProfile, saveCitizenProfile } from '../utils/eligibilityEngine';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export default function AIAssistantPage() {
  const { language, changeLanguage } = useTranslation();
  useDocumentTitle(language === 'hi' ? 'नागरिक AI सहायक' : 'AI Assistant');
  const { user } = useAuth();

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Stored Citizen Profile
  const [profile, setProfile] = useState(null);

  // Guided assistant interactive selection states
  const [selectedOptionsMap, setSelectedOptionsMap] = useState({});
  const [multiDrafts, setMultiDrafts] = useState({});

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

  // Speech Recognition States (Native Browser Speech)
  const [isListening, setIsListening] = useState(false);
  const [isConnectingMic, setIsConnectingMic] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [showMicModal, setShowMicModal] = useState(false);
  const [micModalError, setMicModalError] = useState(null);
  const [isRetryingMic, setIsRetryingMic] = useState(false);

  // References
  const latestAIMessageRef = useRef(null);
  const latestUserMessageRef = useRef(null);
  const chatContainerRef = useRef(null);
  const lastScrolledMessageIdRef = useRef(null);
  const lastScrolledUserMessageIdRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const micButtonRef = useRef(null);
  const permStatusRef = useRef(null);
  const speechErrorTimeoutRef = useRef(null);

  // Identify latest assistant and user messages for scrolling refs
  const latestAssistantMessage = [...messages].reverse().find(
    (m) => m.sender === 'assistant' && m.id !== 'welcome'
  );
  const latestAssistantMessageId = latestAssistantMessage?.id;

  const latestUserMessage = [...messages].reverse().find(
    (m) => m.sender === 'user'
  );
  const latestUserMessageId = latestUserMessage?.id;

  // Load citizen profile on mount or user change
  useEffect(() => {
    const loadedProfile = loadCitizenProfile();
    if (loadedProfile && (loadedProfile.age || loadedProfile.state || loadedProfile.occupation)) {
      setProfile(loadedProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  // Sync welcome message if language changes and chat has only the welcome message
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: TRANSLATIONS[language]?.welcomeMessage || TRANSLATIONS.en.welcomeMessage,
          sources: ['india.gov.in', 'myscheme.gov.in'],
          isDemoMode: false,
        },
      ]);
    }
  }, [language]);

  // Save language preference via global context and stop any active voice input
  const handleLanguageChange = (newLang) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsConnectingMic(false);
    changeLanguage(newLang);
  };

  // Helper to calculate target scrollTop to align an element near the top of the chat container
  const getMessageTargetScrollTop = (container, messageEl, topPadding = 16) => {
    if (!container || !messageEl) return 0;
    if (messageEl.offsetParent === container) {
      return Math.max(0, messageEl.offsetTop - topPadding);
    }
    const containerRect = container.getBoundingClientRect();
    const messageRect = messageEl.getBoundingClientRect();
    return Math.max(0, container.scrollTop + (messageRect.top - containerRect.top) - topPadding);
  };

  // Auto-scroll the CHAT MESSAGE CONTAINER ONLY (never the entire document/window) to the START of the new AI message.
  // 1. Positions the beginning of the AI response near the top of the chat's scrollable viewport with a comfortable top margin.
  // 2. The first line of the AI answer is visible near the top of the chat viewport so the citizen can start reading immediately.
  // 3. Does NOT scroll to the final sentence, the bottom of the AI message, the input box, or the bottom of the entire page/footer.
  // 4. Triggered once per new response; during progressive token streaming, view stays stable at the start without repeated scrolling.
  // 5. Does not reposition when the user is reading or scrolling through older messages.
  useEffect(() => {
    if (latestAssistantMessageId && lastScrolledMessageIdRef.current !== latestAssistantMessageId) {
      lastScrolledMessageIdRef.current = latestAssistantMessageId;

      const scrollToAIMessageStart = () => {
        const container = chatContainerRef.current;
        const messageEl = latestAIMessageRef.current;
        if (!container || !messageEl) return;

        const targetScrollTop = getMessageTargetScrollTop(container, messageEl, 16);

        // Development diagnostic logging
        if (process.env.NODE_ENV !== 'production' || import.meta.env?.DEV) {
          console.log('[Sahayak Chat Scroll Diagnostic: scrollToAIMessageStart]', {
            messageId: latestAssistantMessageId,
            messageOffsetTop: messageEl.offsetTop,
            targetScrollTop,
            containerScrollTopBefore: container.scrollTop,
            containerScrollHeight: container.scrollHeight,
            containerClientHeight: container.clientHeight,
            windowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
          });
        }

        // Scroll the CHAT CONTAINER ONLY — never scroll the window or document down to the footer!
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      };

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        const frameId = window.requestAnimationFrame(scrollToAIMessageStart);
        return () => window.cancelAnimationFrame(frameId);
      } else {
        scrollToAIMessageStart();
      }
    }
  }, [latestAssistantMessageId, messages]);

  // When a user submits a prompt, keep conversation positioned appropriately in the chat container only
  useEffect(() => {
    if (latestUserMessageId && lastScrolledUserMessageIdRef.current !== latestUserMessageId) {
      lastScrolledUserMessageIdRef.current = latestUserMessageId;

      const scrollToUserMsg = () => {
        const container = chatContainerRef.current;
        const userEl = latestUserMessageRef.current;
        if (!container || !userEl) return;

        const targetScrollTop = getMessageTargetScrollTop(container, userEl, 16);

        if (process.env.NODE_ENV !== 'production' || import.meta.env?.DEV) {
          console.log('[Sahayak Chat Scroll Diagnostic: scrollToUserMsg]', {
            userMessageId: latestUserMessageId,
            userOffsetTop: userEl.offsetTop,
            targetScrollTop,
            containerScrollTopBefore: container.scrollTop,
            containerScrollHeight: container.scrollHeight,
            containerClientHeight: container.clientHeight,
          });
        }

        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      };

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        const frameId = window.requestAnimationFrame(scrollToUserMsg);
        return () => window.cancelAnimationFrame(frameId);
      } else {
        scrollToUserMsg();
      }
    }
  }, [latestUserMessageId]);

  // Development-only diagnostics tracking container & window scroll positions
  useEffect(() => {
    if (typeof window === 'undefined' || !(process.env.NODE_ENV !== 'production' || import.meta.env?.DEV)) {
      return;
    }

    const container = chatContainerRef.current;
    const handleContainerScroll = () => {
      console.log('[Sahayak Diagnostic: Container Scroll Event]', {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      });
    };

    const handleWindowScroll = () => {
      if (window.scrollY > 0) {
        console.warn('[Sahayak Diagnostic: Document/Window Scroll Detected on Chat Page!]', {
          scrollY: window.scrollY,
          innerHeight: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
        });
      }
    };

    if (container) {
      container.addEventListener('scroll', handleContainerScroll, { passive: true });
    }
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleContainerScroll);
      }
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, []);

  // Clean up any ongoing TTS / STT / MediaRecorder on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      if (speechErrorTimeoutRef.current) {
        clearTimeout(speechErrorTimeoutRef.current);
      }
    };
  }, []);

  // Helper to show brief contextual error banner with auto-dismiss
  const showEphemeralSpeechError = (msg) => {
    if (speechErrorTimeoutRef.current) {
      clearTimeout(speechErrorTimeoutRef.current);
    }
    setSpeechError(msg);
    speechErrorTimeoutRef.current = setTimeout(() => {
      setSpeechError(null);
    }, 9000);
  };

  // Query microphone permission state where supported (Chromium / Permissions API)
  const getMicrophonePermissionState = async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.permissions ||
      !navigator.permissions.query
    ) {
      return 'unknown';
    }
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      permStatusRef.current = status;

      status.onchange = () => {
        if (status.state === 'granted') {
          setShowMicModal(false);
          setMicModalError(null);
          setSpeechError(null);
        }
      };

      return status.state; // 'granted' | 'denied' | 'prompt'
    } catch {
      // Browser doesn't support { name: 'microphone' } query (e.g. Safari / Firefox)
      return 'unknown';
    }
  };

  // =========================================================================
  // Native Browser SpeechRecognition (Web Speech API)
  // =========================================================================
  const startRecognition = () => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setIsConnectingMic(false);
      showEphemeralSpeechError(
        t.sttUnsupported ||
          'Live voice input works best in Google Chrome. Please use Chrome or type your message.'
      );
      return;
    }

    // Stop and clean up any previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsConnectingMic(false);
        setIsListening(true);
        setSpeechError(null);
        setShowMicModal(false);
        setMicModalError(null);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech Recognition error:', event.error);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
          recognitionRef.current = null;
        }
        setIsConnectingMic(false);
        setIsListening(false);

        if (event.error === 'not-allowed') {
          // Native browser permission denied or revoked
          setShowMicModal(true);
          setSpeechError(null);
        } else if (event.error === 'service-not-allowed' || event.error === 'network') {
          // Unsupported browser or speech service blocked (e.g. Brave)
          showEphemeralSpeechError(
            t.micNetworkError ||
              'Live voice input works best in Google Chrome. Please use Chrome or type your message.'
          );
        } else if (event.error === 'audio-capture') {
          showEphemeralSpeechError(t.micNoDevice || 'No microphone detected on your device.');
        } else if (event.error === 'no-speech') {
          showEphemeralSpeechError(t.micNoSpeech || 'No speech detected. Click the mic to try again.');
        } else if (event.error !== 'aborted') {
          showEphemeralSpeechError(
            t.micNetworkError ||
              'Live voice input works best in Google Chrome. Please use Chrome or type your message.'
          );
        }
      };

      recognition.onend = () => {
        setIsConnectingMic(false);
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsConnectingMic(false);
      setIsListening(false);
      if (err.name === 'NotAllowedError') {
        setShowMicModal(true);
      } else {
        showEphemeralSpeechError(
          t.sttUnsupported ||
            'Live voice input works best in Google Chrome. Please use Chrome or type your message.'
        );
      }
    }
  };

  // Request microphone permission via native prompt where needed and start recognition
  const triggerMicrophoneAndStart = async (permState) => {
    // If already granted, start speech recognition directly
    if (permState === 'granted') {
      setIsConnectingMic(true);
      startRecognition();
      return;
    }

    // Permission is 'prompt' (e.g. Brave/Chrome default Ask) or 'unknown' (e.g. Safari/Firefox)
    // Use getUserMedia to trigger the browser's native permission prompt
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        setIsConnectingMic(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // CRITICAL: Immediately release temporary audio stream to prevent device conflicts with SpeechRecognition
        stream.getTracks().forEach((track) => track.stop());

        setShowMicModal(false);
        setMicModalError(null);
        startRecognition();
      } catch (err) {
        console.warn('getUserMedia permission error:', err);
        setIsConnectingMic(false);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          // Native permission was blocked or rejected by the user
          setShowMicModal(true);
          setMicModalError(null);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          showEphemeralSpeechError(t.micNoDevice || 'No microphone detected on your device.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          showEphemeralSpeechError(t.micInUse || 'Microphone is already in use by another application.');
        } else if (err.name === 'SecurityError') {
          showEphemeralSpeechError(t.micInsecureContext || 'Microphone access is restricted by security policy.');
        } else {
          showEphemeralSpeechError(`Microphone error: ${err.message || err.name}`);
        }
      }
    } else {
      // Fallback if mediaDevices.getUserMedia is missing
      setIsConnectingMic(true);
      startRecognition();
    }
  };

  // Click-to-activate handler for Live Speech
  const handleToggleListening = async () => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      showEphemeralSpeechError(
        t.sttUnsupported ||
          'Live voice input works best in Google Chrome. Please use Chrome or type your message.'
      );
      return;
    }

    // If currently listening or connecting, click stops listening
    if (isListening || isConnectingMic) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setIsConnectingMic(false);
      return;
    }

    // Microphone access requires a secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      showEphemeralSpeechError(
        t.micInsecureContext || 'Microphone access requires a secure connection (HTTPS).'
      );
      return;
    }

    // Check permission state where supported
    const permState = await getMicrophonePermissionState();

    if (permState === 'denied') {
      // Microphone is already blocked in browser site settings
      setShowMicModal(true);
      setMicModalError(null);
      return;
    }

    // Do NOT treat prompt or unknown as denied: trigger native prompt and start recognition
    await triggerMicrophoneAndStart(permState);
  };

  // Try Again handler from permission modal
  const handleTryAgain = async () => {
    setIsRetryingMic(true);
    setMicModalError(null);

    const permState = await getMicrophonePermissionState();

    if (permState === 'denied') {
      setIsRetryingMic(false);
      setMicModalError(
        t.micStillBlocked ||
          'Microphone is still blocked in browser settings. Please switch it to "Allow" and try again.'
      );
      return;
    }

    setIsRetryingMic(false);
    setShowMicModal(false);
    await triggerMicrophoneAndStart(permState);
  };

  // Close modal and restore focus to microphone button
  const handleCloseMicModal = () => {
    setShowMicModal(false);
    setMicModalError(null);
    setIsRetryingMic(false);
    setTimeout(() => {
      micButtonRef.current?.focus();
    }, 50);
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

  // Update citizen profile when field is identified from conversation
  const updateProfileField = (fieldKey, value) => {
    if (!fieldKey || !value) return;
    const current = loadCitizenProfile() || {};
    let updated = { ...current };

    if (fieldKey === 'state') {
      const isOther = value === 'Other' || value === 'other' || String(value).includes('अन्य');
      if (!isOther) {
        updated.state = value;
      }
    } else if (fieldKey === 'ageGroup') {
      const v = String(value).toLowerCase();
      if (v.includes('18') && (v.includes('35') || v.includes('40'))) updated.age = 28;
      else if (v.includes('36') || v.includes('41')) updated.age = 45;
      else if (v.includes('60') && (v.includes('69') || v.includes('senior'))) updated.age = 65;
      else if (v.includes('70') || v.includes('above_60')) updated.age = 72;
      else if (v.includes('under') || v.includes('कम')) updated.age = 16;
    } else if (fieldKey === 'occupation') {
      updated.occupation = value;
    } else if (fieldKey === 'farmerLandholding') {
      updated.farmerLandholding = value;
    } else if (fieldKey === 'artisanTrade') {
      updated.artisanTrade = value;
    } else if (fieldKey === 'incomeRange') {
      const v = String(value).toLowerCase();
      if (v.includes('below') || v.includes('1l_') || v.includes('1 लाख से कम')) updated.annualIncome = 80000;
      else if (v.includes('1l_2.5l') || v.includes('1 लाख से ₹2.5')) updated.annualIncome = 180000;
      else if (v.includes('2.5l_8l') || v.includes('8 लाख')) updated.annualIncome = 450000;
      else if (v.includes('above') || v.includes('अधिक')) updated.annualIncome = 950000;
    }

    saveCitizenProfile(updated);
    setProfile(updated);
  };

  const handleSelectOption = (msg, option) => {
    if (isTyping) return;
    setSelectedOptionsMap((prev) => ({ ...prev, [msg.id]: option.label }));
    if (msg.fieldKey) {
      updateProfileField(msg.fieldKey, option.value || option.label);
    }
    handleSendMessage(option.label);
  };

  const handleResetQuestionChoice = (msgId) => {
    setSelectedOptionsMap((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
  };

  const handleToggleMultiOption = (msgId, optValue) => {
    setMultiDrafts((prev) => {
      const current = prev[msgId] || [];
      if (current.includes(optValue)) {
        return { ...prev, [msgId]: current.filter((v) => v !== optValue) };
      }
      return { ...prev, [msgId]: [...current, optValue] };
    });
  };

  const handleConfirmMultiSelect = (msg) => {
    const selectedValues = multiDrafts[msg.id] || [];
    if (selectedValues.length === 0 || isTyping) return;
    const matchingLabels = msg.options
      .filter((o) => selectedValues.includes(o.value) || selectedValues.includes(o.label))
      .map((o) => o.label);
    const text = matchingLabels.join(', ');
    setSelectedOptionsMap((prev) => ({ ...prev, [msg.id]: text }));
    handleSendMessage(text);
  };

  const handleSkipQuestion = (msg) => {
    if (isTyping) return;
    const skipLabel = language === 'hi' ? 'यह प्रश्न छोड़ें' : 'Skip this question';
    setSelectedOptionsMap((prev) => ({ ...prev, [msg.id]: language === 'hi' ? 'छोड़ा गया' : 'Skipped' }));
    handleSendMessage(skipLabel);
  };

  // Send Message to Server API /api/chat
  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = (customPrompt !== null ? customPrompt : inputPrompt).trim();
    if (!textToSend || isTyping) return;

    // Stop active speech recognition or speech synthesis
    if ((isListening || isConnectingMic) && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setIsConnectingMic(false);
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
        questionType: data.questionType || 'none',
        fieldKey: data.fieldKey || null,
        options: Array.isArray(data.options) ? data.options : [],
        allowSkip: !!data.allowSkip,
        recommendedSchemes: Array.isArray(data.recommendedSchemes) ? data.recommendedSchemes : [],
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
      lastScrolledMessageIdRef.current = null;
      lastScrolledUserMessageIdRef.current = null;
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
    <div className="py-2.5 sm:py-3.5 flex-1 min-h-0 flex flex-col max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 w-full overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-200 gap-3">
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
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm mt-2.5 flex flex-col overflow-hidden">
        {/* Messages List */}
        <div
          ref={chatContainerRef}
          className="relative flex-1 min-h-0 p-3.5 sm:p-5 pb-8 overflow-y-auto space-y-4"
        >
          {messages.map((msg) => {
            const isLatestAssistant = msg.id === latestAssistantMessageId;
            const isLatestUser = msg.id === latestUserMessageId;

            return (
              <div
                key={msg.id}
                ref={isLatestAssistant ? latestAIMessageRef : (isLatestUser ? latestUserMessageRef : null)}
                data-message-id={msg.id}
                data-sender={msg.sender}
                className={`flex items-start gap-3 scroll-mt-4 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
                style={isLatestAssistant ? { scrollMarginTop: '16px' } : undefined}
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

                {/* Single-Choice Clickable Options */}
                {msg.sender === 'assistant' && msg.questionType === 'single_choice' && msg.options && msg.options.length > 0 && (
                  <div className="pt-2.5 mt-2 border-t border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>{t.selectOptionPrompt || 'Please choose an option:'}</span>
                      </p>
                      {selectedOptionsMap[msg.id] && (
                        <button
                          type="button"
                          onClick={() => handleResetQuestionChoice(msg.id)}
                          className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold underline"
                        >
                          {t.changeAnswer || 'Change Answer'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.options.map((opt, optIdx) => {
                        const isSelected = selectedOptionsMap[msg.id] === opt.label || selectedOptionsMap[msg.id] === opt.value;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isTyping}
                            onClick={() => handleSelectOption(msg, opt)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-teal-700 text-white border-teal-700 ring-2 ring-teal-200 shadow-sm'
                                : 'bg-white text-navy-900 border-slate-300 hover:border-teal-500 hover:bg-teal-50/70 active:scale-[0.98]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Skip Action */}
                    {msg.allowSkip && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSkipQuestion(msg)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium underline inline-flex items-center gap-1"
                        >
                          <span>{t.skipQuestion || 'Skip this question →'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Multi-Choice Options with Checkboxes & Confirm */}
                {msg.sender === 'assistant' && msg.questionType === 'multi_choice' && msg.options && msg.options.length > 0 && (
                  <div className="pt-2.5 mt-2 border-t border-slate-200/70 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t.selectMultiplePrompt || 'Select all that apply, then confirm:'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.options.map((opt, optIdx) => {
                        const currentDraft = multiDrafts[msg.id] || [];
                        const isChecked = currentDraft.includes(opt.value || opt.label);
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isTyping || !!selectedOptionsMap[msg.id]}
                            onClick={() => handleToggleMultiOption(msg.id, opt.value || opt.label)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-teal-50 text-teal-950 border-teal-500 ring-2 ring-teal-200'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] font-bold ${
                                isChecked
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white border-slate-400 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Confirm and Skip Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50">
                      {msg.allowSkip ? (
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSkipQuestion(msg)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                        >
                          {t.skipQuestion || 'Skip this question →'}
                        </button>
                      ) : <div />}
                      <button
                        type="button"
                        disabled={isTyping || !(multiDrafts[msg.id] && multiDrafts[msg.id].length > 0) || !!selectedOptionsMap[msg.id]}
                        onClick={() => handleConfirmMultiSelect(msg)}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.confirmSelection || 'Confirm Selection'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Structured Scheme Recommendation Cards */}
                {msg.sender === 'assistant' && msg.recommendedSchemes && msg.recommendedSchemes.length > 0 && (
                  <div className="pt-3 mt-2 border-t border-slate-200/70 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>{t.recommendedSchemesTitle || 'Recommended Government Welfare Schemes'}</span>
                    </div>
                    <div className="space-y-3">
                      {msg.recommendedSchemes.map((scheme, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white border border-teal-200 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-navy-950 text-sm leading-snug">
                              {scheme.title}
                            </h4>
                            <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                              Verified Scheme
                            </span>
                          </div>

                          {scheme.benefit && (
                            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-lg p-2 text-xs text-emerald-950 font-medium">
                              <span className="text-emerald-900 font-bold block text-[10px] uppercase tracking-wide">
                                Benefit:
                              </span>
                              {scheme.benefit}
                            </div>
                          )}

                          {scheme.keyCriteria && (
                            <div className="text-xs text-slate-700">
                              <span className="font-semibold text-navy-900">
                                {t.keyCriteriaLabel || 'Key Eligibility'}:{' '}
                              </span>
                              {scheme.keyCriteria}
                            </div>
                          )}

                          {scheme.documentsRequired && scheme.documentsRequired.length > 0 && (
                            <div className="text-xs space-y-1">
                              <span className="font-semibold text-slate-600 text-[11px] block">
                                {t.requiredDocsLabel || 'Required Documents'}:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {scheme.documentsRequired.map((doc, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px]"
                                  >
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            {scheme.portalUrl && (
                              <a
                                href={scheme.portalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                              >
                                <span>{t.officialPortalLabel || 'Official Portal'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Link
                              to="/check-eligibility"
                              className="text-xs font-semibold text-navy-800 hover:text-teal-700 hover:underline"
                            >
                              {t.checkEligibilityAction || 'Check Full Eligibility →'}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
          );
        })}

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

        {/* Contextual Speech Error Banner (auto-dismissed / dismissible with Retry & Cloud Fallback) */}
        {speechError && (
          <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 animate-fadeIn">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="leading-relaxed">{speechError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setSpeechError(null);
                  handleToggleListening();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 font-semibold text-[11px] transition-colors shadow-2xs"
                title={t.micRetry || 'Retry'}
              >
                <RotateCcw className="w-3 h-3 text-amber-800" />
                <span>{t.micRetry || 'Retry'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-amber-700 hover:text-amber-900 p-1 rounded-md hover:bg-amber-100/60 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active Listening Indicator */}
        {isListening && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-950 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <span className="font-semibold">{t.micListening}</span>
            </div>
            <button
              type="button"
              onClick={handleToggleListening}
              className="text-rose-700 hover:text-rose-900 font-bold underline text-[11px]"
            >
              {t.micStop}
            </button>
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
              ref={micButtonRef}
              type="button"
              onClick={handleToggleListening}
              disabled={isTyping}
              className={`p-2.5 rounded-xl border transition-all relative ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                  : isConnectingMic
                  ? 'bg-teal-50 text-teal-700 border-teal-300'
                  : 'bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border-slate-200'
              }`}
              title={
                isListening
                  ? t.micStop
                  : isConnectingMic
                  ? t.micConnecting
                  : t.micStart
              }
              aria-label={
                isListening
                  ? t.micStop
                  : isConnectingMic
                  ? t.micConnecting
                  : t.micStart
              }
            >
              {isConnectingMic ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              ) : isListening ? (
                <MicOff className="w-4 h-4 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                isListening
                  ? t.micListening
                  : isConnectingMic
                  ? t.micConnecting
                  : t.inputPlaceholder
              }
              disabled={isTyping}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
                isListening
                  ? 'bg-rose-50/50 border-rose-300 placeholder-rose-700 ring-2 ring-rose-200'
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

      {/* Microphone Permission Blocked Modal */}
      <MicrophonePermissionModal
        isOpen={showMicModal}
        onClose={handleCloseMicModal}
        onTryAgain={handleTryAgain}
        isRetrying={isRetryingMic}
        errorMessage={micModalError}
        language={language}
        translations={t}
      />
    </div>
  );
}
