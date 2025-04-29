import React, { useEffect, useRef } from 'react';
import { Message, MessageType } from './types';
import { Bot, FileText, Image, Mic, Video } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  onActionClick?: (action: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading = false,
  onActionClick
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-whatsapp"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Nenhuma mensagem ainda</p>
          <p className="text-sm mt-1">Envie uma mensagem para iniciar a conversa</p>
        </div>
      </div>
    );
  }

  const getMediaBadge = (type?: MessageType) => {
    if (!type || type === MessageType.TEXT) return null;
    
    switch (type) {
      case MessageType.IMAGE:
        return (
          <div className="flex items-center text-blue-600 mb-2">
            <Image size={16} className="mr-1" />
            <span className="text-xs">Imagem</span>
          </div>
        );
      case MessageType.AUDIO:
        return (
          <div className="flex items-center text-green-600 mb-2">
            <Mic size={16} className="mr-1" />
            <span className="text-xs">Áudio</span>
          </div>
        );
      case MessageType.VIDEO:
        return (
          <div className="flex items-center text-purple-600 mb-2">
            <Video size={16} className="mr-1" />
            <span className="text-xs">Vídeo</span>
          </div>
        );
      case MessageType.DOCUMENT:
        return (
          <div className="flex items-center text-red-600 mb-2">
            <FileText size={16} className="mr-1" />
            <span className="text-xs">Documento</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                message.isFromMe
                  ? 'bg-whatsapp text-white rounded-tr-none'
                  : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
              }`}
            >
              {getMediaBadge(message.type)}
              
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              
              {message.actionButtons && message.actionButtons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.actionButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => onActionClick && onActionClick(button.action)}
                      className={`px-3 py-1 rounded-full text-xs ${
                        message.isFromMe
                          ? 'bg-whatsapp-light text-whatsapp-dark hover:bg-whatsapp-light/80'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="mt-1 flex justify-end items-center">
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                
                {message.isFromMe && message.isAIResponse && (
                  <Bot size={12} className="ml-1 opacity-70" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
