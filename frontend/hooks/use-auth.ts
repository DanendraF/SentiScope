'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, User } from '@/lib/api';

export function useAuth(requireAuth: boolean = false) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists
        const hasToken = apiClient.isAuthenticated();

        if (!hasToken) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);

          if (requireAuth) {
            router.push('/login');
          }
          return;
        }

        // Try to get user from localStorage first
        const cachedUser = apiClient.getUser();
        if (cachedUser) {
          setUser(cachedUser);
          setIsAuthenticated(true);
        }

        // Fetch fresh user data from API
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          if (requireAuth) {
            router.push('/login');
          }
        }
      } catch (error) {
        // Only log unexpected errors (not 401 Unauthorized)
        if (error instanceof Error && !error.message.includes('Unauthorized')) {
          console.error('Auth check failed:', error);
        }
        setIsAuthenticated(false);
        setUser(null);
        if (requireAuth) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requireAuth, router]);

  const logout = async (redirectPath: string = '/login') => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      router.push(redirectPath);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
  };
}
