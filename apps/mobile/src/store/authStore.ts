import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  hasInitialized: boolean; // 추가

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  hasInitialized: false,

  initialize: async () => {
    if (get().hasInitialized) return; // 핵심
    set({ hasInitialized: true });

    console.log('AuthStore: Starting initialization...');
    const { data: { session } } = await supabase.auth.getSession();

    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
      isInitialized: true,
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });

    // 필요하면 subscription을 store에 저장해둬도 됨
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false });
      return { error };
    }

    set({
      session: data.session,
      user: data.user,
      isLoading: false,
    });

    return { error: null };
  },

  signUpWithEmail: async (email: string, password: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false });
      return { error };
    }

    set({
      session: data.session,
      user: data.user,
      isLoading: false,
    });

    return { error: null };
  },

  signInWithGoogle: async () => {
    // For mobile, we need to use a different approach
    // Supabase OAuth on mobile requires additional setup with deep linking
    // This is a simplified version - you may need expo-auth-session for full OAuth flow
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'quadly://auth/callback',
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  },

  signOut: async () => {
    set({ isLoading: true });

    await supabase.auth.signOut();

    set({
      session: null,
      user: null,
      isLoading: false,
    });
  },

  setSession: (session: Session | null) => {
    set({
      session,
      user: session?.user ?? null,
    });
  },
}));
