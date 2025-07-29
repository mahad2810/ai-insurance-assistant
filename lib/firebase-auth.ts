import { GoogleAuthProvider, signInWithPopup, type UserCredential } from 'firebase/auth';
import { auth } from './firebase';

// Create and configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    // Check if Firebase is properly initialized
    if (!auth || !googleProvider) {
      throw new Error('Firebase authentication is not properly initialized');
    }

    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const { user } = result;
    
    // Verify we have all required info
    if (!user.email) {
      throw new Error('Email is required for authentication');
    }
    
    return user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/configuration-not-found') {
      throw new Error('Google authentication is not properly configured in Firebase. Please check Firebase Console settings.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled by the user');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by the browser. Please allow popups for this site.');
    } else {
      throw error;
    }
  }
};
