export type ParticipantRole = 'client' | 'admin' | 'staff' | 'worker' | 'guest' | 'system';
export type ConversationType = 'direct' | 'order' | 'support' | 'group';

export interface ChatAttachment {
  id?: string;
  name: string;
  url: string;
  type?: string;
  size?: number | string;
}

export interface ReplyReference {
  id: string;
  sender_name: string;
  sender_role: ParticipantRole;
  content: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: ParticipantRole;
  last_read_at?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_email: string;
  sender_name: string;
  sender_role: ParticipantRole;
  content: string;
  attachments?: ChatAttachment[];
  reply_to?: ReplyReference | null;
  metadata?: Record<string, any>;
  is_read?: boolean;
  deleted_at?: string | null;
  created_at: string;
  // UI helpers
  is_optimistic?: boolean;
  error?: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  type: ConversationType;
  order_id?: string | null;
  metadata?: Record<string, any>;
  last_message_preview?: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  unread_count?: number;
  other_participant?: ConversationParticipant | null;
}

export interface SendMessagePayload {
  conversation_id?: string;
  order_id?: string;
  sender_id: string;
  sender_email: string;
  sender_name: string;
  sender_role: ParticipantRole;
  content: string;
  attachments?: ChatAttachment[];
  reply_to?: ReplyReference | null;
  metadata?: Record<string, any>;
  recipient_email?: string;
  recipient_name?: string;
}

export interface TypingPayload {
  conversation_id: string;
  user_id: string;
  user_name: string;
  user_role: ParticipantRole;
  is_typing: boolean;
  timestamp: number;
}
