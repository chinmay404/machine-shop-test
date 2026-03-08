import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

export default function App({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a25', color: '#e5e7eb', border: '1px solid #2a2a3a' },
        }}
      />
    </AuthProvider>
  );
}
