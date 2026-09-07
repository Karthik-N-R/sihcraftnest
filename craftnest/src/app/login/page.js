"use client";

import { useState, Suspense } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './login.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/shop';

  const { login } = useAuth();
  const { setLanguage, t } = useLanguage() || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      if (res.user?.preferredLanguage && setLanguage) {
        setLanguage(res.user.preferredLanguage);
      }
      if (res.user?.role === 'seller' && redirectTarget === '/shop') {
        router.push('/sell');
      } else {
        router.push(redirectTarget);
      }
    } else {
      setErrorMessage(res.error);
    }
  };

  const handleDemoLogin = (demoRole) => {
    setErrorMessage(null);
    let demoEmail = 'buyer@craftnest.dev';
    if (demoRole === 'seller') {
      demoEmail = 'seller@craftnest.dev';
    }
    const res = login(demoEmail, 'password123');
    if (res.success) {
      if (res.user?.preferredLanguage && setLanguage) {
        setLanguage(res.user.preferredLanguage);
      }
      if (demoRole === 'seller') {
        router.push('/sell');
      } else {
        router.push('/shop');
      }
    } else {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="auth-card animate-fade-in">
      <div className="auth-header text-center">
        <h2>{t('logInTitle')}</h2>
        <p className="text-gray">{t('logInSub')}</p>
      </div>

      {errorMessage && (
        <div className="auth-error-banner" role="alert">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form mt-md">
        <div className="form-group mb-md">
          <label className="field-label" htmlFor="login-email">{t('emailAddress')}</label>
          <input 
            type="email" 
            id="login-email"
            className="input" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. seller@craftnest.dev"
            required
          />
        </div>

        <div className="form-group mb-lg">
          <label className="field-label" htmlFor="login-password">{t('password')}</label>
          <input 
            type="password" 
            id="login-password"
            className="input" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-block auth-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? '...' : t('logIn')}
        </button>
      </form>

      <div className="demo-accounts-box mt-lg">
        <span className="demo-label">{t('quickDemoLogin')}</span>
        <div className="demo-btn-group">
          <button 
            type="button" 
            className="btn-demo btn-demo-seller"
            onClick={() => handleDemoLogin('seller')}
          >
            {t('loginDemoSeller')}
          </button>
          <button 
            type="button" 
            className="btn-demo btn-demo-buyer"
            onClick={() => handleDemoLogin('buyer')}
          >
            {t('loginDemoBuyer')}
          </button>
        </div>
      </div>

      <div className="auth-footer text-center mt-lg">
        <p className="text-gray">
          {t('noAccount')}{' '}
          <Link href="/signup" className="auth-link">
            {t('signUpHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Navbar />
      <div className="container mt-xl">
        <Suspense fallback={<div className="text-center p-xl">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
