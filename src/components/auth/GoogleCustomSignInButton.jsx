'use client';

import React, { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '421520521310-7appibeh1m7cdd90iid17lsq8thlq2oc.apps.googleusercontent.com').trim();

const GoogleButtonInternal = ({ onAuthSuccess, onAuthError, style = {}, text = 'Continue with Google' }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsProcessing(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        if (!userInfo?.email) {
          throw new Error('Could not retrieve email from your Google account.');
        }

        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInfo, accessToken: tokenResponse.access_token })
        });
        const data = await res.json();
        if (data.success && data.user) {
          if (onAuthSuccess) {
            await onAuthSuccess(data.user);
          }
        } else {
          throw new Error(data.error || 'Google Sign-In failed on server.');
        }
      } catch (err) {
        if (onAuthError) {
          onAuthError(err.message || 'Google Sign-In failed.');
        }
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      console.warn('Google popup error:', error);
      if (onAuthError) {
        onAuthError('Google Sign-In window was closed or cancelled.');
      }
    }
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={isProcessing}
      style={{
        width: '100%',
        height: '46px',
        padding: '0 1rem',
        borderRadius: '12px',
        border: '1.5px solid var(--border-color, #cbd5e1)',
        background: 'var(--bg-card, #ffffff)',
        color: 'var(--color-text-primary, #090d16)',
        fontSize: '0.92rem',
        fontWeight: 700,
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.65rem',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
        boxSizing: 'border-box',
        transition: 'all 0.15s ease',
        opacity: isProcessing ? 0.75 : 1,
        ...style
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--orange-500)'; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color, #cbd5e1)'; }}
    >
      {isProcessing ? (
        <>
          <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Authenticating Google...</span>
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export const GoogleCustomSignInButton = (props) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleButtonInternal {...props} />
    </GoogleOAuthProvider>
  );
};
