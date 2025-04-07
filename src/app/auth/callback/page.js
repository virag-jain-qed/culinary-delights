'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { exchangeCodeForTokens } from '@/services/AuthServices'; 

export default function AuthCallback() {
  const [message, setMessage] = useState('Handling authentication...');
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const storedState = Cookies.get('drupal_auth_state');

      console.log("🚀 ~ code:", code);
      console.log("🚀 ~ returnedState:", returnedState);
      console.log("🚀 ~ storedState:", storedState);

      if (!code || !returnedState || returnedState !== storedState) {
        setMessage('Invalid state or missing code.');
        return;
      }

      try {
        const tokens = await exchangeCodeForTokens(code);
        console.log("✅ Tokens received:", tokens);

        // Optionally store tokens in cookie/localStorage/session
        Cookies.set('access_token', tokens.access_token);
        Cookies.set('refresh_token', tokens.refresh_token);

        // Redirect to home page
        router.push('/');
      } catch (error) {
        console.error('❌ Token exchange failed:', error);
        setMessage('Authentication failed.');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-xl">{message}</h1>
    </div>
  );
}
