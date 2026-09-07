import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import VoiceRecorder from './VoiceRecorder';
import './MissingFieldCollector.css';

const PROMPTS = {
  'ta-IN': {
    size: "அளவு குறிப்பிடப்படவில்லை. தயவுசெய்து பொருளின் அளவை கூறவும்.",
    quantity: "கிடைக்கும் பொருட்களின் எண்ணிக்கை குறிப்பிடப்படவில்லை. தயவுசெய்து எண்ணிக்கையை கூறவும்.",
    price: "விற்பனை விலை குறிப்பிடப்படவில்லை. தயவுசெய்து ஒரு பொருளின் விலையை கூறவும்."
  },
  'hi-IN': {
    size: "आकार नहीं बताया गया है। कृपया उत्पाद का आकार बताएं।",
    quantity: "उपलब्ध वस्तुओं की संख्या नहीं बताई गई है। कृपया मात्रा बताएं।",
    price: "बिक्री मूल्य नहीं बताया गया है। कृपया एक वस्तु की कीमत बताएं।"
  }
};

const AUDIO_FILES = {
  'ta-IN': {
    size: '/audio/prompts/ta-size.wav',
    quantity: '/audio/prompts/ta-quantity.wav',
    price: '/audio/prompts/ta-price.wav'
  },
  'hi-IN': {
    size: '/audio/prompts/hi-size.wav',
    quantity: '/audio/prompts/hi-quantity.wav',
    price: '/audio/prompts/hi-price.wav'
  }
};

export default function MissingFieldCollector({
  currentField,
  language = 'ta-IN',
  setLanguage,
  isProcessing,
  onSubmitVoiceResponse,
  sizeEstimate,
  onConfirmSizeEstimate,
  onCorrectSizeEstimate,
  errorMessage,
  totalMissing = 1,
  currentIndex = 1
}) {
  const { t } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [editedSizeText, setEditedSizeText] = useState('');
  const audioRef = useRef(null);

  const FIELD_LABELS = {
    size: t('sizeDimensionsLabel'),
    quantity: t('availableQuantityLabel'),
    price: t('sellingPriceLabel')
  };

  const langPrompts = PROMPTS[language] || PROMPTS['ta-IN'];
  const textPrompt = langPrompts[currentField] || langPrompts.size;

  const langAudio = AUDIO_FILES[language] || AUDIO_FILES['ta-IN'];
  const audioSrc = langAudio[currentField];

  const handlePlayAudio = () => {
    setAudioError(null);

    // Stop any currently playing browser speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Use browser text-to-speech for the native-language prompt
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textPrompt);

      // Use the currently selected language
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsPlayingAudio(true);
      };

      utterance.onend = () => {
        setIsPlayingAudio(false);
      };

      utterance.onerror = (event) => {
        console.warn('Speech playback failed:', event.error);
        setIsPlayingAudio(false);
        setAudioError(
          'Audio playback is not available. Please read the prompt text below.'
        );
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    setAudioError(
      'Audio playback is not supported in this browser. Please read the prompt text below.'
    );
  };

  useEffect(() => {
    // Attempt auto-playing prompt when currentField or language changes
    if (currentField && !sizeEstimate) {
      handlePlayAudio();
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentField, language]);

  // Special Case: Estimated Size Confirmation
  if (sizeEstimate && sizeEstimate.isEstimated) {
    return (
      <div className="missing-field-card animate-fade-in" id="missing-field-card">
        <div className="missing-field-header">
          <span className="badge badge-terracotta">{t('aiEstimated')}</span>
          <h3>{t('confirmSizeMeasurement')}</h3>
        </div>

        <p className="missing-field-subtext">
          {t('sizeEstimatedFromDescription')}
        </p>

        <div className="estimated-size-box">
          <span className="size-value">"{sizeEstimate.value}"</span>
        </div>

        {isEditingEstimate ? (
          <div className="correct-size-form">
            <label className="field-label">{t('enterExactSize')}</label>
            <input 
              type="text" 
              className="input" 
              value={editedSizeText} 
              onChange={(e) => setEditedSizeText(e.target.value)}
              placeholder="e.g. 12 x 18 inches"
            />
            <div className="estimate-actions mt-sm">
              <button 
                type="button" 
                className="step-btn step-btn-next"
                onClick={() => {
                  if (editedSizeText.trim() && onCorrectSizeEstimate) {
                    onCorrectSizeEstimate(editedSizeText.trim());
                    setIsEditingEstimate(false);
                  }
                }}
              >
                {t('saveExactSize')}
              </button>
              <button 
                type="button" 
                className="step-btn step-btn-back"
                onClick={() => setIsEditingEstimate(false)}
              >
                {t('cancelBtn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="estimate-actions">
            <button 
              type="button" 
              className="confirm-btn"
              onClick={() => {
                if (onConfirmSizeEstimate) onConfirmSizeEstimate(sizeEstimate.value);
              }}
            >
              {t('confirmSizeBtn')}
            </button>
            <button 
              type="button" 
              className="correct-btn"
              onClick={() => {
                setEditedSizeText(sizeEstimate.value || '');
                setIsEditingEstimate(true);
              }}
            >
              {t('correctSizeBtn')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="missing-field-card animate-fade-in" id="missing-field-card">
      <div className="missing-field-header">
        <div className="missing-field-title">
          <span className="badge badge-terracotta">{t('missingInformation')}</span>
          <h2>{FIELD_LABELS[currentField] || currentField}</h2>
        </div>
        {totalMissing > 1 && (
          <span className="step-counter">{t('fieldCounter', { index: currentIndex, total: totalMissing })}</span>
        )}
      </div>

      {errorMessage && (
        <div className="missing-field-error" role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Native Language Prompt Banner */}
      <div className="native-prompt-container">
        <div className="prompt-text-box">
          <p className="native-prompt-text">{textPrompt}</p>
        </div>

        <button 
          type="button" 
          className={`play-prompt-btn ${isPlayingAudio ? 'playing' : ''}`}
          onClick={handlePlayAudio}
          disabled={isProcessing}
        >
          {isPlayingAudio ? t('playingAudio') : t('playPrompt')}
        </button>
      </div>

      {audioError && (
        <p className="audio-fallback-note">{audioError}</p>
      )}

      {/* Voice Recorder Section */}
      {isProcessing ? (
        <div className="missing-field-processing">
          <div className="craft-loader">
            <span></span><span></span><span></span><span></span>
          </div>
          <p className="processing-text">{t('processingVoiceResponse')}</p>
        </div>
      ) : (
        <div className="missing-field-voice-section">
          <p className="text-gray text-center mb-md" style={{ fontSize: '0.9rem' }}>
            {t('provideMissingField', { field: FIELD_LABELS[currentField] || currentField })}
          </p>
          <VoiceRecorder 
            language={language}
            setLanguage={setLanguage}
            onRecordingComplete={(blob) => {
              if (onSubmitVoiceResponse) {
                onSubmitVoiceResponse(blob, currentField);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
