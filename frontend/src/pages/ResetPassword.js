import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import AuthService from '../services/authService';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false);
        setTokenValid(false);
        return;
      }

      try {
        const response = await AuthService.validateResetToken(token);
        setTokenValid(response.success && response.data?.valid);
      } catch (err) {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await AuthService.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      if (response.success) {
        setResetSuccess(true);
        toast.success('Password reset successful!');
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Validating...</h1>
            <p>Please wait while we verify your reset link.</p>
          </div>
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="error-icon">
              <FiAlertCircle size={60} color="#ef4444" />
            </div>
            <h1>Invalid or Expired Link</h1>
            <p>
              This password reset link is invalid or has expired.
              Please request a new one.
            </p>
          </div>

          <div className="auth-actions">
            <Link to="/forgot-password" className="btn btn-primary btn-block">
              Request New Link
            </Link>
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
            <h3>Link Expired</h3>
            <p>
              For security reasons, password reset links expire after 30 minutes.
              Please request a new link to reset your password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">
              <FiCheckCircle size={60} color="#22c55e" />
            </div>
            <h1>Password Reset Successful!</h1>
            <p>
              Your password has been successfully changed.
              You can now login with your new password.
            </p>
          </div>

          <div className="auth-actions">
            <button 
              className="btn btn-primary btn-block"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>

        <div className="auth-banner">
          <div className="banner-content">
            <h2>🌾 AgriLink</h2>
            <h3>Welcome Back!</h3>
            <p>
              Your password has been updated. You can now sign in
              with your new credentials.
            </p>
            <ul className="banner-features">
              <li>✓ Password successfully changed</li>
              <li>✓ Account secured</li>
              <li>✓ Ready to login</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className={`has-toggle ${errors.newPassword ? 'error' : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={`has-toggle ${errors.confirmPassword ? 'error' : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="password-requirements">
            <p>Password must:</p>
            <ul>
              <li className={formData.newPassword.length >= 6 ? 'valid' : ''}>
                Be at least 6 characters long
              </li>
            </ul>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-link">
            <FiArrowLeft /> Back to Login
          </Link>
        </div>
      </div>

      <div className="auth-banner">
        <div className="banner-content">
          <h2>🌾 AgriLink</h2>
          <h3>Create New Password</h3>
          <p>
            Choose a strong password to keep your account secure.
            Avoid using easily guessable information.
          </p>
          <ul className="banner-features">
            <li>✓ Use a mix of letters and numbers</li>
            <li>✓ Avoid common passwords</li>
            <li>✓ Don't reuse old passwords</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
