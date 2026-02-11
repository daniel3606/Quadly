import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Board {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  visibility: string;
  anon_mode: string;
  order_index: number;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  board_id: string;
  author_id: string | null;
  is_anonymous: boolean;
  title: string;
  body: string;
  tags: string[] | null;
  attachments: string[] | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  board?: Board;
  is_liked?: boolean;
}

export interface BoardWithLatestPost extends Board {
  latestPost?: {
    id: string;
    title: string;
    created_at: string;
    isRead: boolean;
  };
}

interface CommunityState {
  boards: Board[];
  boardsWithLatestPost: BoardWithLatestPost[];
  savedBoardIds: Set<string>;
  selectedBoardId: string | null;
  posts: Post[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchBoards: () => Promise<void>;
  fetchBoardsWithLatestPost: () => Promise<void>;
  fetchSavedBoards: () => Promise<void>;
  toggleSaveBoard: (boardId: string) => Promise<void>;
  setSelectedBoard: (boardId: string | null) => void;
  fetchPosts: (boardId: string) => Promise<void>;
  createPost: (boardId: string, title: string, body: string, isAnonymous: boolean) => Promise<{ error: Error | null }>;
  likePost: (postId: string) => Promise<void>;
  incrementViewCount: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  boards: [],
  boardsWithLatestPost: [],
  savedBoardIds: new Set(),
  selectedBoardId: null,
  posts: [],
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    
    try {
      await Promise.all([
        get().fetchBoards(),
        get().fetchSavedBoards(),
      ]);
      
      // Set default saved boards if user has no saved boards
      const { savedBoardIds, boards } = get();
      if (savedBoardIds.size === 0 && boards.length > 0) {
        const defaultBoards = boards.filter(
          board => ['general', 'private', 'info'].includes(board.key)
        );
        
        if (defaultBoards.length > 0) {
          const userId = useAuthStore.getState().user?.id;
          if (userId) {
            for (const board of defaultBoards) {
              await get().toggleSaveBoard(board.id);
            }
          }
        }
      }
      
      // Set first saved board as selected, or first board if none saved
      const savedIds = Array.from(get().savedBoardIds);
      if (savedIds.length > 0) {
        set({ selectedBoardId: savedIds[0] });
        await get().fetchPosts(savedIds[0]);
      } else if (boards.length > 0) {
        set({ selectedBoardId: boards[0].id });
        await get().fetchPosts(boards[0].id);
      }
      
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize community:', error);
      set({ isLoading: false });
    }
  },

