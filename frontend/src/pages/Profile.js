import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Profile page redirects to ProfileOnboarding.
 * This ensures there is only ONE profile editing experience.
 */
const Profile = () => {
  return <Navigate to="/profile/onboarding" replace />;
};

export default Profile;