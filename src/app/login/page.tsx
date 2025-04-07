'use client'

import { initiateAuthFlow } from "@/services/AuthServices";

export default function LoginButton() {
    // const router = useRouter();
    
    const handleLogin = () => {
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      // Start the authentication flow
      const authUrl = initiateAuthFlow(redirectUri);
      
      // Redirect to Drupal's authorization page
      window.location.href = authUrl;
    };
    
    return (
      <button 
        onClick={handleLogin}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Login with Drupal
      </button>
    );
  }