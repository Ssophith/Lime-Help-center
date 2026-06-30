'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/auth/me', {
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/jadmin/login');
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      // Only redirect if it's not an abort error (timeout)
      if (error.name !== 'AbortError') {
        router.push('/jadmin/login');
      } else {
        // On timeout, show error and allow retry
        setIsAuthenticated(false);
      }
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#02251A] mx-auto mb-4" />
          <p className="text-gray-600">Шалгаж байна...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
