import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-cyan"></div>
    </div>
  );
}

export function ProtectedPage({ children }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [router, user]);

  if (!user) {
    return <FullScreenSpinner />;
  }

  return <Layout>{children}</Layout>;
}

export function PublicOnlyPage({ children }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [router, user]);

  if (user) {
    return <FullScreenSpinner />;
  }

  return children;
}

export function ProtectedRedirect({ to }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    router.replace(to);
  }, [router, to, user]);

  return <FullScreenSpinner />;
}
