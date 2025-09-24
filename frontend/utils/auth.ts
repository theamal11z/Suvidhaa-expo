import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export interface LogoutOptions {
  showConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Logs out the current user with optional confirmation dialog
 */
export const logoutUser = async (options: LogoutOptions = {}) => {
  const {
    showConfirmation = true,
    confirmationTitle = 'Logout',
    confirmationMessage = 'Are you sure you want to logout? You will need to sign in again to access your account.',
    onSuccess,
    onError,
  } = options;

  const performLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigation will be handled by the auth listener in _layout
      
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      } else {
        // Default error handling
        Alert.alert(
          'Logout Failed',
          error?.message || 'Failed to logout. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  if (showConfirmation) {
    Alert.alert(
      confirmationTitle,
      confirmationMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  } else {
    await performLogout();
  }
};

/**
 * Quick logout without confirmation dialog
 */
export const quickLogout = async (onError?: (error: any) => void) => {
  return logoutUser({
    showConfirmation: false,
    onError,
  });
};

/**
 * Check if user is currently signed in
 */
export const isUserSignedIn = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

/**
 * Get current user information
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};