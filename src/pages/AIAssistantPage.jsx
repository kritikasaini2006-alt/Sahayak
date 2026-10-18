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
  Copy,
  Check,
  RotateCcw,
  Trash2,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Clock,
  Info,
  Loader2,
  X,
  Plus,
  History,
  MessageSquare,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import MicrophonePermissionModal from '../components/common/MicrophonePermissionModal';
import { TRANSLATIONS } from '../data/translations';
import { DEFAULT_OPTIONS_BY_FIELD } from '../data/chatOptions';
import { SCHEME_TRANSLATIONS } from '../data/schemeTranslations';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import { loadCitizenProfile, saveCitizenProfile } from '../utils/eligibilityEngine';
import { parseStructuredResponse, extractAgeFromText, determineAgeGroup, parseAgeGroupFromText } from '../utils/responseParser';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import {
  getConversations,
  getConversationById,
  saveConversation,
  updateConversationMessages,
  updateConversationSelectedOptions,
  deleteConversation,
  clearAllConversations,
  createNewConversation,
  setActiveConversationId,
  getOrCreateActiveConversation,
  formatConversationTime,
  createWelcomeMessage,
} from '../utils/chatStorage';

// Localize options by fieldKey or value lookup across supported languages
const getLocalizedOptions = (options, fieldKey, targetLang) => {
  if (fieldKey && DEFAULT_OPTIONS_BY_FIELD[fieldKey]?.[targetLang]) {
    return DEFAULT_OPTIONS_BY_FIELD[fieldKey][targetLang];
  }
  if (!Array.isArray(options) || options.length === 0) return [];
  return options.map((opt) => {
    const val = opt.value || opt.label;
    for (const fKey of Object.keys(DEFAULT_OPTIONS_BY_FIELD)) {
      const match = DEFAULT_OPTIONS_BY_FIELD[fKey][targetLang]?.find((o) => o.value === val);
      if (match) return match;
    }
    return opt;
  });
};

// Localize recommended scheme cards by scheme ID across supported languages
const getLocalizedSchemes = (schemes, targetLang) => {
  if (!Array.isArray(schemes) || schemes.length === 0) return [];
  return schemes.map((s) => {
    if (targetLang === 'hi') {
      const hiData = SCHEME_TRANSLATIONS[s.id];
      if (hiData) {
        return {
          ...s,
          title: hiData.title || s.title,
          benefit: hiData.financialBenefit || s.benefit,
          keyCriteria: (hiData.eligibilityCriteria && hiData.eligibilityCriteria[0]) || s.keyCriteria,
          documentsRequired:
            hiData.documentsRequired && hiData.documentsRequired.length > 0
              ? hiData.documentsRequired
              : s.documentsRequired,
        };
      }
    } else {
      const enData = MOCK_SCHEMES.find((item) => item.id === s.id);
      if (enData) {
        return {
          ...s,
          title: enData.title || s.title,
          benefit: enData.financialBenefit || s.benefit,
          keyCriteria: (enData.eligibilityCriteria && enData.eligibilityCriteria[0]) || s.keyCriteria,
          documentsRequired:
            enData.documentsRequired && enData.documentsRequired.length > 0
              ? enData.documentsRequired
              : s.documentsRequired,
        };
      }
    }
    return s;
  });
};

