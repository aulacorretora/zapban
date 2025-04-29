/**
 * Type definitions for the Chat module
 */

export interface Contact {
  id: string;
  name: string | null;
  phoneNumber: string;
  profilePicUrl: string | null;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT'
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  type?: MessageType;
  timestamp: string;
  isFromMe: boolean;
  status: MessageStatus;
  isAIResponse?: boolean;
  actionButtons?: {
    text: string;
    action: string;
  }[];
}

export interface ChatState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  conversationsLoading: boolean;
  conversationsError: string | null;
  
  messages: Record<string, Message[]>;
  messagesLoading: boolean;
  messagesError: string | null;
  
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
}

export interface WebSocketEvent {
  type: 'message' | 'status' | 'typing';
  data: any;
}

export interface MessageEvent {
  message: Message;
}

export interface StatusEvent {
  contactId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface TypingEvent {
  conversationId: string;
  isTyping: boolean;
}
