'use client'

import { useState } from 'react';
import { loginWithSession, initiateAuthFlow } from '@/services/AuthServices';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Authenticate with username/password using session-based auth
      await loginWithSession(username, password);
      
      // Check if authentication was successful
      const authenticated = await isAuthenticated();
      if (authenticated) {
        // Redirect to dashboard or home page
        router.push('/');
      } else {
        setError('Login succeeded but session validation failed.');
      }
    } catch (err) {
      console.error('Session authentication failed:', err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    setLoading(true);
    try {
      // Redirect to OAuth authorization
      const redirectUri = `${window.location.origin}/auth/callback`;
      const authUrl = initiateAuthFlow(redirectUri);
      window.location.href = authUrl;
    } catch (err) {
      console.error('OAuth initialization failed:', err);
      setLoading(false);
      setError('Failed to initialize OAuth login. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* OAuth Login Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleOAuthLogin}
          disabled={loading}
          className="w-full py-2 px-4 flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-150"
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
          Login with Drupal OAuth
        </button>
      </div>
      
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>
      
      {/* Form Login */}
      <form onSubmit={handleFormSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
        >
          {loading ? 'Logging in...' : 'Login with Username & Password'}
        </button>
      </form>
    </div>
  );
}