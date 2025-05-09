import React, { useEffect } from 'react';
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
  const { initialize, instanceId } = useAgentStore();
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
        
        if (!instances || instances.length === 0) {
          console.log('Nenhuma instância do WhatsApp encontrada para o usuário');
          toast.error('Nenhuma instância do WhatsApp encontrada');
          return;
        }
        
        const connectedInstance = instances.find((instance) => instance.status === 'CONNECTED');
        const instanceToUse = connectedInstance || instances[0];
        
        if (instanceToUse) {
          console.log('Inicializando agentStore com a instância:', instanceToUse.id);
          try {
            useAgentStore.setState({ instanceId: instanceToUse.id });
            useChatStore.setState({ error: null });
            initialize(instanceToUse.id);
            console.log('agentStore inicializado com sucesso, instanceId definido:', instanceToUse.id);
            
            // Immediately load conversations after setting the instanceId
            loadConversations(instanceToUse.id);
          } catch (error) {
            console.error('Erro ao inicializar agentStore:', error);
            toast.error('Erro ao inicializar a conexão com WhatsApp');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar instâncias do WhatsApp:', error);
        toast.error('Erro ao buscar instâncias do WhatsApp');
      }
    };

    fetchWhatsAppInstances();
  }, [user, initialize, loadConversations]);

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
              const errorMessage = `Erro na API: ${response.status} ${response.statusText}`;
              useChatStore.setState({ 
                error: errorMessage, 
                conversationsLoading: false 
              });
              return;
            }
            
            const data = await response.json();
            console.log(`Dados recebidos da edge function:`, data);
            
            if (!data) {
              console.error('Sem dados recebidos da edge function');
              useChatStore.setState({ 
                error: 'Sem dados recebidos da API', 
                conversationsLoading: false 
              });
              return;
            }
            
            if (data.error) {
              console.error('Erro retornado pela edge function:', data.error);
              useChatStore.setState({ 
                error: typeof data.error === 'string' ? data.error : 'Erro retornado pela API', 
                conversationsLoading: false 
              });
              return;
            }
            
            if (Array.isArray(data)) {
              console.log(`Processando ${data.length} conversas da edge function`);
              useChatStore.setState({ conversations: data, conversationsLoading: false });
              console.log(`Conversas processadas e atualizadas no estado:`, data);
            } else {
              console.error('Formato de dados inválido:', data);
              loadConversations(instanceId);
            }
          } catch (err) {
            console.error('Erro ao carregar conversas do edge function:', err);
            useChatStore.setState({ 
              error: err instanceof Error ? err.message : 'Erro ao carregar conversas', 
              conversationsLoading: false 
            });
          }
        } catch (error) {
          console.error('Erro de autenticação:', error);
          useChatStore.setState({ 
            error: error instanceof Error ? error.message : 'Erro de autenticação', 
            conversationsLoading: false 
          });
        }
      };
      
      getSessionAndFetchConversations();
    }
  }, [instanceId, loadConversations]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      console.log('Nenhuma conversa selecionada. Selecionando a primeira conversa automaticamente:', conversations[0].id);
      selectConversation(conversations[0].id);
    } else if (conversations.length > 0 && selectedConversationId) {
      console.log('Conversa já selecionada:', selectedConversationId);
    } else if (conversations.length === 0) {
      console.log('Nenhuma conversa disponível para selecionar');
    }
  }, [conversations, selectedConversationId, selectConversation]);

  useEffect(() => {
    console.log(`Configurando Realtime para conversas da instância ${instanceId}`);
    
    if (!instanceId) return;
    
    loadConversations(instanceId);
    
    const channel = supabase.supabase
      .channel('conversations-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `instance_id=eq.160b6ea2-1cc4-48c3-ba9c-1b0ffaa8faf3` 
        }, 
        (payload) => {
          console.log('Nova mensagem recebida via Realtime:', payload);
          // Recarregar conversas quando novas mensagens chegarem
          loadConversations(instanceId);
        }
      )
      .subscribe();
    
    return () => {
      console.log('Limpando subscription do Realtime');
      supabase.supabase.removeChannel(channel);
    };
  }, [instanceId, loadConversations]);

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
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar conversas</h3>
          <p className="mt-1 text-gray-500">
            {typeof error === 'object' && error && 'message' in error 
              ? (error as {message: string}).message 
              : String(error)}
          </p>
          <p className="mt-1 text-gray-400 text-sm">
            {error.toString().includes('column') 
              ? 'Erro no esquema do banco de dados. Contate o administrador.' 
              : 'Verifique se a instância do WhatsApp está conectada corretamente.'}
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => {
                console.log('Tentando novamente após erro:', error);
                useChatStore.setState({ error: null });
                if (instanceId) {
                  console.log('Recarregando conversas para instância:', instanceId);
                  loadConversations(instanceId);
                  toast.success('Tentando recarregar conversas...');
                } else {
                  console.log('Nenhuma instância disponível para recarregar conversas');
                  toast.error('Conecte uma instância do WhatsApp primeiro');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
            >
              Tentar novamente
            </button>
            {!instanceId && (
              <button
                onClick={() => navigate('/settings')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Configurações
              </button>
            )}
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
                      useChatStore.setState({ conversations: conversations as unknown as Conversation[], conversationsLoading: false });
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
            {instanceId 
              ? 'Selecione uma conversa para iniciar' 
              : 'Conecte seu WhatsApp para ver conversas'}
          </p>
          {instanceId && (
            <div className="mt-2 flex justify-between">
              <p className="text-xs text-gray-400">ID da instância: {instanceId.substring(0, 8)}...</p>
              <button
                onClick={() => {
                  console.log('Forçando recarregamento de conversas para instância:', instanceId);
                  loadConversations(instanceId);
                  toast.success('Recarregando conversas...');
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="Recarregar conversas"
              >
                Recarregar
              </button>
            </div>
          )}
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

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col">
        {/* Layout móvel - mostrar lista de conversas OU chat */}
        {window.innerWidth < 768 ? (
          <>
            {selectedConversationId ? (
              <ChatView 
                conversationId={selectedConversationId} 
                onBackClick={() => selectConversation('')}
                isMobile={true}
              />
            ) : (
              <div className="md:hidden flex-1 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Conversas</h2>
                  <p className="text-sm text-gray-500">
                    {instanceId ? 'Selecione uma conversa para iniciar' : 'Conecte seu WhatsApp para ver conversas'}
                  </p>
                </div>
                
                {/* Lista de conversas mobile */}
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
            )}
          </>
        ) : (
          /* Layout desktop - mostrar área de chat */
          <>
            {selectedConversationId ? (
              <ChatView
                conversationId={selectedConversationId}
                onBackClick={() => selectConversation('')}
                isMobile={false}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
                <div className="text-center max-w-md">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Bem-vindo ao Chat</h3>
                  <p className="mt-1 text-gray-500">
                    {instanceId 
                      ? 'Selecione uma conversa na barra lateral para começar a interagir'
                      : 'Conecte seu WhatsApp para começar a ver suas conversas'
                    }
                  </p>
                  
                  {!instanceId && (
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/settings')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Conectar WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
