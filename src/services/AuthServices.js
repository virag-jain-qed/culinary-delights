/**
 * Drupal Authentication Utility
 *
 * This module handles authentication with a Drupal backend using OAuth2.
 * It provides functions for login, token refresh, and authenticated requests.
 */

import axios from "axios";
import Cookies from "js-cookie";
// import jwtDecode from 'jwt-decode';

// Configuration
const config = {
  drupalBaseUrl: process.env.NEXT_PUBLIC_DRUPAL_BASE_URL,
  clientId: process.env.NEXT_PUBLIC_DRUPAL_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_DRUPAL_CLIENT_SECRET,
  tokenEndpoint: "/oauth/token",
  authorizeEndpoint: "/oauth/authorize",
  userInfoEndpoint: "/oauth/userinfo",
  logoutEndpoint: "/user/logout",
  cookiePrefix: "drupal_auth_",
  tokenExpiryBuffer: 300, // 5 minutes in seconds
};

/**
 * Initialize the OAuth2 authorization flow
 * @param {string} redirectUri - URI to redirect after authorization
 * @param {string} scope - OAuth scopes to request
 * @param {string} state - Random state for CSRF protection
 * @returns {string} - Authorization URL
 */
export function initiateAuthFlow(
  redirectUri,
  scope = "oauth_scope",
  state = generateRandomState()
) {
  // Store state in cookie for verification
  Cookies.set(`${config.cookiePrefix}state`, state, { sameSite: "strict" });

  // Construct the authorization URL
  const authUrl = new URL(`${config.drupalBaseUrl}${config.authorizeEndpoint}`);
  authUrl.searchParams.append("client_id", config.clientId);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_url", redirectUri);
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append("state", state);

  return authUrl.toString();
}

/**
 * Generate a random state string for CSRF protection
 * @returns {string} - Random state string
 */
function generateRandomState() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Drupal
 * @param {string} redirectUri - Redirect URI used in authorization request
 * @returns {Promise<Object>} - Token response
 */
export async function exchangeCodeForTokens(
  code,
  redirectUri = "https://localhost:3000"
) {
  try {
    const response = await axios.post(
      `${config.drupalBaseUrl}${config.tokenEndpoint}`,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        redirect_url: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data && response.data.access_token) {
      saveTokens(response.data);
      return response.data;
    }

    throw new Error("Invalid token response");
  } catch (error) {
    console.error("Token exchange failed:", error);
    throw error;
  }
}

/**
 * Verify the state parameter to prevent CSRF attacks
 * @param {string} receivedState - State received from authorization response
 * @returns {boolean} - Whether state is valid
 */
export function verifyState(receivedState) {
  const storedState = Cookies.get(`${config.cookiePrefix}state`);
  if (!storedState || storedState !== receivedState) {
    return false;
  }

  // Clean up the state cookie
  Cookies.remove(`${config.cookiePrefix}state`);
  return true;
}

/**
 * Save authentication tokens to cookies or local storage
 * @param {Object} tokenData - Token response from Drupal
 */
function saveTokens(tokenData) {
  const { access_token, refresh_token, expires_in } = tokenData;

  // Calculate expiry time
  const expiresAt = new Date(Date.now() + expires_in * 1000);

  // Store tokens securely in cookies
  Cookies.set(`${config.cookiePrefix}access_token`, access_token, {
    expires: expiresAt,
    sameSite: "strict",
    secure: window.location.protocol === "https:",
  });

  if (refresh_token) {
    // Refresh tokens typically have longer expiry - use 30 days as fallback
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    Cookies.set(`${config.cookiePrefix}refresh_token`, refresh_token, {
      expires: refreshExpiry,
      sameSite: "strict",
      secure: window.location.protocol === "https:",
    });
  }

  // Store token expiry time for easy reference
  Cookies.set(`${config.cookiePrefix}expires_at`, expiresAt.getTime(), {
    expires: expiresAt,
    sameSite: "strict",
    secure: window.location.protocol === "https:",
  });
}

/**
 * Get the current access token
 * @returns {string|null} - Access token or null if not available
 */
export function getAccessToken() {
  return Cookies.get(`${config.cookiePrefix}access_token`) || null;
}

/**
 * Check if access token exists and is not expired
 * @returns {boolean} - Whether user is authenticated
 */
export function isAuthenticated() {
  const token = getAccessToken();
  if (!token) return false;

  const expiresAt = parseInt(
    Cookies.get(`${config.cookiePrefix}expires_at`) || "0",
    10
  );

  // Add buffer to prevent edge cases where token expires during request
  return Date.now() < expiresAt - config.tokenExpiryBuffer * 1000;
}

/**
 * Get user information from the token or from Drupal's userinfo endpoint
 * @param {boolean} fetchFromServer - Whether to fetch fresh data from server
 * @returns {Promise<Object>} - User information
 */
export async function getUserInfo(fetchFromServer = false) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("User is not authenticated");
  }

  if (!fetchFromServer) {
    try {
      // Try to extract user info from the access token if it's a JWT
      return jwtDecode(token);
    } catch (error) {
      // Token might not be a JWT, continue to fetch from server
    }
  }

  try {
    const response = await axios.get(
      `${config.drupalBaseUrl}${config.userInfoEndpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    throw error;
  }
}

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<Object>} - New token data
 */
export async function refreshAccessToken() {
  const refreshToken = Cookies.get(`${config.cookiePrefix}refresh_token`);
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await axios.post(
      `${config.drupalBaseUrl}${config.tokenEndpoint}`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data && response.data.access_token) {
      saveTokens(response.data);
      return response.data;
    }

    throw new Error("Invalid token response");
  } catch (error) {
    console.error("Token refresh failed:", error);
    logout(); // Clear tokens on refresh failure
    throw error;
  }
}

/**
 * Create an axios instance with authentication headers and token refresh
 * @returns {Object} - Axios instance
 */
export function createAuthenticatedClient() {
  const client = axios.create({
    baseURL: config.drupalBaseUrl,
  });

  // Add request interceptor to add authentication headers
  client.interceptors.request.use(
    async (config) => {
      if (!isAuthenticated()) {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error("Failed to refresh token:", error);
          // Redirect to login or handle accordingly
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }

      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle token expiration
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If token is expired and we haven't tried refreshing yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          await refreshAccessToken();
          // Retry the original request with new token
          const token = getAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Log out the current user
 * @param {boolean} serverLogout - Whether to also log out on the server
 * @returns {Promise<void>}
 */
export async function logout(serverLogout = true) {
  const token = getAccessToken();

  // Clear all authentication cookies
  Object.keys(Cookies.get())
    .filter((name) => name.startsWith(config.cookiePrefix))
    .forEach((name) => Cookies.remove(name));

  // Perform server-side logout if requested and we have a token
  if (serverLogout && token) {
    try {
      await axios.get(`${config.drupalBaseUrl}${config.logoutEndpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Server logout failed:", error);
      // Continue with client-side logout even if server logout fails
    }
  }
}
