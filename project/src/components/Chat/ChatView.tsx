import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { ArrowLeft, Phone, MoreVertical, Bot } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ContactAvatar from './ContactAvatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Message, MessageStatus, MessageType, Conversation } from './types';

interface ChatViewProps {
  conversationId: string;
  onBackClick?: () => void;
  isMobile?: boolean;
}

/**
 * Component for displaying a conversation's messages and input
 */
const ChatView: React.FC<ChatViewProps> = ({
  conversationId,
  onBackClick,
  isMobile = false
}) => {
  const { 
    conversations, 
    messages, 
    loading: messagesLoading, 
    loadMessages, 
    sendMessage,
    markMessagesAsRead
  } = useChatStore();
  
  const {
    instanceId,
    settings,
    processMessage,
    generateResponse
  } = useAgentStore();
  
  const [suggestedResponse, setSuggestedResponse] = useState<string | null>(null);
  const [suggestedActionButtons, setSuggestedActionButtons] = useState<{ text: string; action: string }[]>([]);
  
  const conversation = conversations.find((c: Conversation) => c.id === conversationId);
  const conversationMessages = messages[conversationId] || [];
  
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId, instanceId);
    }
  }, [conversationId, loadMessages, instanceId]);
  
  useEffect(() => {
    if (conversationId && conversation?.unreadCount) {
      markMessagesAsRead(conversationId);
    }
  }, [conversationId, conversation?.unreadCount, markMessagesAsRead]);
  
  useEffect(() => {
    const processLastMessage = async () => {
      if (!settings?.is_active || !instanceId || conversationMessages.length === 0) {
        return;
      }
      
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      
      if (lastMessage.isFromMe || lastMessage.isAIResponse) {
        return;
      }
      
      try {
        const result = await processMessage(lastMessage.content, conversationId);
        
        if (result?.response) {
          if (settings.mode === 'ACTIVE') {
            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              conversationId,
              content: result.response,
              timestamp: new Date().toISOString(),
              isFromMe: true,
              status: MessageStatus.SENT,
              type: MessageType.TEXT,
              isAIResponse: true,
              actionButtons: result.actionButtons
            };
            
            useChatStore.setState((state: any) => ({
              messages: {
                ...state.messages,
                [conversationId]: [...conversationMessages, aiMessage]
              }
            }));
            
            sendMessage(conversationId, result.response);
          } else {
            // Modo passivo: mostrar sugestão
            setSuggestedResponse(result.response);
            setSuggestedActionButtons(result.actionButtons || []);
          }
        } else if (settings.mode === 'PASSIVE') {
          try {
            const response = await generateResponse(lastMessage.content, conversationId);
            if (response) {
              setSuggestedResponse(response);
              setSuggestedActionButtons([]);
            }
          } catch (error) {
            console.error('Erro ao gerar resposta:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };
    
    processLastMessage();
  }, [conversationMessages, settings, instanceId, conversationId, sendMessage, processMessage, generateResponse]);
  
  const handleSendMessage = (content: string) => {
    if (!instanceId) {
      toast.error("Nenhuma instância do WhatsApp conectada");
      return;
    }
    
    sendMessage(conversationId, content)
      .catch(error => {
        toast.error(`Erro ao enviar mensagem: ${error.message}`);
      });
    setSuggestedResponse(null);
    setSuggestedActionButtons([]);
  };
  
  const handleSendSuggestion = () => {
    if (suggestedResponse) {
      sendMessage(conversationId, suggestedResponse);
      setSuggestedResponse(null);
      setSuggestedActionButtons([]);
    }
  };
  
  const handleActionButtonClick = (action: string) => {
    sendMessage(conversationId, action);
    setSuggestedResponse(null);
    setSuggestedActionButtons([]);
  };
  
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Conversa não encontrada</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-3 border-b border-gray-200 bg-white">
        {isMobile && (
          <button 
            onClick={onBackClick}
            className="mr-2 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
        )}
        
        <ContactAvatar 
          name={conversation.contact.name}
          profilePicUrl={conversation.contact.profilePicUrl}
          isOnline={conversation.contact.isOnline}
        />
        
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">
            {conversation.contact.name || conversation.contact.phoneNumber}
          </h3>
          <p className="text-xs text-gray-500">
            {conversation.contact.isOnline 
              ? 'Online' 
              : conversation.contact.lastSeen  
                ? `Visto por último ${new Date(conversation.contact.lastSeen).toLocaleDateString('pt-BR')}` 
                : 'Offline'}
          </p>
        </div>
        
        <div className="flex">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Phone size={20} className="text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <MessageList 
          messages={conversationMessages}
          loading={messagesLoading}
          onActionClick={handleActionButtonClick}
        />
      </div>
      
      {/* Suggested response */}
      {suggestedResponse && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start">
            <Bot size={20} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700 mb-1">Resposta sugerida:</p>
              <p className="text-sm text-gray-700">{suggestedResponse}</p>
              
              {/* Action buttons */}
              {suggestedActionButtons && suggestedActionButtons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedActionButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionButtonClick(button.action)}
                      className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-600 hover:bg-blue-50"
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={handleSendSuggestion}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
                >
                  Enviar sugestão
                </button>
                <button
                  onClick={() => {
                    setSuggestedResponse(null);
                    setSuggestedActionButtons([]);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                >
                  Ignorar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Message input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatView;
