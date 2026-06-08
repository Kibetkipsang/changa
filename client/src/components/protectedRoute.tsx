import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, setAuthenticated, setUser, setLoading, isLoading } = useAuthStore();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // This request sends the httpOnly cookie automatically
        const response = await api.get('/auth/me');
        if (response.data.user) {
          setUser(response.data.user);
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
        setVerifying(false);
      }
    };

    if (!isAuthenticated) {
      verifyAuth();
    } else {
      setVerifying(false);
      setLoading(false);
    }
  }, [isAuthenticated, setAuthenticated, setUser, setLoading]);

  if (isLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}