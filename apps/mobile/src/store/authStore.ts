import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../lib/api';
import { supabase } from '../lib/supabase';

const TOKEN_KEY = 'auth_token';

export interface University {
  id: string;
  name: string;
  short_name: string;
  domain: string;
  logo_url: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  email_verified: boolean;
  role: string;
  school: string;
  graduation_year: number | null;
  gender: string | null;
  major: string | null;
  onboarding_completed: boolean;
  profile_image_url: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  selectedUniversity: University | null;
  universities: University[];

  // Actions
  initialize: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  setUser: (user: User) => void;
  setSelectedUniversity: (university: University) => void;
  fetchUniversities: () => Promise<void>;
  fetchUser: () => Promise<void>;
  completeOnboarding: (data: {
    graduation_year: number;
    gender: string;
    major: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  selectedUniversity: null,
  universities: [],

  initialize: async () => {
    console.log('AuthStore: Starting initialization...');
    try {
      // Check Supabase session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session && !sessionError) {
        console.log('AuthStore: Supabase session found');
        const token = session.access_token;
        await setToken(token);
        
        // Get user from Supabase
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser && supabaseUser.email?.endsWith('@umich.edu')) {
          // Try to fetch user from backend
          try {
            console.log('AuthStore: Fetching user from backend...');
            const user = await apiClient.get<User>('/auth/me');
            console.log('AuthStore: User fetched:', user?.email);
            set({ user });
          } catch (e) {
            console.log('AuthStore: Failed to fetch user from backend, using Supabase user');
            // Fallback: create user object from Supabase user
            set({ 
              user: {
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                nickname: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
                email_verified: supabaseUser.email_confirmed_at !== null,
                role: 'USER',
                school: 'UMICH',
                graduation_year: null,
                gender: null,
                major: null,
                onboarding_completed: false,
                profile_image_url: supabaseUser.user_metadata?.avatar_url || null,
              }
            });
          }
        } else if (supabaseUser) {
          // Invalid email domain, sign out
          await supabase.auth.signOut();
          await logout();
        }
      } else {
        // No Supabase session, check SecureStore for legacy token
        try {
          const token = await SecureStore.getItemAsync(TOKEN_KEY);
          if (token) {
            console.log('AuthStore: Legacy token found');
            apiClient.setToken(token);
            set({ token });
            try {
              const user = await apiClient.get<User>('/auth/me');
              set({ user });
            } catch (e) {
              console.log('AuthStore: Legacy token invalid, clearing');
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              apiClient.setToken(null);
              set({ token: null, user: null });
            }
          }
        } catch (e) {
          console.log('AuthStore: SecureStore not available');
        }
      }
    } catch (error) {
      console.error('AuthStore: Initialize error:', error);
    } finally {
      console.log('AuthStore: Initialization complete');
      set({ isLoading: false, isInitialized: true });
    }
  },

  setToken: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.log('AuthStore: SecureStore not available, token not persisted');
    }
    apiClient.setToken(token);
    set({ token });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setSelectedUniversity: (university: University) => {
    set({ selectedUniversity: university });
  },

  fetchUniversities: async () => {
    try {
      const response = await apiClient.get<{ universities: University[] }>('/auth/universities');
      set({ universities: response.universities });
    } catch (error) {
      console.error('AuthStore: Failed to fetch universities:', error);
    }
  },

  fetchUser: async () => {
    try {
      const user = await apiClient.get<User>('/auth/me');
      set({ user });
    } catch (error) {
      console.error('AuthStore: Failed to fetch user:', error);
      // Don't automatically logout here - let the caller handle it
      throw error;
    }
  },

  completeOnboarding: async (data) => {
    const user = await apiClient.patch<User>('/auth/onboarding', data);
    set({ user });
  },

  logout: async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (e) {
      console.log('AuthStore: Supabase sign out error:', e);
    }
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.log('AuthStore: SecureStore not available');
    }
    apiClient.setToken(null);
    set({ token: null, user: null });
  },
}));
