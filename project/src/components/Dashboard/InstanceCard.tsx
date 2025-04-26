import React, { useState } from 'react';
import { SmartphoneNfc, RefreshCw, Lock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface WhatsAppInstance {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onConnect: (id: string) => void;
  onDelete: (id: string) => void;
  isLocked?: boolean;
}

const InstanceCard: React.FC<InstanceCardProps> = ({ 
  instance, 
  onConnect, 
  onDelete,
  isLocked = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONNECTED':
        return 'bg-green-500';
      case 'DISCONNECTED':
        return 'bg-red-500';
      case 'CONNECTING':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONNECTED':
        return 'Conectado';
      case 'DISCONNECTED':
        return 'Desconectado';
      case 'CONNECTING':
        return 'Conectando';
      default:
        return status;
    }
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      onConnect(instance.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      onDelete(instance.id);
    }
  };

  const handleCardClick = () => {
    if (!isLocked) {
      navigate(`/settings?instance=${instance.id}`);
    }
  };

  const statusColor = getStatusColor(instance.status);
  const statusText = getStatusText(instance.status);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-card relative overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {isLocked && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <Lock size={32} className="text-white" />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-whatsapp-dark flex items-center justify-center">
              <SmartphoneNfc size={20} className="text-white" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-800">{instance.name}</h3>
              <div className="flex items-center mt-1">
                <span className={`w-2 h-2 rounded-full ${statusColor} mr-2`}></span>
                <span className="text-sm text-gray-600">{statusText}</span>
              </div>
            </div>
          </div>
          
          {isHovered && !isLocked && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex space-x-2"
            >
              <button 
                onClick={handleDelete}
                className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                title="Excluir instância"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Criado em {new Date(instance.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleConnect}
            disabled={isLocked}
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center font-medium text-sm transition-colors ${
              instance.status.toUpperCase() === 'CONNECTED'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-whatsapp text-white hover:bg-whatsapp-dark'
            }`}
          >
            {instance.status.toUpperCase() === 'CONNECTING' ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Conectando...
              </>
            ) : instance.status.toUpperCase() === 'CONNECTED' ? (
              'Conectado'
            ) : (
              'Conectar WhatsApp'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InstanceCard;