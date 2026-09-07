import React, { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';

const MAX_RECORDING_SECONDS = 30;

export default function VoiceRecorder({ 
  language = 'ta-IN', 
  setLanguage, 
  onRecordingComplete 
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const handleLanguageChange = (lang) => {
    if (!isRecording && setLanguage) {
      setLanguage(lang);
    }
  };

  // Timer effect when recording
  useEffect(() => {
    if (isRecording) {
      setSecondsElapsed(0);
      setLimitReached(false);
      timerIntervalRef.current = setInterval(() => {
        setSecondsElapsed(prev => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            clearInterval(timerIntervalRef.current);
            stopRecording(true);
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    setErrorMessage(null);
    setLimitReached(false);

    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Audio recording is not supported in this browser. Please try Chrome, Edge, or Firefox.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mimeType
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        if (audioChunksRef.current.length === 0) {
          setErrorMessage("No audio was detected. Please try recording again.");
          return;
        }

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (audioBlob.size === 0) {
          setErrorMessage("Recording was empty. Please speak clearly into your microphone.");
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, language);
        }
      };

      mediaRecorder.start(250); // Collect slices every 250ms
      setIsRecording(true);
      setRecordedAudioUrl(null);
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage("Microphone access was denied. Please allow microphone permission in your browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage("No microphone was found on your device. Please plug in a microphone and try again.");
      } else {
        setErrorMessage("Unable to access microphone. Please check your browser audio settings.");
      }
    }
  };

  const stopRecording = (hitLimit = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (hitLimit) {
      setLimitReached(true);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording(false);
    } else {
      startRecording();
    }
  };

  const handleReRecord = () => {
    setRecordedAudioUrl(null);
    setLimitReached(false);
    setErrorMessage(null);
    startRecording();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="voice-recorder-container" id="voice-recorder-container">
      <div className="language-selector" id="language-selector">
        <button 
          className={`lang-pill ${language === 'ta-IN' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('ta-IN')}
          disabled={isRecording}
          type="button"
          id="lang-pill-ta"
        >
          Tamil (தமிழ்)
        </button>
        <button 
          className={`lang-pill ${language === 'hi-IN' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('hi-IN')}
          disabled={isRecording}
          type="button"
          id="lang-pill-hi"
        >
          Hindi (हिन्दी)
        </button>
      </div>

      <div className="record-area" id="record-area">
        <button 
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          id="record-btn"
          type="button"
          title={isRecording ? "Stop Recording" : "Start Recording"}
        >
          <div className="record-icon" id="record-icon"></div>
        </button>
        
        {isRecording && (
          <div className="pulse-ring" id="pulse-ring"></div>
        )}
      </div>

      <div className="record-status" id="record-status">
        {isRecording ? (
          <div>
            <span>Recording... Speak naturally</span>
            <div className="record-timer">{formatTimer(secondsElapsed)} / 0:30</div>
          </div>
        ) : recordedAudioUrl ? (
          <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>✓ Recording captured!</span>
        ) : (
          "Click the mic to describe your craft"
        )}
      </div>

      {limitReached && (
        <div className="voice-warning-badge">
          Maximum limit of 30 seconds reached. Audio saved!
        </div>
      )}

      {errorMessage && (
        <div className="voice-error-banner">
          {errorMessage}
        </div>
      )}

      {recordedAudioUrl && !isRecording && (
        <div className="audio-preview-container animate-fade-in">
          <audio controls src={recordedAudioUrl}>
            Your browser does not support the audio element.
          </audio>
          <button 
            type="button"
            className="re-record-btn"
            onClick={handleReRecord}
          >
            🎙️ Re-record Voice
          </button>
        </div>
      )}
    </div>
  );
}
