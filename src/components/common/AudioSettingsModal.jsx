import React, { useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  SlidersHorizontal,
  Check,
  Sparkles,
  Info,
  Play,
  Square,
} from 'lucide-react';
import { SPEED_RATES, getVoiceCategories } from '../../utils/textToSpeech';
import { useTranslation } from '../../context/LanguageContext';

export default function AudioSettingsModal({
  isOpen,
  onClose,
  language = 'en',
  availableVoices = [],
  settings = {},
  onSaveSettings,
  onPreviewVoice,
  isPreviewPlaying = false,
  onStopPreview,
}) {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isPreviewPlaying && onStopPreview) {
          onStopPreview();
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isPreviewPlaying, onStopPreview]);

  if (!isOpen) return null;

  const currentSpeed = settings.speed || 'normal';
  const preferredVoiceHi = settings.preferredVoiceHi || '';
  const preferredVoiceEn = settings.preferredVoiceEn || '';

  const { hindi, indianEnglish, otherEnglish } = getVoiceCategories(availableVoices);

  const handleSpeedSelect = (speedKey) => {
    onSaveSettings?.({ speed: speedKey });
  };

  const handleVoiceHiChange = (e) => {
    const val = e.target.value || null;
    onSaveSettings?.({ preferredVoiceHi: val });
  };

  const handleVoiceEnChange = (e) => {
    const val = e.target.value || null;
    onSaveSettings?.({ preferredVoiceEn: val });
  };

  const handleTogglePreview = () => {
    if (isPreviewPlaying) {
      onStopPreview?.();
    } else {
      onPreviewVoice?.({
        speed: currentSpeed,
        preferredVoiceHi: preferredVoiceHi || null,
        preferredVoiceEn: preferredVoiceEn || null,
        lang: language,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (isPreviewPlaying && onStopPreview) onStopPreview();
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 id="audio-settings-title" className="text-sm font-bold text-navy-950">
                {t.audioSettings || 'Voice & Speed Settings'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'hi'
                  ? 'बोलने की गति और प्राकृतिक आवाज़ अपनी पसंद से चुनें'
                  : 'Customize natural speech playback speed and preferred voices'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isPreviewPlaying && onStopPreview) onStopPreview();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Speed Selector */}
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-2">
              {t.speechSpeed || 'Speech Speed'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'slow', label: t.speedSlow || 'Slow (0.85x)', rate: '0.85x' },
                { key: 'normal', label: t.speedNormal || 'Normal (1.0x)', rate: '1.0x' },
                { key: 'fast', label: t.speedFast || 'Fast (1.2x)', rate: '1.2x' },
              ].map((sp) => {
                const isActive = currentSpeed === sp.key;
                return (
                  <button
                    key={sp.key}
                    type="button"
                    onClick={() => handleSpeedSelect(sp.key)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{sp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hindi Voice Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="select-voice-hi" className="text-xs font-bold text-navy-900">
                {t.voiceSelectHindi || 'Hindi Voice (हिन्दी)'}
              </label>
              {hindi.length > 0 && (
                <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {hindi.length} {language === 'hi' ? 'आवाज़ें उपलब्ध' : 'voices available'}
                </span>
              )}
            </div>

            <select
              id="select-voice-hi"
              value={preferredVoiceHi}
              onChange={handleVoiceHiChange}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            >
              <option value="">
                {t.voiceAutoRecommended || 'Auto-select (Best Natural Voice)'}
              </option>
              {hindi.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} {v.isRecommended ? '★ (Natural/Recommended)' : ''}
                </option>
              ))}
            </select>
            {hindi.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-700">
                {language === 'hi'
                  ? 'डिवाइस पर कोई विशिष्ट हिन्दी वॉइस नहीं मिली। डिवाइस डिफ़ॉल्ट ध्वनि का उपयोग होगा।'
                  : 'No specific Hindi voice installed on this device. Using device fallback.'}
              </p>
            )}
          </div>

          {/* English Voice Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="select-voice-en" className="text-xs font-bold text-navy-900">
                {t.voiceSelectEnglish || 'English Voice (Indian English)'}
              </label>
              {(indianEnglish.length > 0 || otherEnglish.length > 0) && (
                <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {indianEnglish.length + otherEnglish.length} {language === 'hi' ? 'आवाज़ें उपलब्ध' : 'voices available'}
                </span>
              )}
            </div>

            <select
              id="select-voice-en"
              value={preferredVoiceEn}
              onChange={handleVoiceEnChange}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            >
              <option value="">
                {t.voiceAutoRecommended || 'Auto-select (Best Natural Voice)'}
              </option>
              {indianEnglish.length > 0 && (
                <optgroup label="Indian English (en-IN)">
                  {indianEnglish.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} {v.isRecommended ? '★ (Recommended)' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherEnglish.length > 0 && (
                <optgroup label="Other English">
                  {otherEnglish.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} {v.isRecommended ? '★ (Natural)' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Preview / Test Voice Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTogglePreview}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isPreviewPlaying
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              {isPreviewPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{t.testVoiceStop || 'Stop Preview'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.testVoicePreview || 'Preview Voice'}</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-500 italic">
              {language === 'hi' ? 'नमूना वाक्य सुनें' : 'Listen to voice sample'}
            </span>
          </div>

          {/* Device Voice Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>
              {t.ttsDeviceNotice || 'Natural voices are provided by your browser and operating system.'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              if (isPreviewPlaying && onStopPreview) onStopPreview();
              onClose();
            }}
            className="px-4 py-2 bg-[#0D9488] hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            {t.ttsModalClose || 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
