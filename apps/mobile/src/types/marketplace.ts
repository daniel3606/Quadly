export interface MarketplaceListing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_avatar_url: string | null;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: 'active' | 'sold' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image: string | null;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
