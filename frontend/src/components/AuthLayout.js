import React from 'react';
import { Link } from 'react-router-dom';
import './AuthLayout.css';

/**
 * AuthLayout - Layout wrapper for login/register pages
 * Shows only the AgriLink logo, hiding the full navbar
 */
const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      <header className="auth-layout-header">
        <Link to="/" className="auth-logo">
          <span className="logo-icon">🌾</span>
          <span className="logo-text">AgriLink</span>
        </Link>
      </header>
      <main className="auth-layout-content">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
