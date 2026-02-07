import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  hasInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
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
    if (get().hasInitialized) return;
    set({ hasInitialized: true });

    const { data: { session } } = await supabase.auth.getSession();

    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
      isInitialized: true,
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
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
