/**
 * Protected Route Component
 * Handles authentication checks and redirects for protected routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRole = [],
  fallback
}) => {
  const { user, authUser, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Redirect to login if not authenticated
  if (!authUser || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user account is active
  if (user.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Inactive</h2>
          <p className="text-gray-600 mb-4">Your account is currently inactive. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Check role requirements if specified
  if (requireRole.length > 0 && !requireRole.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this resource.</p>
        </div>
      </div>
    );
  }

  // Check if user is super admin and shouldn't be in workspace routes
  if (user.role === 'owner') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};