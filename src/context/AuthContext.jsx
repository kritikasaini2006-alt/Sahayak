import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import {
  setActiveAuthUser,
  hasGuestDataToMigrate,
  migrateGuestDataToUser,
} from '../utils/userStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [guestDataAvailable, setGuestDataAvailable] = useState(false);

  // Initialize auth session on load
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          if (data?.session?.user) {
            setSession(data.session);
            setUser(data.session.user);
            setActiveAuthUser(data.session.user.id);
          } else {
            setSession(null);
            setUser(null);
            setActiveAuthUser(null);
            setGuestDataAvailable(hasGuestDataToMigrate());
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        setActiveAuthUser(newSession.user.id);
        // Automatically migrate any previous guest research to this user
        if (hasGuestDataToMigrate()) {
          migrateGuestDataToUser(newSession.user.id);
        }
      } else {
        setSession(null);
        setUser(null);
        setActiveAuthUser(null);
        setGuestDataAvailable(hasGuestDataToMigrate());
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        setActiveAuthUser(data.user.id);
        // Migrate guest research into user profile if available
        migrateGuestDataToUser(data.user.id);
      }

      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      const msg = err.message || 'An unexpected error occurred during login.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up handler
  const signUp = useCallback(async (email, password, fullName) => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        setActiveAuthUser(data.user.id);
        // Migrate guest data to new user account
        migrateGuestDataToUser(data.user.id);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        requiresEmailConfirmation: !data.session && Boolean(data.user),
      };
    } catch (err) {
      const msg = err.message || 'An unexpected error occurred during registration.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setActiveAuthUser(null);
      setAuthError(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password handler
  const resetPassword = useCallback(async (email) => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Failed to send password reset request.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    session,
    loading,
    error: authError,
    isAuthenticated: Boolean(user),
    isConfigured: isSupabaseConfigured,
    guestDataAvailable,
    login,
    signUp,
    logout,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

