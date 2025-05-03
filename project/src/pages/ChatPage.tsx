import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { useAgentStore } from '../stores/agentStore';
import { useChatStore } from '../stores/chatStore';
import ChatView from '../components/Chat/ChatView';
import { AlertTriangle, MessageSquare, UserCircle, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Conversation } from '../components/Chat/types';
import * as supabase from '../lib/supabase';

const supabaseUrl = 'https://mopdlsgtfddzqjjerecz.supabase.co';

const ChatPage: React.FC = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { initialize, settings, instanceId } = useAgentStore();
  const {
    conversations,
    conversationsLoading,
    error,
    loadConversations,
    selectedConversationId,
    selectConversation
  } = useChatStore();

  useEffect(() => {
    if (!user) return;

    const fetchWhatsAppInstances = async () => {
      try {
        console.log('Buscando instâncias do WhatsApp para o usuário:', user.id);
        const instances = await supabase.getWhatsappInstances(user.id);
        console.log('Instâncias encontradas:', instances);
        
        const connectedInstance = instances.find((instance) => instance.status === 'CONNECTED');
        const instanceToUse = connectedInstance || (instances.length > 0 ? instances[0] : null);
        
        if (instanceToUse) {
          console.log('Inicializando agentStore com a instância:', instanceToUse.id);
          try {
            initialize(instanceToUse.id);
          } catch (error) {
            console.error('Erro ao inicializar agentStore:', error);
          }
        } else {
          console.log('Nenhuma instância do WhatsApp encontrada para o usuário');
        }
      } catch (error) {
        console.error('Erro ao buscar instâncias do WhatsApp:', error);
      }
    };

    fetchWhatsAppInstances();
  }, [user, initialize]);

  useEffect(() => {
    if (instanceId) {
      console.log(`useEffect: Usando instância ${instanceId} para carregar conversas`);
      
      const getSessionAndFetchConversations = async () => {
        try {
          const session = await supabase.checkAuth();
          const sessionToken = session?.access_token;
          
          if (!sessionToken) {
            console.error('Erro de autenticação: Sessão inválida ou expirada');
            loadConversations(instanceId);
            return;
          }
          
          console.log(`Buscando conversas para instance_id: ${instanceId}`);
          try {
            const response = await fetch(`${supabaseUrl}/functions/v1/get-conversations?instance_id=${instanceId}`, {
              headers: {
                Authorization: `Bearer ${sessionToken}`
              }
            });
            
            console.log(`Resposta da edge function: status ${response.status}`);
            
            if (!response.ok) {
              console.error(`Erro na resposta da API: ${response.status} ${response.statusText}`);
              loadConversations(instanceId);
              return;
            }
            
            const data = await response.json();
            console.log(`Dados recebidos da edge function:`, data);
            
            if (!data) {
              console.error('Sem dados recebidos da edge function');
              loadConversations(instanceId);
              return;
            }
            
            if (data.error) {
              console.error('Erro retornado pela edge function:', data.error);
              loadConversations(instanceId);
              return;
            }
            
            if (Array.isArray(data)) {
              console.log(`Processando ${data.length} conversas da edge function`);
              const conversations = data.map(item => ({
                id: item.number,
                contact: {
                  id: item.number,
                  name: item.name || item.number,
                  phoneNumber: item.number,
                  profilePicUrl: null,
                  isOnline: false,
                  lastSeen: null,
                },
                lastMessage: {
                  id: `last-${item.number}`,
                  conversationId: item.number,
                  content: item.lastMessage,
                  timestamp: item.timestamp,
                  isFromMe: false,
                  status: 'DELIVERED'
                },
                unreadCount: 0,
                updatedAt: item.timestamp
              }));
              useChatStore.setState({ conversations, conversationsLoading: false });
              console.log(`Conversas processadas e atualizadas no estado:`, conversations);
            } else {
              console.error('Formato de dados inválido:', data);
              loadConversations(instanceId);
            }
          } catch (err) {
            console.error('Erro ao carregar conversas do edge function:', err);
            loadConversations(instanceId);
          }
        } catch (error) {
          console.error('Erro de autenticação:', error);
          loadConversations(instanceId);
        }
      };
      
      getSessionAndFetchConversations();
    }
  }, [instanceId, loadConversations]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, selectedConversationId, selectConversation]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Acesso não autorizado</h3>
          <p className="mt-1 text-gray-500">Faça login para acessar esta página</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar conversas</h3>
          <p className="mt-1 text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => loadConversations()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!instanceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Phone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Sem instância do WhatsApp</h3>
          <p className="mt-1 text-gray-500">Conecte uma instância do WhatsApp nas configurações para ver as conversas</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/settings')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
            >
              Ir para Configurações
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma conversa encontrada</h3>
          <p className="mt-1 text-gray-500">Inicie uma nova conversa para começar</p>
          <div className="mt-6">
            {/* Debug button to help diagnose conversation loading issues */}
            <button
              onClick={async () => {
                console.log('Debug: Instance ID atual:', instanceId);
                
                try {
                  console.log('Debug: Buscando instâncias do WhatsApp para o usuário:', user.id);
                  const instances = await supabase.getWhatsappInstances(user.id);
                  console.log('Debug: Instâncias encontradas:', instances);
                  
                  if (instanceId) {
                    console.log('Debug: Tentando carregar conversas diretamente via supabase.getWhatsAppConversations');
                    const conversations = await supabase.getWhatsAppConversations(instanceId);
                    console.log('Debug: Conversas retornadas:', conversations);
                    
                    if (conversations && conversations.length > 0) {
                      console.log('Debug: Atualizando estado com conversas encontradas');
                      useChatStore.setState({ conversations, conversationsLoading: false });
                      toast.success(`${conversations.length} conversas carregadas com sucesso!`);
                    } else {
                      console.log('Debug: Nenhuma conversa encontrada para a instância', instanceId);
                      toast.error('Nenhuma conversa encontrada para esta instância');
                    }
                  } else if (instances.length > 0) {
                    const firstInstance = instances[0];
                    console.log('Debug: Usando primeira instância disponível:', firstInstance.id);
                    initialize(firstInstance.id);
                    toast.success('Instância inicializada, tentando carregar conversas...');
                  } else {
                    console.log('Debug: Nenhuma instância disponível');
                    toast.error('Nenhuma instância do WhatsApp disponível');
                  }
                } catch (error) {
                  console.error('Debug: Erro ao carregar conversas:', error);
                  toast.error('Erro ao carregar conversas');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
            >
              Testar Carregamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Lista de conversas (visível apenas em telas maiores) */}
      <div className="hidden md:flex md:w-80 flex-col border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Conversas</h2>
          <p className="text-sm text-gray-500">
            {settings?.is_active
              ? `Agente ${settings.mode === 'ACTIVE' ? 'ativo' : 'passivo'}`
              : 'Agente desativado'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation: Conversation) => (
            <div
              key={conversation.id}
              onClick={() => selectConversation(conversation.id)}
              className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 ${
                selectedConversationId === conversation.id ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {conversation.contact.profilePicUrl ? (
                  <img
                    src={conversation.contact.profilePicUrl}
                    alt={conversation.contact.name || ''}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {conversation.contact.name || conversation.contact.phoneNumber}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(conversation.updatedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage?.content || 'Nenhuma mensagem'}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-xs font-medium text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1">
        {selectedConversationId ? (
          <ChatView
            conversationId={selectedConversationId}
            onBackClick={() => selectConversation('')}
            isMobile={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Phone className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
