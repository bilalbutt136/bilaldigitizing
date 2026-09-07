/**
 * TypeScript Interfaces for Persistent Chat & Manual Read Status Control
 * Project: BDigitizing Studio
 */

export type MessageSenderRole = 'client' | 'admin' | 'worker' | 'system';
export type MessageType = 'text' | 'custom_offer' | 'image' | 'pdf' | 'embroidery' | 'vector' | 'archive' | 'system';
export type OfferStatus = 'sent' | 'viewed' | 'pending' | 'accepted' | 'declined' | 'expired' | 'paid';
export type ChannelSection = 'inbox' | 'support';

export interface QuotedReply {
  id: string;
  sender_name?: string;
  text?: string;
  attachment?: string;
  attachment_url?: string;
}

export interface CustomOfferDetails {
  id: string;
  conversation_id?: string;
  thread_id?: string;
  client_name?: string;
  client_email?: string;
  title: string;
  description: string;
  service_type: string;
  price: number;
  discount_amount?: number;
  final_price: number;
  delivery_time_text?: string;
  delivery_days?: number;
  revisions_allowed?: string;
  status: OfferStatus;
  payment_status?: 'unpaid' | 'pending' | 'paid';
  order_id?: string | null;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  thread_id?: string;
  client_email?: string | null;
  guest_id?: string | null;
  sender: MessageSenderRole;
  sender_name?: string;
  senderName?: string;
  text?: string;
  type?: MessageType;
  attachment?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: string | number | null;
  attachment_type?: string | null;
  file_id?: string | null;
  reply_to?: QuotedReply | null;
  offer_id?: string | null;
  offer_data?: CustomOfferDetails | null;
  offer?: CustomOfferDetails | null;
  metadata?: Record<string, any>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  is_read: boolean;
  read_at?: string | null;
  is_autopilot?: boolean;
  auto_pilot?: boolean;
  deleted_at?: string | null;
  timestamp: string;
  created_at?: string;
}

export interface ConversationThread {
  id: string;
  clientEmail: string;
  clientName: string;
  company?: string;
  orderId?: string | null;
  orderTitle?: string | null;
  avatar?: string | null;
  status?: 'online' | 'offline' | 'away';
  unreadCount: number;
  adminUnreadCount: number;
  clientUnreadCount: number;
  lastMarkedReadAt?: string | null;
  last_marked_read_at?: string | null;
  isSupport: boolean;
  channel?: 'inbox' | 'support' | 'helpdesk' | 'digitizer';
  orders?: Array<{
    id: string;
    title?: string;
    client_name?: string;
    client_email?: string;
    service_category?: string;
    price?: number;
    status?: string;
  }>;
  messages: ChatMessage[];
  lastMessageTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarkAsReadPayload {
  conversation_id: string;
  role: 'admin' | 'client';
  clientEmail?: string;
  message_ids?: string[];
  mark_all?: boolean;
}

export interface FetchMessagesParams {
  chatId: string;
  clientEmail?: string;
  limit?: number;
  before?: string; // Cursor / timestamp for lazy loading older history
}

export interface PaginatedMessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string | null;
  totalCount?: number;
}
