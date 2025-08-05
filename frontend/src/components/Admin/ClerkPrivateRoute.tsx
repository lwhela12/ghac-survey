import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

interface ClerkPrivateRouteProps {
  children: React.ReactNode;
}

const ClerkPrivateRoute: React.FC<ClerkPrivateRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Wait for Clerk to load
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/admin/sign-in" replace />;
  }
  
  return <>{children}</>;
};

export default ClerkPrivateRoute;