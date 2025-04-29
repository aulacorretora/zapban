import React, { useState, useRef } from 'react';
import { Send, Mic, X, Loader } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { transcribeAudio, analyzeImage, extractPdfText } = useAgentStore();
  
  const handleSendMessage = async () => {
    if (message.trim() === '') return;
    
    onSendMessage(message);
    setMessage('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith('audio/')) {
      setAudioFile(file);
      setIsTranscribing(true);
      
      try {
        const text = await transcribeAudio(file);
        if (text) {
          setMessage(prev => prev + (prev ? ' ' : '') + text);
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
      } finally {
        setIsTranscribing(false);
        setAudioFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else if (file.type.startsWith('image/')) {
      setImageFile(file);
      setIsAnalyzing(true);
      
      try {
        const analysis = await analyzeImage(file);
        if (analysis && analysis.text) {
          setMessage(prev => prev + (prev ? ' ' : '') + `Texto na imagem: ${analysis.text}`);
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
      } finally {
        setIsAnalyzing(false);
        setImageFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else if (file.type === 'application/pdf') {
      setPdfFile(file);
      setIsAnalyzing(true);
      
      try {
        const text = await extractPdfText(file);
        if (text) {
          setMessage(prev => prev + (prev ? ' ' : '') + `Texto do PDF: ${text}`);
        }
      } catch (error) {
        console.error('Error extracting PDF text:', error);
      } finally {
        setIsAnalyzing(false);
        setPdfFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };
  
  const handleSelectAudioFile = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="p-3 pb-4 md:pb-5 lg:pb-6 border-t border-gray-200 bg-white shadow-sm">
      <div className="flex items-end space-x-2 mb-1 md:mb-2">
        <div className="flex-1 bg-gray-100 rounded-lg p-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className="w-full bg-transparent border-0 focus:ring-0 resize-none text-sm max-h-20 min-h-[40px]"
            rows={1}
            disabled={disabled || isTranscribing || isAnalyzing}
          />
          
          {isTranscribing && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <Loader size={14} className="animate-spin" />
              <span>Transcrevendo áudio...</span>
            </div>
          )}
          
          {isAnalyzing && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <Loader size={14} className="animate-spin" />
              <span>Analisando arquivo...</span>
            </div>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,image/*,application/pdf"
          className="hidden"
        />
        
        <button
          onClick={handleSelectAudioFile}
          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || isTranscribing || isAnalyzing}
          title="Selecionar arquivo de áudio"
        >
          <Mic size={20} />
        </button>
        
        <button
          onClick={handleSendMessage}
          className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={message.trim() === '' || disabled || isTranscribing || isAnalyzing}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
