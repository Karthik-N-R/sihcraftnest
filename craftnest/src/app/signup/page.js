"use client";

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../login/login.css';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seller'); // Default to Seller
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const res = signup({ name, email, password, role });
    setIsSubmitting(false);

    if (res.success) {
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
            <h2>Join CraftNest</h2>
            <p className="text-gray">Create an account as an Artisan Seller or Buyer.</p>
          </div>

          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form mt-md">
            {/* Account Role Selection */}
            <div className="form-group mb-md">
              <label className="field-label">Select Account Role</label>
              <div className="role-selector-grid">
                <div 
                  className={`role-card-option ${role === 'seller' ? 'selected' : ''}`}
                  onClick={() => setRole('seller')}
                >
                  <span className="role-title">🎨 Artisan Seller</span>
                  <span className="role-desc">Digitize & sell handcrafted art</span>
                </div>
                <div 
                  className={`role-card-option ${role === 'buyer' ? 'selected' : ''}`}
                  onClick={() => setRole('buyer')}
                >
                  <span className="role-title">🛍️ Craft Buyer</span>
                  <span className="role-desc">Discover & buy unique crafts</span>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="form-group mb-md">
              <label className="field-label" htmlFor="signup-name">Full Name</label>
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
              <label className="field-label" htmlFor="signup-email">Email Address</label>
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

            {/* Password */}
            <div className="form-group mb-lg">
              <label className="field-label" htmlFor="signup-password">Password</label>
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
              {isSubmitting ? 'Creating Account...' : `Sign Up as ${role === 'seller' ? 'Seller' : 'Buyer'}`}
            </button>
          </form>

          <div className="auth-footer text-center mt-lg">
            <p className="text-gray">
              Already have an account?{' '}
              <Link href="/login" className="auth-link">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