  fetchBoards: async () => {
    try {
      // RLS policy filters by university_id automatically
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('order_index', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      set({ boards: data || [] });
      // Also fetch boards with latest posts
      await get().fetchBoardsWithLatestPost();
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    }
  },

  fetchBoardsWithLatestPost: async () => {
    const userId = useAuthStore.getState().user?.id;
    
    try {
      const { boards } = get();
      if (boards.length === 0) return;

      // Fetch latest post for each board
      const boardsWithPosts: BoardWithLatestPost[] = await Promise.all(
        boards.map(async (board) => {
          // Get latest post for this board
          const { data: latestPostData } = await supabase
            .from('posts')
            .select('id, title, created_at')
            .eq('board_id', board.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!latestPostData) {
            return { ...board };
          }

          // Check if user has viewed this post
          let isRead = false;
          if (userId) {
            const { data: viewData } = await supabase
              .from('post_views')
              .select('id')
              .eq('user_id', userId)
              .eq('post_id', latestPostData.id)
              .single();

            isRead = !!viewData;
          }

          return {
            ...board,
            latestPost: {
              id: latestPostData.id,
              title: latestPostData.title,
              created_at: latestPostData.created_at,
              isRead,
            },
          };
        })
      );

      set({ boardsWithLatestPost: boardsWithPosts });
    } catch (error) {
      console.error('Failed to fetch boards with latest posts:', error);
    }
  },

  fetchSavedBoards: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ savedBoardIds: new Set() });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('board_pins')
        .select('board_id')
        .eq('user_id', userId);

      if (error) throw error;

      const savedIds = new Set(data?.map((pin) => pin.board_id) || []);
      set({ savedBoardIds: savedIds });
    } catch (error) {
      console.error('Failed to fetch saved boards:', error);
    }
  },

  toggleSaveBoard: async (boardId: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      console.warn('User not authenticated');
      return;
    }

    const { savedBoardIds } = get();
    const isSaved = savedBoardIds.has(boardId);

    try {
      if (isSaved) {
        // Unsave board
        const { error } = await supabase
          .from('board_pins')
          .delete()
          .eq('user_id', userId)
          .eq('board_id', boardId);

        if (error) {
          console.error('Failed to unsave board:', error);
          throw error;
        }

        const newSavedIds = new Set(savedBoardIds);
        newSavedIds.delete(boardId);
        set({ savedBoardIds: newSavedIds });
      } else {
        // Save board - check if already exists first to avoid unique constraint errors
        const { data: existingPin } = await supabase
          .from('board_pins')
          .select('id')
          .eq('user_id', userId)
          .eq('board_id', boardId)
          .single();

        if (existingPin) {
          // Already saved, just update local state
          const newSavedIds = new Set(savedBoardIds);
          newSavedIds.add(boardId);
          set({ savedBoardIds: newSavedIds });
          return;
        }

        const { error, data } = await supabase
          .from('board_pins')
          .insert({
            user_id: userId,
            board_id: boardId,
            rank: 0,
          })
          .select();

        if (error) {
          console.error('Failed to save board:', error);
          // If it's a unique constraint error (23505), the board is already saved
          // Supabase might return code as string or number
          const errorCode = error.code || (error as any).code;
          const errorMessage = error.message || '';
          
          if (
            errorCode === '23505' ||
            errorCode === 23505 ||
            errorMessage.includes('duplicate') ||
            errorMessage.includes('unique constraint') ||
            errorMessage.includes('already exists')
          ) {
            // Board is already saved, refresh saved boards to sync with database
            console.log('Board already saved, refreshing state...');
            await get().fetchSavedBoards();
            return;
          }
          throw error;
        }

        const newSavedIds = new Set(savedBoardIds);
        newSavedIds.add(boardId);
        set({ savedBoardIds: newSavedIds });
      }
    } catch (error) {
      console.error('Failed to toggle save board:', error);
      // Refresh saved boards to ensure UI is in sync
      await get().fetchSavedBoards();
    }
  },

  setSelectedBoard: (boardId: string | null) => {
    set({ selectedBoardId: boardId });
    if (boardId) {
      get().fetchPosts(boardId);
    }
  },

  fetchPosts: async (boardId: string) => {
    set({ isLoading: true });
    const userId = useAuthStore.getState().user?.id;

    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch user's likes for these posts
      let likedPostIds: string[] = [];
      if (userId && postsData && postsData.length > 0) {
        const postIds = postsData.map((p) => p.id);
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds);

        likedPostIds = likesData?.map((l) => l.post_id) || [];
      }

      // Add is_liked flag to posts
      const posts: Post[] = (postsData || []).map((post) => ({
        ...post,
        is_liked: likedPostIds.includes(post.id),
      }));

      set({ posts, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      set({ isLoading: false });
    }
  },

  createPost: async (boardId: string, title: string, body: string, isAnonymous: boolean) => {
    const { user, universityId } = useAuthStore.getState();
    const userId = user?.id;
    if (!userId) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          board_id: boardId,
          author_id: isAnonymous ? null : userId,
          is_anonymous: isAnonymous,
          title,
          body,
          ...(universityId ? { university_id: universityId } : {}),
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh posts
      await get().fetchPosts(boardId);
      
      // Refresh boards with latest posts to update the latest post display
      await get().fetchBoardsWithLatestPost();

      return { error: null };
    } catch (error) {
      console.error('Failed to create post:', error);
      return { error: error as Error };
    }
  },

  likePost: async (postId: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const { posts } = get();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const isLiked = post.is_liked;

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId);

        if (error) throw error;

        // Update local state
        const updatedPosts = posts.map((p) =>
          p.id === postId
            ? { ...p, is_liked: false, like_count: Math.max(0, p.like_count - 1) }
            : p
        );
        set({ posts: updatedPosts });
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            user_id: userId,
            post_id: postId,
          });

        if (error) throw error;

        // Update local state
        const updatedPosts = posts.map((p) =>
          p.id === postId
            ? { ...p, is_liked: true, like_count: p.like_count + 1 }
            : p
        );
        set({ posts: updatedPosts });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  },

  incrementViewCount: async (postId: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      // Check if user already viewed this post today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingView } = await supabase
        .from('post_views')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('viewed_date', today)
        .single();

      if (!existingView) {
        // Record view
        await supabase.from('post_views').insert({
          user_id: userId,
          post_id: postId,
          viewed_date: today,
        });

        // Update local state
        const { posts } = get();
        const updatedPosts = posts.map((p) =>
          p.id === postId ? { ...p, view_count: p.view_count + 1 } : p
        );
        set({ posts: updatedPosts });

        // Refresh boards with latest posts to update unread indicators
        await get().fetchBoardsWithLatestPost();
      }
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  },

  refreshPosts: async () => {
    const { selectedBoardId } = get();
    if (selectedBoardId) {
      await get().fetchPosts(selectedBoardId);
    }
  },
}));
