import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Message, MessageStatus } from './types';
import { Check, CheckCheck, Clock, AlertCircle, Bot } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  showTimestamp?: boolean;
  isAIResponse?: boolean;
  actionButtons?: {
    text: string;
    action: string;
  }[];
  onActionClick?: (action: string) => void;
}

/**
 * Component for displaying a single message in the chat
 */
const MessageItem: React.FC<MessageItemProps> = ({
  message,
  showTimestamp = true,
  isAIResponse = false,
  actionButtons = [],
  onActionClick
}) => {
  const { content, isFromMe, timestamp, status } = message;
  
  const formattedTime = format(new Date(timestamp), 'HH:mm', { locale: ptBR });
  
  const getStatusIcon = () => {
    if (!isFromMe) return null;
    
    switch (status) {
      case MessageStatus.SENDING:
        return <Clock size={14} className="text-gray-400" />;
      case MessageStatus.SENT:
        return <Check size={14} className="text-gray-400" />;
      case MessageStatus.DELIVERED:
        return <CheckCheck size={14} className="text-gray-400" />;
      case MessageStatus.READ:
        return <CheckCheck size={14} className="text-blue-500" />;
      case MessageStatus.FAILED:
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div 
      className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div 
        className={`
          max-w-[75%] px-3 py-2 rounded-lg 
          ${isFromMe 
            ? 'bg-green-50 text-gray-800 rounded-tr-none' 
            : isAIResponse
              ? 'bg-blue-50 text-gray-800 rounded-tl-none border border-blue-100'
              : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
          }
        `}
      >
        {/* AI Response Tag */}
        {isAIResponse && (
          <div className="flex items-center text-blue-600 text-xs font-medium mb-1">
            <Bot size={12} className="mr-1" />
            <span>🤖 ZapBrain</span>
          </div>
        )}
        
        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        
        {/* Action buttons for AI responses */}
        {isAIResponse && actionButtons && actionButtons.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => onActionClick && onActionClick(button.action)}
                className="px-3 py-1 text-xs bg-white border border-blue-200 rounded-full text-blue-600 hover:bg-blue-50"
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
        
        {/* Timestamp and status */}
        {showTimestamp && (
          <div className="flex items-center justify-end mt-1 space-x-1">
            <span className="text-xs text-gray-500">{formattedTime}</span>
            {getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
