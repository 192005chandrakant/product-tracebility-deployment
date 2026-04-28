import { useState, useCallback } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirebaseAuth } from '../utils/firebase';
import { apiRequest } from '../utils/apiConfig';

/**
 * useGoogleLogin Hook
 * Handles Google authentication flow with Firebase and backend integration
 * 
 * Features:
 * - Google OAuth 2.0 popup sign-in
 * - Backend user verification/creation
 * - JWT token generation
 * - Error handling for network and auth failures
 */
export const useGoogleLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const googleLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const auth = getFirebaseAuth();

      // Step 1: Get Google ID Token from Firebase
      const provider = new GoogleAuthProvider();
      
      // Configure Google provider for additional scopes
      provider.addScope('profile');
      provider.addScope('email');
      
      // Open Google login popup
      const result = await signInWithPopup(auth, provider);
      
      // Step 2: Get Firebase ID token
      const firebaseToken = await result.user.getIdToken();
      
      // Extract user info from Google account
      const googleUser = {
        email: result.user.email,
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
        profilePicture: result.user.photoURL,
        googleUID: result.user.uid,
      };
      
      console.log('✅ Google authentication successful for:', googleUser.email);
      
      // Step 3: Send to backend for verification and JWT generation
      // Backend will:
      // - Verify the Firebase token
      // - Check if user exists in MongoDB
      // - Create user if new
      // - Generate JWT token
      const response = await apiRequest('/api/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({
          firebaseToken,
          googleUser,
        }),
      });
      
      if (!response.token) {
        throw new Error('No authentication token received from server');
      }
      
      // Step 4: Store JWT in localStorage (same as email/password login)
      localStorage.setItem('token', response.token);
      
      console.log('✅ Backend verification complete. JWT stored.');
      
      return {
        success: true,
        token: response.token,
        user: response.user,
      };
      
    } catch (err) {
      console.error('❌ Google login error:', err);
      
      // Handle specific error cases
      let errorMessage = err.message || 'Google login failed';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login popup was closed. Please try again.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Login request was cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Login popup was blocked by your browser. Please enable popups.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Firebase token verification failed. Please try again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error || 'Invalid user data.';
      }
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    googleLogin,
    loading,
    error,
    clearError: () => setError(null),
  };
};

export default useGoogleLogin;
