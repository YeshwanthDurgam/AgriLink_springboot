import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import AuthService from '../services/authService';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setSubmitting(true);
    try {
      const response = await AuthService.forgotPassword(email);
      if (response.success) {
        setSubmitted(true);
        toast.success('Password reset link sent! Please check your email.');
      } else {
        toast.error(response.message || 'Failed to send reset link');
      }
    } catch (err) {
      // Still show success message to prevent email enumeration
      setSubmitted(true);
      toast.success('If your email is registered, you will receive a password reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">
              <FiCheckCircle size={60} color="#22c55e" />
            </div>
            <h1>Check Your Email</h1>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className="auth-instructions">
            <p>Please check your inbox and click on the link to reset your password.</p>
            <p className="text-muted">
              The link will expire in 30 minutes. If you don't see the email, check your spam folder.
            </p>
          </div>

          <div className="auth-actions">
            <button 
              className="btn btn-outline btn-block" 
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
            >
              Send Another Link
            </button>
          </div>

          <div className="auth-footer">
            <Link to="/login" className="back-link">
              <FiArrowLeft /> Back to Login
            </Link>
          </div>
        </div>

        <div className="auth-banner">
          <div className="banner-content">
            <h2>🌾 AgriLink</h2>
            <h3>Password Recovery</h3>
            <p>
              We take security seriously. Follow the link in your email to
              securely reset your password.
            </p>
            <ul className="banner-features">
              <li>✓ Secure password reset</li>
              <li>✓ Link expires in 30 minutes</li>
              <li>✓ One-time use token</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password?</h1>
          <p>No worries! Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your registered email"
                className={error ? 'error' : ''}
                autoComplete="email"
                autoFocus
              />
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-banner">
        <div className="banner-content">
          <h2>🌾 AgriLink</h2>
          <h3>Password Recovery</h3>
          <p>
            Don't worry, it happens to the best of us. We'll help you
            get back to your account in no time.
          </p>
          <ul className="banner-features">
            <li>✓ Secure password reset</li>
            <li>✓ Email verification</li>
            <li>✓ Quick recovery process</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
