import { create } from 'zustand';
import * as supabase from '../lib/supabase';
import { Contact, Conversation, Message, MessageStatus, MessageType } from '../components/Chat/types';

type Messages = Record<string, Message[]>;

interface ChatState {
  conversations: Conversation[];
  messages: Messages;
  loading: boolean;
  conversationsLoading: boolean;
  error: string | null;
  selectedConversationId: string | null;
  
  loadConversations: (instanceId?: string) => Promise<Conversation[]>;
  selectConversation: (id: string) => void;
  loadMessages: (conversationId: string, instanceId?: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, content: string, mediaType?: MessageType, mediaUrl?: string) => Promise<Message | null>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  loading: false,
  conversationsLoading: false,
  error: null,
  selectedConversationId: null,
  
  loadConversations: async (instanceId?: string) => {
    if (!instanceId) {
      console.log('loadConversations: Nenhuma instância do WhatsApp conectada');
      set({ error: "Nenhuma instância do WhatsApp conectada", conversationsLoading: false });
      return [];
    }
    
    console.log(`loadConversations: Carregando conversas para instância ${instanceId}`);
    set({ conversationsLoading: true, error: null });
    
    try {
      console.log('Buscando conversas nas tabelas messages/message...');
      const conversations = await supabase.getWhatsAppConversations(instanceId);
      
      console.log(`loadConversations: ${conversations.length} conversas encontradas`, conversations);
      set({ conversations, conversationsLoading: false });
      return conversations;
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      
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
      
      set({ 
        error: "Falha ao carregar conversas", 
        conversationsLoading: false,
        conversations: demoConversations 
      });
      return demoConversations;
    }
  },
  
  selectConversation: (id: string) => {
    set({ selectedConversationId: id });
    get().loadMessages(id);
  },
  
  loadMessages: async (conversationId: string, instanceId?: string) => {
    if (!conversationId) return [];
    
    set(state => ({ 
      loading: true, 
      error: null,
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId] || []
      }
    }));
    
    try {
      const cachedMessages = get().messages[conversationId];
      
      if (cachedMessages && cachedMessages.length > 0) {
        set({ loading: false });
        return cachedMessages;
      }
      
      if (instanceId) {
        try {
          const messages = await supabase.getWhatsAppMessages(instanceId, conversationId);
          
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: messages || []
            },
            loading: false
          }));
          
          return messages || [];
        } catch (msgError) {
          console.error('Erro ao carregar mensagens reais:', msgError);
        }
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
        status: MessageStatus.SENDING
      };
      
      const conversationMessages = get().messages[conversationId] || [];
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [...conversationMessages, newMessage]
        }
      }));
      
      const instanceId = (await import('./agentStore')).useAgentStore.getState().instanceId;
      
      if (!instanceId) {
        throw new Error('Nenhuma instância do WhatsApp conectada');
      }
      
      const result = await supabase.sendWhatsAppMessage(
        instanceId,
        conversationId, // Using conversationId as phone number (from previous implementation)
        content,
        mediaType,
        mediaUrl
      );
      
      const updatedMessage = {
        ...newMessage,
        id: result?.id ? `${result.id}` : newMessage.id,
        status: MessageStatus.SENT
      };
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: conversationMessages.map(msg => 
            msg.id === newMessage.id ? updatedMessage : msg
          )
        }
      }));
      
      set(state => {
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: updatedMessage,
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        });
        
        return { conversations: updatedConversations };
      });
      
      return updatedMessage;
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
