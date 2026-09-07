"use client";

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import StepWizard from '../../components/StepWizard';
import ImageUploader from '../../components/ImageUploader';
import CraftDetectionResult from '../../components/CraftDetectionResult';
import VoiceRecorder from '../../components/VoiceRecorder';
import ListingPreview from '../../components/ListingPreview';
import MissingFieldCollector from '../../components/MissingFieldCollector';
import { classifyImage } from '../../lib/classifiers/classifierProvider';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import './sell.css';

export default function SellPage() {
  const router = useRouter();
  const { refreshProducts } = useProducts() || {};
  const { user, isAuthenticated, isLoading } = useAuth() || {};

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/sell');
    }
  }, [isLoading, isAuthenticated, router]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  
  // State for the AI workflow
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [detectionResult, setDetectionResult] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [language, setLanguage] = useState('ta-IN'); // Default to Tamil (ta-IN or hi-IN)
  const [transcript, setTranscript] = useState('');
  const [listingData, setListingData] = useState(null);

  // Missing mandatory fields workflow state
  const [isFollowUpProcessing, setIsFollowUpProcessing] = useState(false);
  const [followUpError, setFollowUpError] = useState(null);
  const [sizeConfirmed, setSizeConfirmed] = useState(false);

  const steps = [
    { title: "Upload Photo", icon: "📷" },
    { title: "Detect Craft", icon: "🔍" },
    { title: "Record Voice", icon: "🎙️" },
    { title: "Transcribe", icon: "📝" },
    { title: "Generate Listing", icon: "✨" },
    { title: "Review & Publish", icon: "🚀" }
  ];

  // Helper to determine missing mandatory fields in fixed sequence: size -> quantity -> price
  const getMissingMandatoryFields = (listing) => {
    if (!listing) return ['size', 'quantity', 'price'];
    const missing = [];

    // 1. size
    const sizeVal = listing.size || listing.dimensions;
    if (!sizeVal || (typeof sizeVal === 'string' && !sizeVal.trim())) {
      missing.push('size');
    }

    // 2. quantity
    if (
      listing.quantity === null ||
      listing.quantity === undefined ||
      listing.quantity === '' ||
      isNaN(listing.quantity) ||
      Number(listing.quantity) <= 0
    ) {
      missing.push('quantity');
    }

    // 3. price (seller's actual selling price)
    if (
      listing.price === null ||
      listing.price === undefined ||
      listing.price === '' ||
      isNaN(listing.price) ||
      Number(listing.price) <= 0
    ) {
      missing.push('price');
    }

    return missing;
  };

  // Step 0: Handle Image Selection / Removal
  const handleImageSelect = (file, dataUrl) => {
    setErrorMessage(null);
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      setDetectionResult(null);
      return;
    }

    setImageFile(file);
    if (dataUrl) {
      setImagePreview(dataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Step 1: Trigger Craft Classification
  const processImageClassification = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setProcessingMessage("Running EfficientNet craft recognition...");
    setErrorMessage(null);
    setCurrentStep(1);
    
    try {
      const result = await classifyImage(imageFile);
      setDetectionResult(result);
    } catch (err) {
      console.error("Craft classification error:", err);
      setErrorMessage("Could not identify craft automatically. You can select or override the craft type below.");
      setDetectionResult({ 
        craft: "Handcrafted Item", 
        label: "Handcrafted Item", 
        confidence: 0.75, 
        category: "Folk Art",
        region: "India",
        tags: ["artisan", "handcrafted", "traditional"] 
      });
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  // Step 3: Trigger Speech Translation with Sarvam Saaras (mode="translate")
  const processTranscription = async (blobOverride) => {
    const targetBlob = blobOverride || audioBlob;
    if (!targetBlob) {
      setErrorMessage("Please record your voice description before proceeding to transcription.");
      return;
    }
    setIsProcessing(true);
    setProcessingMessage("Translating spoken audio with Sarvam Saaras...");
    setErrorMessage(null);
    setCurrentStep(3);

    try {
      const formData = new FormData();
      let fileName = 'recording.webm';
      if (targetBlob.type) {
        const type = targetBlob.type.toLowerCase();
        if (type.includes('mp4') || type.includes('m4a')) fileName = 'recording.mp4';
        else if (type.includes('wav')) fileName = 'recording.wav';
        else if (type.includes('ogg')) fileName = 'recording.ogg';
      }
      formData.append('audio', targetBlob, fileName);
      formData.append('language', language);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (res.ok && data.transcript !== undefined && data.transcript.trim() !== '') {
        setTranscript(data.transcript.trim());
        if (data.language) {
          setLanguage(data.language);
        }
      } else {
        console.error("Transcription API response error:", data.error || data);
        const userMsg = data?.error || "We couldn't translate the recording. Please try again or type your description in English manually.";
        setErrorMessage(userMsg);
      }
    } catch (err) {
      console.error("Transcription connection error:", err);
      setErrorMessage("Connection error while sending voice recording. Please try again or type manually.");
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  // Step 4: Initial Listing Generation with Gemini
  const processListingGeneration = async () => {
    setIsProcessing(true);
    setProcessingMessage("Generating marketplace catalog with Gemini...");
    setErrorMessage(null);
    setFollowUpError(null);
    setCurrentStep(4);

    try {
      const payload = {
        craftType: detectionResult?.craft || detectionResult?.label || 'Handcrafted Item',
        confidence: detectionResult?.confidence || 0.85,
        category: detectionResult?.category || 'Folk Art',
        region: detectionResult?.region || 'India',
        tags: detectionResult?.tags || [],
        transcript,
        language
      };

      const res = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok && !data.error) {
        setListingData(data);
        if (data.sizeStatus === 'exact') {
          setSizeConfirmed(true);
        } else {
          setSizeConfirmed(false);
        }
      } else {
        console.error("Listing generation error", data);
        setErrorMessage(data?.error || "AI listing generation failed. You can edit the details manually.");
        setListingData({
          title: detectionResult?.craft ? `Handcrafted ${detectionResult.craft}` : 'Handcrafted Artisan Item',
          description: transcript || 'Authentic handcrafted piece crafted with traditional techniques.',
          category: detectionResult?.category || 'Folk Art',
          suggestedPrice: 2500,
          price: null,
          quantity: null,
          size: null,
          sizeStatus: null,
          currency: 'INR',
          materials: detectionResult?.tags || [],
          colour: null,
          dimensions: null,
          careInstructions: null,
          seoTags: detectionResult?.tags || ['handcrafted', 'artisan']
        });
      }
    } catch (err) {
      console.error("Listing generation connection error:", err);
      setErrorMessage("Connection error. You can fill in the listing details manually.");
      setListingData({
        title: 'Handcrafted Artisan Item',
        description: transcript || '',
        category: detectionResult?.category || 'Folk Art',
        suggestedPrice: 2500,
        price: null,
        quantity: null,
        size: null,
        sizeStatus: null,
        currency: 'INR',
        materials: [],
        colour: null,
        dimensions: null,
        careInstructions: null,
        seoTags: []
      });
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  // Follow-up Targeted Voice Submission Handler
  const handleFollowUpVoiceSubmit = async (audioBlob, targetField) => {
    if (!audioBlob) return;
    setIsFollowUpProcessing(true);
    setFollowUpError(null);

    try {
      const formData = new FormData();
      let fileName = 'followup.webm';
      if (audioBlob.type) {
        const type = audioBlob.type.toLowerCase();
        if (type.includes('mp4') || type.includes('m4a')) fileName = 'followup.mp4';
        else if (type.includes('wav')) fileName = 'followup.wav';
        else if (type.includes('ogg')) fileName = 'followup.ogg';
      }
      formData.append('audio', audioBlob, fileName);
      formData.append('language', language);

      // 1. Transcribe follow-up audio with Sarvam
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      const transcribeData = await transcribeRes.json();

      // 2. Enforce Sarvam Non-Empty Transcript check (Requirement #10 & #12)
      if (!transcribeRes.ok || !transcribeData.transcript || !transcribeData.transcript.trim()) {
        console.warn("Sarvam transcription failed or returned empty transcript:", transcribeData);
        setFollowUpError(
          transcribeData?.error || "Voice response was empty or not recognized. Please speak clearly into your microphone and try again."
        );
        setIsFollowUpProcessing(false);
        return;
      }

      const followUpTranscript = transcribeData.transcript.trim();

      // 3. Send targeted extraction request to Gemini
      const targetedRes = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'targeted',
          targetField,
          transcript: followUpTranscript,
          language
        })
      });

      const targetedData = await targetedRes.json();

      if (targetedRes.ok && !targetedData.error) {
        // 4. Merge targeted response into existing listing state (Requirement #6 & #7)
        setListingData(prev => {
          const updated = {
            ...prev,
            ...targetedData
          };
          if (targetedData.size) {
            updated.dimensions = targetedData.size;
          }
          return updated;
        });

        if (targetField === 'size') {
          if (targetedData.sizeStatus === 'exact') {
            setSizeConfirmed(true);
          } else {
            setSizeConfirmed(false);
          }
        }
      } else {
        setFollowUpError(targetedData?.error || `Could not extract ${targetField}. Please try recording again.`);
      }
    } catch (err) {
      console.error("Follow-up voice processing exception:", err);
      setFollowUpError("Network error while processing voice response. Please try again.");
    } finally {
      setIsFollowUpProcessing(false);
    }
  };

  // Local Size Confirmation & Correction Handlers (Requirement #11)
  const handleConfirmSizeEstimate = (confirmedSize) => {
    setListingData(prev => ({
      ...prev,
      size: confirmedSize,
      dimensions: confirmedSize,
      sizeStatus: 'exact'
    }));
    setSizeConfirmed(true);
  };

  const handleCorrectSizeEstimate = (exactSize) => {
    setListingData(prev => ({
      ...prev,
      size: exactSize,
      dimensions: exactSize,
      sizeStatus: 'exact'
    }));
    setSizeConfirmed(true);
  };

  // Step 5: Publish Product
  const handlePublish = async () => {
    setIsProcessing(true);
    setProcessingMessage("Publishing to CraftNest marketplace...");
    setErrorMessage(null);

    try {
      const finalData = {
        ...listingData,
        artisanId: user?.id || "u_demo_seller",
        artisanName: user?.name || "Rajesh Kumar (Artisan)",
        image: imagePreview
      };

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      
      if (res.ok) {
        setProcessingMessage("Published successfully!");
        if (refreshProducts) {
          await refreshProducts();
        }
        router.push('/dashboard');
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData?.error || "Failed to publish product. Please try again.");
      }
    } catch (err) {
      console.error("Publish error:", err);
      setErrorMessage("Network error while publishing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    setErrorMessage(null);
    setFollowUpError(null);
    if (currentStep === 0) processImageClassification();
    else if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) processTranscription();
    else if (currentStep === 3) processListingGeneration();
    else if (currentStep === 4) setCurrentStep(5);
  };

  const handleBack = () => {
    setErrorMessage(null);
    setFollowUpError(null);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const missingFields = getMissingMandatoryFields(listingData);
  const isSizeEstimatedUnconfirmed = listingData?.sizeStatus === 'estimated' && !sizeConfirmed;
  const isListingComplete = Boolean(listingData) && missingFields.length === 0 && !isSizeEstimatedUnconfirmed;

  const finalPriceDisplay = listingData?.price !== undefined && listingData?.price !== null
    ? `₹${Math.round(Number(listingData.price)).toLocaleString('en-IN')}`
    : (listingData?.suggestedPrice !== undefined && listingData?.suggestedPrice !== null
        ? `₹${Math.round(Number(listingData.suggestedPrice)).toLocaleString('en-IN')}`
        : '₹2,500');

  return (
    <main className="sell-page">
      <Navbar />
      
      <div className="container mt-xl">
        <h1 className="text-center mb-sm font-accent text-gradient" style={{ fontSize: '3rem' }}>Digitize Your Craft</h1>
        <p className="text-center text-gray mb-xl">Let AI transform your voice & photo into a global marketplace catalog.</p>

        {errorMessage && (
          <div className="sell-error-banner animate-fade-in" role="alert">
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <StepWizard 
          steps={steps} 
          currentStep={currentStep} 
          onNext={handleNext}
          onBack={handleBack}
          onFinish={handlePublish}
          isProcessing={isProcessing}
          canProceed={
            (currentStep === 0 && Boolean(imageFile)) ||
            (currentStep === 1 && Boolean(detectionResult) && !isProcessing) ||
            (currentStep === 2 && Boolean(audioBlob)) ||
            (currentStep === 3 && Boolean(transcript) && !isProcessing) ||
            (currentStep === 4 && isListingComplete && !isProcessing) ||
            (currentStep === 5 && !isProcessing)
          }
        >
          
          {/* Step 0: Upload Image */}
          {currentStep === 0 && (
            <div className="wizard-content-step animate-fade-in">
              <h3 className="mb-md text-center">Upload a photo of your craft</h3>
              <p className="text-center text-gray mb-lg">Take a clear photo showing the details and craftsmanship of your creation.</p>
              <ImageUploader 
                onImageSelect={handleImageSelect} 
                currentPreview={imagePreview} 
              />
            </div>
          )}

          {/* Step 1: Detect Craft */}
          {currentStep === 1 && (
            <div className="wizard-content-step animate-fade-in text-center">
              <CraftDetectionResult 
                result={detectionResult}
                imagePreview={imagePreview}
                isProcessing={isProcessing}
                onOverride={(craft) => setDetectionResult(prev => ({ ...(prev || {}), craft, label: craft }))}
              />
            </div>
          )}

          {/* Step 2: Record Voice */}
          {currentStep === 2 && (
            <div className="wizard-content-step animate-fade-in">
              <h3 className="mb-md text-center">Describe your craft</h3>
              <p className="text-center mb-lg">Select your preferred language, press the microphone, and speak naturally about materials, techniques, and the story behind your creation.</p>
              <VoiceRecorder 
                language={language}
                setLanguage={setLanguage}
                onRecordingComplete={(blob, selectedLang) => {
                  setAudioBlob(blob);
                  if (selectedLang) setLanguage(selectedLang);
                }} 
              />
            </div>
          )}

          {/* Step 3: Transcription / Translation */}
          {currentStep === 3 && (
            <div className="wizard-content-step animate-fade-in text-center">
              <h3 className="mb-md">Artisan Spoken Description (English Translation)</h3>
              {isProcessing ? (
                <div className="step-processing-status">
                  <div className="craft-loader">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <p className="step-processing-text">{processingMessage || "Translating your voice with Sarvam Saaras..."}</p>
                </div>
              ) : (
                <div className="transcript-box text-left">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="label" style={{ margin: 0 }}>
                      English Translation (from spoken {language === 'ta-IN' ? 'Tamil' : language === 'hi-IN' ? 'Hindi' : language}):
                    </label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--charcoal-light)' }}>Sarvam Saaras v3 (Translate)</span>
                  </div>
                  <textarea 
                    className="input textarea"
                    value={transcript}
                    placeholder="English translation will appear here. You can edit before generating listing..."
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={5}
                  />
                  <p className="text-gray mt-xs" style={{ fontSize: '0.85rem' }}>
                    Sarvam Saaras translated your voice directly into English. You can edit the text above before generating the listing.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Listing Generation & Missing Fields Collection */}
          {currentStep === 4 && (
            <div className="wizard-content-step animate-fade-in">
              {isProcessing ? (
                <div className="step-processing-status">
                  <div className="craft-loader">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <p className="step-processing-text">{processingMessage || "Generating your product listing..."}</p>
                </div>
              ) : (() => {
                if (missingFields.length > 0 || isSizeEstimatedUnconfirmed) {
                  const currentMissing = missingFields[0] || (isSizeEstimatedUnconfirmed ? 'size' : null);
                  return (
                    <MissingFieldCollector 
                      currentField={currentMissing}
                      language={language}
                      setLanguage={setLanguage}
                      isProcessing={isFollowUpProcessing}
                      onSubmitVoiceResponse={handleFollowUpVoiceSubmit}
                      sizeEstimate={isSizeEstimatedUnconfirmed && missingFields.length === 0 ? { isEstimated: true, value: listingData?.size } : null}
                      onConfirmSizeEstimate={handleConfirmSizeEstimate}
                      onCorrectSizeEstimate={handleCorrectSizeEstimate}
                      errorMessage={followUpError}
                      totalMissing={missingFields.length}
                      currentIndex={1}
                    />
                  );
                }

                return (
                  <ListingPreview 
                    listingData={listingData} 
                    onChange={(newData) => setListingData(newData)}
                    imagePreview={imagePreview}
                  />
                );
              })()}
            </div>
          )}

          {/* Step 5: Final Review & Publish */}
          {currentStep === 5 && (
            <div className="wizard-content-step animate-fade-in text-center">
              <h2 className="text-gradient mb-md">Ready to go live!</h2>
              <p className="mb-xl">Review your listing one last time before publishing to the marketplace feed.</p>
              
              {isProcessing ? (
                <div className="step-processing-status">
                  <div className="craft-loader">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <p className="step-processing-text">{processingMessage || "Publishing..."}</p>
                </div>
              ) : (
                <div className="final-preview-card">
                  <img src={imagePreview || '/images/products/pottery-1.jpg'} alt="Product preview" />
                  <div className="final-preview-details text-left">
                    <span className="badge badge-terracotta">{listingData?.category || 'Handcrafted'}</span>
                    <h3 className="mt-sm mb-xs">{listingData?.title || 'Handcrafted Item'}</h3>
                    <p className="price mb-sm">{finalPriceDisplay}</p>
                    <p className="desc">{listingData?.description}</p>
                    {listingData?.materials && Array.isArray(listingData.materials) && listingData.materials.length > 0 && (
                      <p className="text-gray mt-xs" style={{ fontSize: '0.8rem' }}>
                        <strong>Materials: </strong> 
                        {listingData.materials.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </StepWizard>
      </div>
    </main>
  );
}
