import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

/**
 * Protected route component for farmer-only pages.
 * Checks:
 * 1. User is authenticated
 * 2. User has FARMER role
 * 3. Farmer profile is complete
 * 4. Farmer is verified (APPROVED status)
 * 
 * Redirects to profile onboarding if not complete/verified.
 */
const FarmerRoute = ({ children, requireVerification = true }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFarmer = user?.roles?.includes('FARMER');

  useEffect(() => {
    const fetchFarmerProfile = async () => {
      if (!isAuthenticated || !isFarmer) {
        setLoading(false);
        return;
      }

      try {
        const response = await userApi.get('/profiles/farmer');
        const profile = response.data?.data || response.data;
        setFarmerProfile(profile);
      } catch (err) {
        console.error('Error fetching farmer profile:', err);
        // Profile doesn't exist yet - treat as incomplete
        setFarmerProfile(null);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchFarmerProfile();
    }
  }, [isAuthenticated, isFarmer, authLoading]);

  // Show loading while checking auth or fetching profile
  if (authLoading || loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#16a34a',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p>Checking farmer status...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not a farmer - redirect to home
  if (!isFarmer) {
    return <Navigate to="/" replace />;
  }

  // Check if profile is complete
  const isProfileComplete = farmerProfile?.profileComplete || 
    (farmerProfile?.name && farmerProfile?.phone && farmerProfile?.farmName);

  // Check verification status
  const verificationStatus = farmerProfile?.status || 'PENDING';
  const isVerified = verificationStatus === 'APPROVED';

  // If verification is required and profile is incomplete or not verified
  if (requireVerification) {
    if (!isProfileComplete) {
      // Profile incomplete - redirect to onboarding
      return <Navigate 
        to="/profile/onboarding" 
        state={{ 
          from: location,
          message: 'Please complete your profile to access farmer features.',
          reason: 'incomplete_profile'
        }} 
        replace 
      />;
    }

    if (!isVerified) {
      // Profile complete but not verified - redirect to onboarding with pending message
      return <Navigate 
        to="/profile/onboarding" 
        state={{ 
          from: location,
          message: 'Your profile is pending verification. Please wait for approval.',
          reason: 'pending_verification',
          status: verificationStatus
        }} 
        replace 
      />;
    }
  }

  // All checks passed - render the protected content
  // Pass farmer profile data to children via context or props
  return React.cloneElement(children, { 
    farmerProfile, 
    isVerified,
    verificationStatus 
  });
};

export default FarmerRoute;
