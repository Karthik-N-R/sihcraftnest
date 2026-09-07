"use client";

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../login/login.css';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { language, setLanguage, t } = useLanguage() || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seller'); // Default to Seller
  const [preferredLanguage, setPreferredLanguage] = useState(language || 'en');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = signup({ name, email, password, role, preferredLanguage });
    setIsSubmitting(false);

    if (res.success) {
      if (setLanguage) {
        setLanguage(preferredLanguage);
      }
      if (role === 'seller') {
        router.push('/sell');
      } else {
        router.push('/shop');
      }
    } else {
      setErrorMessage(res.error);
    }
  };

  return (
    <main className="auth-page">
      <Navbar />

      <div className="container mt-xl">
        <div className="auth-card animate-fade-in">
          <div className="auth-header text-center">
            <h2>{t('joinCraftNest')}</h2>
            <p className="text-gray">{t('createAccountSub')}</p>
          </div>

          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form mt-md">
            {/* Account Role Selection */}
            <div className="form-group mb-md">
              <label className="field-label">{t('selectRole')}</label>
              <div className="role-selector-grid">
                <div 
                  className={`role-card-option ${role === 'seller' ? 'selected' : ''}`}
                  onClick={() => setRole('seller')}
                >
                  <span className="role-title">{t('artisanSellerRole')}</span>
                  <span className="role-desc">{t('sellerDesc')}</span>
                </div>
                <div 
                  className={`role-card-option ${role === 'buyer' ? 'selected' : ''}`}
                  onClick={() => setRole('buyer')}
                >
                  <span className="role-title">{t('craftBuyerRole')}</span>
                  <span className="role-desc">{t('buyerDesc')}</span>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="form-group mb-md">
              <label className="field-label" htmlFor="signup-name">{t('fullName')}</label>
              <input 
                type="text" 
                id="signup-name"
                className="input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lakshmi Devi"
                required
              />
            </div>

            {/* Email */}
            <div className="form-group mb-md">
              <label className="field-label" htmlFor="signup-email">{t('emailAddress')}</label>
              <input 
                type="email" 
                id="signup-email"
                className="input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. lakshmi@artisan.com"
                required
              />
            </div>

            {/* Preferred Language */}
            <div className="form-group mb-md">
              <label className="field-label" htmlFor="signup-language">{t('preferredLanguage')}</label>
              <select
                id="signup-language"
                className="input select"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                style={{ height: '44px' }}
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Password */}
            <div className="form-group mb-lg">
              <label className="field-label" htmlFor="signup-password">{t('password')}</label>
              <input 
                type="password" 
                id="signup-password"
                className="input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a secure password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? '...' : (role === 'seller' ? t('signUpAsSeller') : t('signUpAsBuyer'))}
            </button>
          </form>

          <div className="auth-footer text-center mt-lg">
            <p className="text-gray">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="auth-link">
                {t('logInHere')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
