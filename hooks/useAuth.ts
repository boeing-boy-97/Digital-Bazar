'use client';
import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/auth/login';
  };

  return { user, loading, logout, isAuthenticated: !!user };
}
