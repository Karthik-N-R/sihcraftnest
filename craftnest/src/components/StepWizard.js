import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './StepWizard.css';

export default function StepWizard({ 
  steps = [], 
  currentStep = 0, 
  onNext, 
  onBack, 
  onFinish, 
  isProcessing, 
  canProceed, 
  children 
}) {
  const { t } = useLanguage();

  return (
    <div className="step-wizard-container" id="step-wizard-container">
      <div className="step-wizard-header" id="step-wizard-header">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            id={`step-indicator-${index}`}
          >
            <div className="step-circle" id={`step-circle-${index}`}>
              {index < currentStep ? '✓' : step.icon || (index + 1)}
            </div>
            <span className="step-label" id={`step-label-${index}`}>{step.title || step}</span>
            {index < steps.length - 1 && <div className="step-connector" id={`step-connector-${index}`}></div>}
          </div>
        ))}
      </div>
      
      <div className="step-wizard-content" id="step-wizard-content">
        {children}
      </div>

      <div className="step-wizard-footer" id="step-wizard-footer">
        <button 
          className="step-btn step-btn-back" 
          onClick={onBack} 
          disabled={currentStep === 0 || isProcessing}
          id="step-btn-back"
          type="button"
        >
          {t('backBtn')}
        </button>
        {currentStep < steps.length - 1 ? (
          <button 
            className="step-btn step-btn-next" 
            onClick={onNext} 
            disabled={!canProceed || isProcessing}
            id="step-btn-next"
            type="button"
          >
            {t('nextBtn')}
          </button>
        ) : (
          <button 
            className="step-btn step-btn-finish" 
            onClick={onFinish} 
            disabled={!canProceed || isProcessing}
            id="step-btn-finish"
            type="button"
          >
            {t('publish')}
          </button>
        )}
      </div>
    </div>
  );
}
