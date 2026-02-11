import { create } from 'zustand';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { MarketplaceListing, Conversation, Message } from '../types/marketplace';

interface MarketplaceState {
  listings: MarketplaceListing[];
  myListings: MarketplaceListing[];
  currentListing: MarketplaceListing | null;
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  totalUnreadCount: number;

  // Listings
  fetchListings: () => Promise<void>;
  fetchMyListings: () => Promise<void>;
  fetchListingDetail: (listingId: string) => Promise<void>;
  createListing: (
    title: string,
    description: string,
    price: number,
    imageUris: string[]
  ) => Promise<{ error: Error | null }>;
  updateListingStatus: (listingId: string, status: 'sold' | 'deleted') => Promise<void>;

  // Images
  uploadImage: (localUri: string) => Promise<string | null>;

  // Messaging
  fetchUnreadCount: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  openConversation: (listingId: string, sellerId: string) => Promise<string | null>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markMessagesRead: (conversationId: string) => Promise<void>;
  subscribeToMessages: (conversationId: string) => () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  listings: [],
  myListings: [],
  currentListing: null,
  conversations: [],
  messages: [],
  isLoading: false,
  isLoadingMessages: false,
  totalUnreadCount: 0,

  fetchListings: async () => {
    set({ isLoading: true });
    try {
      // RLS policy filters by university_id automatically
      const { data, error } = await supabase.rpc('get_marketplace_listings', {
        p_status: 'active',
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;
      set({ listings: (data as MarketplaceListing[]) || [] });
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyListings: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      // RLS policy filters by university_id automatically
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ myListings: (data as MarketplaceListing[]) || [] });
    } catch (error) {
      console.error('Failed to fetch my listings:', error);
    }
  },

  fetchListingDetail: async (listingId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_listing_detail', {
        p_listing_id: listingId,
      });

      if (error) throw error;
      const listings = data as MarketplaceListing[];
      set({ currentListing: listings?.[0] || null });
    } catch (error) {
      console.error('Failed to fetch listing detail:', error);
    }
  },

  createListing: async (title, description, price, imageUris) => {
    const { user, universityId } = useAuthStore.getState();
    const userId = user?.id;
    if (!userId) return { error: new Error('User not authenticated') };

    try {
      // Upload all images
      const imageUrls: string[] = [];
      for (const uri of imageUris) {
        const url = await get().uploadImage(uri);
        if (url) imageUrls.push(url);
      }

      if (imageUrls.length === 0) {
        return { error: new Error('Failed to upload images') };
      }

      const { error } = await supabase
        .from('marketplace_listings')
        .insert({
          seller_id: userId,
          title,
          description,
          price,
          images: imageUrls,
          ...(universityId ? { university_id: universityId } : {}),
        });

      if (error) throw error;

      await get().fetchListings();
      return { error: null };
    } catch (error) {
      console.error('Failed to create listing:', error);
      return { error: error as Error };
    }
  },

  updateListingStatus: async (listingId, status) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status })
        .eq('id', listingId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        currentListing: state.currentListing?.id === listingId
          ? { ...state.currentListing, status }
          : state.currentListing,
        listings: state.listings.filter((l) => l.id !== listingId || status !== 'deleted'),
      }));

      await get().fetchListings();
    } catch (error) {
      console.error('Failed to update listing status:', error);
    }
  },

  uploadImage: async (localUri: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const fileExt = 'jpg';
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const supabaseUrl =
        Constants.expoConfig?.extra?.supabaseUrl ||
        'https://waahgmnfykmrlxuvxerw.supabase.co';

      // Use React Native's native FormData which handles file URIs directly
      const formData = new FormData();
      formData.append('', {
        uri: localUri,
        name: fileName.split('/').pop(),
        type: 'image/jpeg',
      } as any);

      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/listing-images/${fileName}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Storage upload error:', response.status, errorBody);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { data: urlData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      const convos = (data as Conversation[]) || [];
      const total = convos.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ totalUnreadCount: total });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  fetchConversations: async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      const convos = (data as Conversation[]) || [];
      const total = convos.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ conversations: convos, totalUnreadCount: total });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  },

  openConversation: async (listingId, sellerId) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_listing_id: listingId,
        p_seller_id: sellerId,
      });

      if (error) throw error;
      return data as string;
    } catch (error) {
      console.error('Failed to open conversation:', error);
      return null;
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      set({ messages: (data as Message[]) || [] });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId, content) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      });

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  markMessagesRead: async (conversationId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  },

  subscribeToMessages: (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          set((state) => ({
            messages: [newMessage, ...state.messages],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
