import { create } from 'zustand';
import * as supabase from '../lib/supabase';
import { Conversation, Message, MessageStatus, MessageType } from '../components/Chat/types';

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
      set({ conversations: conversations as unknown as Conversation[], conversationsLoading: false });
      return conversations as unknown as Conversation[];
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      
      set({ 
        error: "Falha ao carregar conversas", 
        conversationsLoading: false,
        conversations: [] // Retornar array vazio em vez de dados demo
      });
      return [];
    }
  },
  
  selectConversation: (id: string) => {
    set({ selectedConversationId: id });
    const instanceId = (async () => {
      try {
        return (await import('./agentStore')).useAgentStore.getState().instanceId;
      } catch (error) {
        console.error('Erro ao obter instanceId do agentStore:', error);
        return undefined;
      }
    })();
    
    Promise.resolve(instanceId).then(resolvedInstanceId => {
      if (resolvedInstanceId) {
        console.log(`selectConversation: Carregando mensagens para conversa ${id} com instância ${resolvedInstanceId}`);
        get().loadMessages(id, resolvedInstanceId);
      } else {
        console.warn('selectConversation: Nenhuma instância disponível para carregar mensagens');
        get().loadMessages(id);
      }
    });
  },
  
  loadMessages: async (conversationId: string, instanceId?: string): Promise<Message[]> => {
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
      
      let resolvedInstanceId = instanceId;
      if (!resolvedInstanceId) {
        try {
          const agentInstanceId = (await import('./agentStore')).useAgentStore.getState().instanceId;
          if (agentInstanceId) {
            resolvedInstanceId = agentInstanceId;
            console.log(`loadMessages: Obteve instanceId do agentStore: ${resolvedInstanceId}`);
          }
        } catch (error) {
          console.error('Erro ao obter instanceId do agentStore:', error);
        }
      }
      
      const specificInstanceId = '160b6ea2-1cc4-48c3-ba9c-1b0ffaa8faf3';
      if (!resolvedInstanceId) {
        console.log(`loadMessages: Usando instância específica ${specificInstanceId}`);
        resolvedInstanceId = specificInstanceId;
      }
      
      if (resolvedInstanceId) {
        try {
          console.log(`loadMessages: Carregando mensagens para conversa ${conversationId} com instância ${resolvedInstanceId}`);
          const messages = await supabase.getWhatsAppMessages(resolvedInstanceId, conversationId);
          
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: messages as Message[] || []
            },
            loading: false
          }));
          
          return (messages || []) as Message[];
        } catch (msgError) {
          console.error('Erro ao carregar mensagens reais:', msgError);
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: []
            },
            loading: false,
            error: 'Falha ao carregar mensagens'
          }));
          return [];
        }
      }
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: []
        },
        loading: false,
        error: 'Instância não especificada'
      }));
      
      return [];
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
