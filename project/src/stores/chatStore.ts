import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Contact, Conversation, Message, MessageStatus, MessageType } from '../components/Chat/types';

type Messages = Record<string, Message[]>;

interface ChatState {
  conversations: Conversation[];
  messages: Messages;
  loading: boolean;
  error: string | null;
  selectedConversationId: string | null;
  
  loadConversations: () => Promise<Conversation[]>;
  selectConversation: (id: string) => void;
  loadMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, content: string, mediaType?: MessageType, mediaUrl?: string) => Promise<Message | null>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  loading: false,
  error: null,
  selectedConversationId: null,
  
  loadConversations: async () => {
    set({ loading: true, error: null });
    
    try {
      const demoContacts: Contact[] = [
        {
          id: '1',
          name: 'João Silva',
          phoneNumber: '+5511912345678',
          profilePicUrl: null,
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Maria Souza',
          phoneNumber: '+5511987654321',
          profilePicUrl: null,
          isOnline: false,
          lastSeen: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      const demoConversations: Conversation[] = [
        {
          id: '1',
          contact: demoContacts[0],
          lastMessage: {
            id: '1',
            conversationId: '1',
            content: 'Olá, como posso ajudar?',
            timestamp: new Date().toISOString(),
            isFromMe: true,
            status: MessageStatus.READ
          },
          unreadCount: 0,
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          contact: demoContacts[1],
          lastMessage: {
            id: '2',
            conversationId: '2',
            content: 'Obrigado pela informação!',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isFromMe: false,
            status: MessageStatus.DELIVERED
          },
          unreadCount: 2,
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      set({ conversations: demoConversations, loading: false });
      return demoConversations;
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      set({ error: 'Falha ao carregar conversas', loading: false });
      return [];
    }
  },
  
  selectConversation: (id: string) => {
    set({ selectedConversationId: id });
    get().loadMessages(id);
  },
  
  loadMessages: async (conversationId: string) => {
    set({ loading: true, error: null });
    
    try {
      const cachedMessages = get().messages[conversationId];
      
      if (cachedMessages) {
        set({ loading: false });
        return cachedMessages;
      }
      
      const demoMessages: Message[] = [
        {
          id: '1',
          conversationId: conversationId,
          content: 'Olá, como posso ajudar?',
          type: MessageType.TEXT,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isFromMe: true,
          status: MessageStatus.READ,
          isAIResponse: true
        },
        {
          id: '2',
          conversationId: conversationId,
          content: 'Preciso de informações sobre o produto',
          type: MessageType.TEXT,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isFromMe: false,
          status: MessageStatus.READ
        },
        {
          id: '3',
          conversationId: conversationId,
          content: 'Claro! Nosso produto oferece automação completa de atendimento via WhatsApp com integração à IA. Você pode configurar respostas automáticas, processamento de mídia e muito mais.',
          type: MessageType.TEXT,
          timestamp: new Date(Date.now() - 900000).toISOString(),
          isFromMe: true,
          status: MessageStatus.READ,
          isAIResponse: true
        }
      ];
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: demoMessages
        },
        loading: false
      }));
      
      return demoMessages;
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      set({ error: 'Falha ao carregar mensagens', loading: false });
      return [];
    }
  },
  
  sendMessage: async (conversationId: string, content: string, mediaType?: MessageType, mediaUrl?: string) => {
    try {
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        content,
        type: mediaType || MessageType.TEXT,
        timestamp: new Date().toISOString(),
        isFromMe: true,
        status: MessageStatus.SENT
      };
      
      const conversationMessages = get().messages[conversationId] || [];
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [...conversationMessages, newMessage]
        }
      }));
      
      set(state => {
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: newMessage,
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        });
        
        return { conversations: updatedConversations };
      });
      
      return newMessage;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      set({ error: 'Falha ao enviar mensagem' });
      return null;
    }
  },
  
  markMessagesAsRead: async (conversationId: string) => {
    try {
      const messages = get().messages[conversationId] || [];
      
      const updatedMessages = messages.map(msg => ({
        ...msg,
        status: MessageStatus.READ
      }));
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages
        }
      }));
      
      set(state => {
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: 0
            };
          }
          return conv;
        });
        
        return { conversations: updatedConversations };
      });
      
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      set({ error: 'Falha ao atualizar status das mensagens' });
    }
  }
}));
