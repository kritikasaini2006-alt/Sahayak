import React, { useEffect, useRef } from 'react';
import {
  MicOff,
  X,
  RotateCcw,
  SlidersHorizontal,
  Lock,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export default function MicrophonePermissionModal({
  isOpen,
  onClose,
  onTryAgain,
  isRetrying = false,
  errorMessage = null,
  language = 'en',
  translations = {},
}) {
  const modalRef = useRef(null);
  const tryAgainBtnRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management: move focus into modal when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        tryAgainBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const title =
    translations.micBlockedTitle ||
    (isHindi ? 'माइक्रोफ़ोन अनुमति अवरुद्ध है' : 'Microphone Access Blocked');

  const desc =
    translations.micBlockedDesc ||
    (isHindi
      ? 'आपके ब्राउज़र की सेटिंग्स में माइक्रोफ़ोन की अनुमति अवरुद्ध (Block) है। बोलकर पूछने के लिए कृपया इस साइट हेतु माइक्रोफ़ोन की अनुमति सक्षम करें।'
      : 'Microphone access is currently blocked by your browser settings. To use voice input, please enable microphone permission for this site.');

  const step1 =
    translations.micStep1 ||
    (isHindi
      ? 'ब्राउज़र के एड्रेस बार में बाईं ओर दिए गए ताले या सेटिंग्स आइकन (🔒) पर क्लिक करें।'
      : 'Click the site settings / lock icon (🔒) on the left side of your browser address bar.');

  const step2 =
    translations.micStep2 ||
    (isHindi
      ? 'साइट अनुमतियों में "Microphone" खोजें और इसे "Block" से बदलकर "Allow" (अनुमति दें) करें।'
      : 'Locate "Microphone" in site permissions and change it from "Block" to "Allow".');

  const step3 =
    translations.micStep3 ||
    (isHindi
      ? 'नीचे दिए गए "पुनः प्रयास करें" बटन पर क्लिक करके बोलना शुरू करें।'
      : 'Click "Try Again" below to start speaking.');

  const tryAgainText =
    translations.micTryAgain || (isHindi ? 'पुनः प्रयास करें' : 'Try Again');
  const closeText =
    translations.micClose || (isHindi ? 'रद्द करें' : 'Cancel');

  return (
    <div
      className="fixed inset-0 z-50 bg-navy-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-permission-modal-title"
      aria-describedby="mic-permission-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <MicOff className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                {isHindi ? 'ब्राउज़र अनुमति आवश्यक' : 'Browser Permission Required'}
              </span>
              <h3
                id="mic-permission-modal-title"
                className="text-base sm:text-lg font-bold text-navy-900 mt-1 leading-snug"
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={closeText}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-600">
          <p id="mic-permission-modal-desc" className="leading-relaxed">
            {desc}
          </p>

          {/* Browser Limitation Callout */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] leading-relaxed text-slate-600 space-y-1">
            <span className="font-semibold text-navy-900 block flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              {isHindi ? 'ब्राउज़र सुरक्षा दिशानिर्देश' : 'Browser Security Notice'}
            </span>
            <p>
              {isHindi
                ? 'आपकी गोपनीयता की सुरक्षा हेतु, एक बार ब्लॉक किए जाने पर ब्राउज़र किसी वेबसाइट को स्वतः अनुमति डायलॉग खोलने की अनुमति नहीं देते हैं। इसे केवल एड्रेस बार सेटिंग्स से ही बदला जा सकता है।'
                : 'For your security, web browsers control native permissions. Once blocked, websites cannot force the permission prompt to reopen automatically; it must be updated in your browser settings.'}
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2 pt-1">
            <span className="font-bold text-navy-900 uppercase tracking-wider text-[10px] block">
              {isHindi ? 'अनुमति सक्षम करने के चरण:' : 'How to enable microphone access:'}
            </span>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-teal-950">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span className="leading-relaxed flex-1">{step1}</span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-teal-950">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span className="leading-relaxed flex-1">{step2}</span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-teal-950">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span className="leading-relaxed flex-1">{step3}</span>
              </div>
            </div>
          </div>

          {/* Retry Error Banner if permission is still blocked */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            {closeText}
          </button>

          <button
            ref={tryAgainBtnRef}
            type="button"
            onClick={onTryAgain}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? (isHindi ? 'जांच रहे हैं...' : 'Checking...') : tryAgainText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