export default function AIAssistantPage() {
  const { language } = useTranslation();
  useDocumentTitle(language === 'hi' ? 'नागरिक AI सहायक' : 'AI Assistant');
  const { user } = useAuth();

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Stored Citizen Profile
  const [profile, setProfile] = useState(null);

  // Active conversation & persistent chat history state
  const [activeConversationId, setActiveConversationIdState] = useState(() => {
    if (typeof window === 'undefined') return 'conv_init';
    const conv = getOrCreateActiveConversation(user?.id, language);
    return conv.id;
  });

  const [conversations, setConversations] = useState(() => {
    if (typeof window === 'undefined') return [];
    return getConversations(user?.id);
  });

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Guided assistant interactive selection states
  const [selectedOptionsMap, setSelectedOptionsMap] = useState(() => {
    if (typeof window === 'undefined') return {};
    const conv = getOrCreateActiveConversation(user?.id, language);
    return conv.selectedOptionsMap || {};
  });
  const [multiDrafts, setMultiDrafts] = useState(() => {
    if (typeof window === 'undefined') return {};
    const conv = getOrCreateActiveConversation(user?.id, language);
    return conv.multiDrafts || {};
  });

  // Chat message history restored from active conversation or initialized with welcome
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') {
      return [
        {
          id: 'welcome',
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: TRANSLATIONS[language]?.welcomeMessage || TRANSLATIONS.en.welcomeMessage,
          originalText: TRANSLATIONS[language]?.welcomeMessage || TRANSLATIONS.en.welcomeMessage,
          originalLanguage: language,
          translations: {
            en: TRANSLATIONS.en.welcomeMessage,
            hi: TRANSLATIONS.hi.welcomeMessage,
          },
          sources: ['india.gov.in', 'myscheme.gov.in'],
          isDemoMode: false,
          isTranslating: false,
        },
      ];
    }
    const conv = getOrCreateActiveConversation(user?.id, language);
    return conv.messages && conv.messages.length > 0 ? conv.messages : [createWelcomeMessage(language)];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const activeAbortControllerRef = useRef(null);

  // Translation cache & active language trackers
  const activeLanguageRef = useRef(language);
  const translationCacheRef = useRef({
    welcome: {
      en: {
        text: TRANSLATIONS.en.welcomeMessage,
        options: [],
        recommendedSchemes: [],
      },
      hi: {
        text: TRANSLATIONS.hi.welcomeMessage,
        options: [],
        recommendedSchemes: [],
      },
    },
  });
  const inFlightTranslationsRef = useRef(new Set());

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

  // Load citizen profile and sync user conversation workspace on mount or user change
  useEffect(() => {
    const loadedProfile = loadCitizenProfile();
    if (loadedProfile && (loadedProfile.age || loadedProfile.state || loadedProfile.occupation)) {
      setProfile(loadedProfile);
    } else {
      setProfile(null);
    }

    const conv = getOrCreateActiveConversation(user?.id, language);
    setActiveConversationIdState(conv.id);
    setMessages(conv.messages && conv.messages.length > 0 ? conv.messages : [createWelcomeMessage(language)]);
    setSelectedOptionsMap(conv.selectedOptionsMap || {});
    setMultiDrafts(conv.multiDrafts || {});
    setConversations(getConversations(user?.id));
  }, [user]);

  // Close history drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showHistoryDrawer) {
        setShowHistoryDrawer(false);
      }
    };
    if (showHistoryDrawer) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHistoryDrawer]);

  // Handle immediate language switching across all existing AI messages and active speech tools
  useEffect(() => {
    const prevLang = activeLanguageRef.current;
    activeLanguageRef.current = language;

    // Clean up active speech recognition
    handleLanguageChange(language);

    if (prevLang === language) return;

    // Identify messages needing translation
    const untranslatedMessages = [];

    setMessages((prevMessages) => {
      return prevMessages.map((msg) => {
        if (msg.sender !== 'assistant') {
          return msg;
        }

        if (msg.id === 'welcome') {
          const welcomeText = TRANSLATIONS[language]?.welcomeMessage || TRANSLATIONS.en.welcomeMessage;
          return {
            ...msg,
            text: welcomeText,
            isTranslating: false,
          };
        }

        // Check cache
        const cached = translationCacheRef.current[msg.id]?.[language];
        if (cached && cached.text) {
          return {
            ...msg,
            text: cached.text,
            options: cached.options && cached.options.length > 0 ? cached.options : getLocalizedOptions(msg.options, msg.fieldKey, language),
            recommendedSchemes: cached.recommendedSchemes && cached.recommendedSchemes.length > 0 ? cached.recommendedSchemes : getLocalizedSchemes(msg.recommendedSchemes, language),
            isTranslating: false,
          };
        }

        // If not cached, mark as translating and collect
        untranslatedMessages.push(msg);
        return {
          ...msg,
          // Pre-localize options and schemes if possible while text is being translated
          options: getLocalizedOptions(msg.options, msg.fieldKey, language),
          recommendedSchemes: getLocalizedSchemes(msg.recommendedSchemes, language),
          isTranslating: true,
        };
      });
    });

    // If there are messages to translate, trigger translation API call
    if (untranslatedMessages.length > 0) {
      const messagesToFetch = untranslatedMessages.filter(
        (m) => !inFlightTranslationsRef.current.has(`${m.id}_${language}`)
      );

      if (messagesToFetch.length > 0) {
        messagesToFetch.forEach((m) => {
          inFlightTranslationsRef.current.add(`${m.id}_${language}`);
        });

        (async () => {
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: messagesToFetch.map((m) => ({
                  id: m.id,
                  text: m.originalText || m.text,
                  options: m.options,
                  recommendedSchemes: m.recommendedSchemes,
                  fieldKey: m.fieldKey,
                })),
                targetLanguage: language,
                sourceLanguage: prevLang,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.translations)) {
                data.translations.forEach((item) => {
                  if (!translationCacheRef.current[item.id]) {
                    translationCacheRef.current[item.id] = {};
                  }
                  translationCacheRef.current[item.id][language] = {
                    text: item.translatedText,
                    options: item.translatedOptions,
                    recommendedSchemes: item.translatedSchemes,
                  };
                });
              }
            }
          } catch (err) {
            console.error('Translation error:', err);
          } finally {
            messagesToFetch.forEach((m) => {
              inFlightTranslationsRef.current.delete(`${m.id}_${language}`);
            });

            // Prevent race condition: only update UI if user is still on this language
            if (activeLanguageRef.current === language) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.sender === 'assistant' && m.id !== 'welcome') {
                    const cached = translationCacheRef.current[m.id]?.[language];
                    if (cached && cached.text) {
                      return {
                        ...m,
                        text: cached.text,
                        options: cached.options && cached.options.length > 0 ? cached.options : m.options,
                        recommendedSchemes: cached.recommendedSchemes && cached.recommendedSchemes.length > 0 ? cached.recommendedSchemes : m.recommendedSchemes,
                        isTranslating: false,
                      };
                    }
                    return { ...m, isTranslating: false };
                  }
                  return m;
                })
              );
            }
          }
        })();
      }
    }
  }, [language]);

  // Clean up active speech recognition on language change
  const handleLanguageChange = (newLang) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsConnectingMic(false);
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
        const frameId = window.requestAnimationFrame(() => {
          window.requestAnimationFrame(scrollToAIMessageStart);
        });
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

  // Development-only diagnostics tracking container scroll position
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

    if (container) {
      container.addEventListener('scroll', handleContainerScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleContainerScroll);
      }
    };
  }, []);

  // Clean up any ongoing STT on unmount
  useEffect(() => {
    return () => {
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
    } else if (fieldKey === 'age' || fieldKey === 'ageGroup') {
      const parsedGroup = parseAgeGroupFromText(String(value));
      if (parsedGroup) {
        updated.age = parsedGroup.representativeAge;
        updated.ageGroup = parsedGroup.labelEn;
      } else {
        const num = Number(value);
        if (!isNaN(num) && num >= 1 && num <= 120) {
          updated.age = num;
          updated.ageGroup = determineAgeGroup(num, 'en');
        } else {
          const ageResult = extractAgeFromText(String(value), language);
          if (ageResult.valid) {
            updated.age = ageResult.age;
            updated.ageGroup = ageResult.ageGroup || determineAgeGroup(ageResult.age, 'en');
          }
        }
      }
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
    if (isTyping || selectedOptionsMap[msg.id]) return;
    const chosenValue = option.value || option.label;
    const chosenLabel = option.label || option.value;
    const updatedMap = { ...selectedOptionsMap, [msg.id]: chosenLabel };
    setSelectedOptionsMap(updatedMap);
    if (activeConversationId) {
      updateConversationSelectedOptions(activeConversationId, updatedMap, user?.id);
    }
    if (msg.fieldKey) {
      updateProfileField(msg.fieldKey, chosenValue);
    }
    handleSendMessage(chosenValue);
  };

  const handleResetQuestionChoice = (msgId) => {
    setSelectedOptionsMap((prev) => {
      const next = { ...prev };
      delete next[msgId];
      if (activeConversationId) {
        updateConversationSelectedOptions(activeConversationId, next, user?.id);
      }
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
    const updatedMap = { ...selectedOptionsMap, [msg.id]: text };
    setSelectedOptionsMap(updatedMap);
    if (activeConversationId) {
      updateConversationSelectedOptions(activeConversationId, updatedMap, user?.id);
    }
    handleSendMessage(text);
  };

  const handleSkipQuestion = (msg) => {
    if (isTyping) return;
    const skipLabel = language === 'hi' ? 'यह प्रश्न छोड़ें' : 'Skip this question';
    const updatedMap = { ...selectedOptionsMap, [msg.id]: language === 'hi' ? 'छोड़ा गया' : 'Skipped' };
    setSelectedOptionsMap(updatedMap);
    if (activeConversationId) {
      updateConversationSelectedOptions(activeConversationId, updatedMap, user?.id);
    }
    handleSendMessage(skipLabel);
  };

  // Send Message to Server API /api/chat with immediate automatic persistence
  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = (customPrompt !== null ? customPrompt : inputPrompt).trim();
    if (!textToSend || isTyping) return;

    // Stop active speech recognition
    if ((isListening || isConnectingMic) && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setIsConnectingMic(false);
    }

    const userMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend,
    };

    // Append user message immediately and persist so navigation or reload preserves conversation
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setInputPrompt('');
    setIsTyping(true);

    const currentConvId = activeConversationId;
    updateConversationMessages(currentConvId, messagesWithUser, selectedOptionsMap, user?.id);
    setConversations(getConversations(user?.id));

    // Abort controller for safe cancellation if user starts New Chat or switches conversation
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    try {
      // Build conversation history for context
      const historyPayload = messagesWithUser.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      // Check if user is answering an age question or providing age
      const lastAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant');
      const isAgeQuestion = lastAssistantMsg && (
        lastAssistantMsg.fieldKey === 'age' ||
        lastAssistantMsg.fieldKey === 'ageGroup' ||
        /tell me your age|अपनी उम्र बताएं|age group|आयु वर्ग/i.test(lastAssistantMsg.text || '')
      );

      let activeProfile = profile ? { ...profile } : {};
      const ageResult = extractAgeFromText(textToSend, language);

      if (ageResult.valid && (isAgeQuestion || !activeProfile.age)) {
        activeProfile.age = ageResult.age;
        if (ageResult.ageGroup) {
          activeProfile.ageGroup = ageResult.ageGroup;
        }
        updateProfileField('age', textToSend);
        if (lastAssistantMsg && !selectedOptionsMap[lastAssistantMsg.id]) {
          const updatedMap = { ...selectedOptionsMap, [lastAssistantMsg.id]: textToSend };
          setSelectedOptionsMap(updatedMap);
          if (activeConversationId) {
            updateConversationSelectedOptions(activeConversationId, updatedMap, user?.id);
          }
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          prompt: textToSend,
          history: historyPayload,
          language,
          profile: activeProfile,
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

      // Safe structured response parsing to guarantee clean text and parsed control fields
      const structured = parseStructuredResponse(data, language);

      const assistantMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: structured.reply,
        originalText: structured.reply,
        originalLanguage: language,
        translations: {
          [language]: structured.reply,
        },
        questionType: structured.questionType || 'none',
        fieldKey: structured.fieldKey || null,
        options: Array.isArray(structured.options) ? structured.options : [],
        allowSkip: !!structured.allowSkip,
        recommendedSchemes: Array.isArray(structured.recommendedSchemes) ? structured.recommendedSchemes : [],
        sources: data.sources || ['india.gov.in', 'myscheme.gov.in'],
        isDemoMode: !!data.isDemoMode,
        demoReason: data.demoReason,
        modelUsed: data.modelUsed,
        isTranslating: false,
      };

      // Seed translation cache for this message
      translationCacheRef.current[assistantMessage.id] = {
        [language]: {
          text: assistantMessage.text,
          options: assistantMessage.options,
          recommendedSchemes: assistantMessage.recommendedSchemes,
        },
      };

      // If user switched language while waiting for response, translate immediately
      if (activeLanguageRef.current !== language) {
        const curLang = activeLanguageRef.current;
        assistantMessage.isTranslating = true;
        const messagesWithAssistant = [...messagesWithUser, assistantMessage];
        setMessages(messagesWithAssistant);
        updateConversationMessages(currentConvId, messagesWithAssistant, selectedOptionsMap, user?.id);
        setConversations(getConversations(user?.id));

        // Immediate background translation of new message to active language
        (async () => {
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: abortController.signal,
              body: JSON.stringify({
                messages: [
                  {
                    id: assistantMessage.id,
                    text: assistantMessage.originalText,
                    options: assistantMessage.options,
                    recommendedSchemes: assistantMessage.recommendedSchemes,
                    fieldKey: assistantMessage.fieldKey,
                  },
                ],
                targetLanguage: curLang,
                sourceLanguage: language,
              }),
            });
            if (res.ok) {
              const transData = await res.json();
              if (Array.isArray(transData?.translations) && transData.translations[0]) {
                const tr = transData.translations[0];
                if (!translationCacheRef.current[assistantMessage.id]) {
                  translationCacheRef.current[assistantMessage.id] = {};
                }
                translationCacheRef.current[assistantMessage.id][curLang] = {
                  text: tr.translatedText,
                  options: tr.translatedOptions,
                  recommendedSchemes: tr.translatedSchemes,
                };
                if (activeLanguageRef.current === curLang) {
                  setMessages((prev) => {
                    const next = prev.map((m) =>
                      m.id === assistantMessage.id
                        ? {
                            ...m,
                            text: tr.translatedText,
                            options: tr.translatedOptions || m.options,
                            recommendedSchemes: tr.translatedSchemes || m.recommendedSchemes,
                            isTranslating: false,
                          }
                        : m
                    );
                    updateConversationMessages(currentConvId, next, selectedOptionsMap, user?.id);
                    return next;
                  });
                }
              }
            }
          } catch {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMessage.id ? { ...m, isTranslating: false } : m))
            );
          }
        })();
      } else {
        const messagesWithAssistant = [...messagesWithUser, assistantMessage];
        setMessages(messagesWithAssistant);
        updateConversationMessages(currentConvId, messagesWithAssistant, selectedOptionsMap, user?.id);
        setConversations(getConversations(user?.id));
      }
    } catch (err) {
      if (err.name === 'AbortError' || abortController.signal.aborted) {
        return;
      }
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

      const messagesWithError = [...messagesWithUser, errorMessage];
      setMessages(messagesWithError);
      updateConversationMessages(currentConvId, messagesWithError, selectedOptionsMap, user?.id);
      setConversations(getConversations(user?.id));
    } finally {
      if (!abortController.signal.aborted) {
        setIsTyping(false);
      }
    }
  };

  // Clear current active conversation back to welcome message
  const handleClearChat = () => {
    if (window.confirm(t.clearConfirm)) {
      lastScrolledMessageIdRef.current = null;
      lastScrolledUserMessageIdRef.current = null;
      translationCacheRef.current = {
        welcome: {
          en: {
            text: TRANSLATIONS.en.welcomeMessage,
            options: [],
            recommendedSchemes: [],
          },
          hi: {
            text: TRANSLATIONS.hi.welcomeMessage,
            options: [],
            recommendedSchemes: [],
          },
        },
      };
      const welcome = createWelcomeMessage(language);
      setMessages([welcome]);
      setSelectedOptionsMap({});
      setMultiDrafts({});
      updateConversationMessages(activeConversationId, [welcome], {}, user?.id);
      setConversations(getConversations(user?.id));
    }
  };

  // Start a fresh new conversation (+ New Chat)
  const handleNewChat = () => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setIsTyping(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsConnectingMic(false);

    const newConv = createNewConversation(language);
    saveConversation(newConv, user?.id);
    setActiveConversationId(newConv.id, user?.id);

    setActiveConversationIdState(newConv.id);
    setMessages(newConv.messages);
    setSelectedOptionsMap({});
    setMultiDrafts({});
    setInputPrompt('');
    lastScrolledMessageIdRef.current = null;
    lastScrolledUserMessageIdRef.current = null;

    setConversations(getConversations(user?.id));
    setShowHistoryDrawer(false);
  };

  // Open existing conversation from chat history
  const handleSelectConversation = (convId) => {
    if (convId === activeConversationId) {
      setShowHistoryDrawer(false);
      return;
    }

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setIsTyping(false);

    const target = getConversationById(convId, user?.id);
    if (!target) return;

    setActiveConversationId(target.id, user?.id);
    setActiveConversationIdState(target.id);
    setMessages(target.messages);
    setSelectedOptionsMap(target.selectedOptionsMap || {});
    setMultiDrafts(target.multiDrafts || {});
    setInputPrompt('');

    const targetLatestAssistant = [...target.messages].reverse().find(
      (m) => m.sender === 'assistant' && m.id !== 'welcome'
    );
    lastScrolledMessageIdRef.current = targetLatestAssistant?.id || null;
    const targetLatestUser = [...target.messages].reverse().find(
      (m) => m.sender === 'user'
    );
    lastScrolledUserMessageIdRef.current = targetLatestUser?.id || null;

    target.messages.forEach((m) => {
      if (m.sender === 'assistant') {
        if (!translationCacheRef.current[m.id]) {
          translationCacheRef.current[m.id] = {};
        }
        if (m.translations) {
          Object.entries(m.translations).forEach(([l, txt]) => {
            translationCacheRef.current[m.id][l] = {
              text: txt,
              options: m.options,
              recommendedSchemes: m.recommendedSchemes,
            };
          });
        }
      }
    });

    setShowHistoryDrawer(false);
  };

  // Delete an individual conversation
  const handleDeleteConversation = (convId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(t.deleteChatConfirm || 'Are you sure you want to delete this conversation?')) {
      return;
    }

    deleteConversation(convId, user?.id);
    const remaining = getConversations(user?.id);
    setConversations(remaining);

    if (convId === activeConversationId) {
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // Clear entire conversation history
  const handleClearAllHistory = () => {
    if (!window.confirm(t.clearAllHistoryConfirm || 'Are you sure you want to clear your entire chat history? This cannot be undone.')) {
      return;
    }

    clearAllConversations(user?.id);
    setConversations([]);
    handleNewChat();
  };

  // Safe formatting for bold text and bullet points
  const formatMessageText = (content) => {
    if (!content || typeof content !== 'string') return null;

    // Safety guard: if raw JSON ever reaches formatMessageText, parse and display only the reply
    let textToFormat = content;
    const trimmed = textToFormat.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('```') || trimmed.includes('"reply"')) {
      const parsed = parseStructuredResponse(textToFormat);
      if (parsed.reply && parsed.reply !== textToFormat) {
        textToFormat = parsed.reply;
      }
    }

    const lines = textToFormat.split('\n');
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
    <div className="py-4 sm:py-6 flex-1 flex flex-col max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
      {/* Header bar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pb-3.5 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-teal-100" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-navy-900 truncate">
                {t.title}
              </h1>
              <Badge variant="teal">{t.badgeStatus}</Badge>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls: Chat History, + New Chat, Clear */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Chat History Button */}
          <button
            type="button"
            onClick={() => {
              setConversations(getConversations(user?.id));
              setShowHistoryDrawer(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-teal-700 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title={t.chatHistory || 'Chat History'}
            aria-label={t.chatHistory || 'Chat History'}
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{t.chatHistory || 'Chat History'}</span>
            {conversations.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                {conversations.length}
              </span>
            )}
          </button>

          {/* + New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm cursor-pointer"
            title={t.newChat ? `+ ${t.newChat.replace(/^\+\s*/, '')}` : '+ New Chat'}
            aria-label={t.newChat ? `+ ${t.newChat.replace(/^\+\s*/, '')}` : '+ New Chat'}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.newChat ? t.newChat.replace(/^\+\s*/, '') : 'New Chat'}</span>
          </button>

          {/* Clear Current Chat Button */}
          <button
            type="button"
            onClick={handleClearChat}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors shrink-0 cursor-pointer"
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
          to="/eligibility"
          className="font-medium text-teal-800 hover:text-teal-950 underline self-start sm:self-auto shrink-0"
        >
          {t.editProfile}
        </Link>
      </div>

      {/* Chat Thread Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm mt-3.5 flex flex-col overflow-hidden h-[calc(100dvh-200px)] min-h-[520px] max-h-[860px]">
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
                  {msg.isTranslating ? (
                    <div className="py-2.5 px-3 bg-teal-50/80 border border-teal-200/70 rounded-xl text-xs text-teal-900 flex items-center gap-2.5 animate-pulse my-1">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
                      <span className="font-medium">
                        {language === 'hi' ? 'हिन्दी में अनुवाद किया जा रहा है...' : 'Translating to English...'}
                      </span>
                    </div>
                  ) : (
                    formatMessageText(msg.text)
                  )}
                </div>

                {/* Single-Choice Clickable Options */}
                {msg.sender === 'assistant' && msg.questionType === 'single_choice' && msg.options && msg.options.length > 0 && (() => {
                  const isAgeField = msg.fieldKey === 'age' || msg.fieldKey === 'ageGroup';
                  const isAlreadyAnswered = !!selectedOptionsMap[msg.id];
                  const needsAge = !profile?.age && msg.id === latestAssistantMessageId;

                  // Remove the options after the user selects one; display only when the conversation needs the user's age
                  if (isAgeField && (isAlreadyAnswered || !needsAge)) {
                    return null;
                  }

                  return (
                    <div className="pt-2.5 mt-2 border-t border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t.selectOptionPrompt || 'Please choose an option:'}</span>
                        </p>
                        {!isAgeField && selectedOptionsMap[msg.id] && (
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
                          const isDisabled = isTyping || !!selectedOptionsMap[msg.id];
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleSelectOption(msg, opt)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs flex items-center gap-1.5 ${
                                isDisabled
                                  ? 'disabled:opacity-60 disabled:cursor-not-allowed'
                                  : 'cursor-pointer active:scale-[0.98]'
                              } ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 ring-2 ring-teal-200 shadow-sm'
                                  : 'bg-white text-navy-900 border-slate-300 hover:border-teal-500 hover:bg-teal-50/70'
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
                            disabled={isTyping || !!selectedOptionsMap[msg.id]}
                            onClick={() => handleSkipQuestion(msg)}
                            className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40 font-medium underline inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <span>{t.skipQuestion || 'Skip this question →'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                              {language === 'hi' ? 'सत्यापित योजना' : 'Verified Scheme'}
                            </span>
                          </div>

                          {scheme.benefit && (
                            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-lg p-2 text-xs text-emerald-950 font-medium">
                              <span className="text-emerald-900 font-bold block text-[10px] uppercase tracking-wide">
                                {language === 'hi' ? 'मुख्य लाभ:' : 'Benefit:'}
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
                              to={scheme.id ? `/eligibility?scheme=${encodeURIComponent(scheme.id)}` : '/eligibility'}
                              state={{ schemeId: scheme.id, schemeTitle: scheme.title }}
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

                {/* Assistant Controls: Copy */}
                {msg.sender === 'assistant' && !msg.isError && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 text-slate-500 text-xs">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
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

      {/* Slide-over Chat History Drawer */}
      {showHistoryDrawer && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={t.chatHistory || 'Chat History'}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setShowHistoryDrawer(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-fadeIn">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-navy-950">
                  {t.chatHistory || 'Chat History'}
                </h2>
                {conversations.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 rounded-full">
                    {conversations.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                aria-label="Close chat history"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action: + New Chat */}
            <div className="p-3 border-b border-slate-100">
              <button
                type="button"
                onClick={handleNewChat}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                title={t.newChat ? `+ ${t.newChat.replace(/^\+\s*/, '')}` : '+ New Chat'}
                aria-label={t.newChat ? `+ ${t.newChat.replace(/^\+\s*/, '')}` : '+ New Chat'}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{t.newChat ? t.newChat.replace(/^\+\s*/, '') : 'New Chat'}</span>
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {t.noHistory || 'No previous conversations yet.'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {t.noHistorySubtitle || 'Start asking questions to explore Indian welfare schemes.'}
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const messageCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
                  const lastMsg = Array.isArray(conv.messages) && conv.messages.length > 1
                    ? conv.messages[conv.messages.length - 1]
                    : null;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`group p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-300 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <h3 className="font-semibold text-xs text-navy-950 truncate">
                            {conv.title || (language === 'hi' ? 'नयी बातचीत' : 'New Conversation')}
                          </h3>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors shrink-0"
                          title={t.deleteChat || 'Delete conversation'}
                          aria-label={t.deleteChat || 'Delete conversation'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Snippet / preview of last message */}
                      {lastMsg && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 pl-6">
                          {lastMsg.text.replace(/[*#_~`[\]()]/g, '').slice(0, 70)}
                        </p>
                      )}

                      {/* Footer: Date & Message Count & Active Tag */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pl-6">
                        <span>{formatConversationTime(conv.updatedAt || conv.createdAt, language)}</span>
                        <div className="flex items-center gap-2">
                          <span>
                            {(t.messagesCount || '{count} messages').replace('{count}', messageCount)}
                          </span>
                          {isActive && (
                            <span className="font-bold text-teal-700 bg-teal-100/90 px-1.5 py-0.2 rounded-full">
                              {t.activeChat || 'Active'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer Actions */}
            {conversations.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearAllHistory || 'Clear All History'}</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
