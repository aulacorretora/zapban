import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewInstanceCardProps {
  onCreateInstance: (name: string) => void;
  isLocked?: boolean;
}

const NewInstanceCard: React.FC<NewInstanceCardProps> = ({ 
  onCreateInstance,
  isLocked = false 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [instanceName, setInstanceName] = useState('');

  const handleCreate = () => {
    if (instanceName.trim()) {
      onCreateInstance(instanceName.trim());
      setInstanceName('');
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setInstanceName('');
    setIsCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-card overflow-hidden h-full ${
        isLocked ? 'opacity-70' : ''
      }`}
    >
      <div className="p-6 flex flex-col justify-center items-center h-full">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div
              key="create-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Nova Instância</h3>
              
              <div className="mb-4">
                <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  id="instanceName"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="WhatsApp Principal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-whatsapp focus:border-whatsapp"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCreate}
                  disabled={!instanceName.trim()}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp disabled:opacity-50"
                >
                  Criar
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="create-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div 
                className={`w-16 h-16 rounded-full ${
                  isLocked ? 'bg-gray-200' : 'bg-whatsapp bg-opacity-10'
                } flex items-center justify-center mx-auto mb-4`}
              >
                <Plus 
                  size={32} 
                  className={isLocked ? 'text-gray-400' : 'text-whatsapp'} 
                />
              </div>
              <h3 className={`text-lg font-semibold ${
                isLocked ? 'text-gray-500' : 'text-gray-800'
              } mb-2`}>
                {isLocked ? 'Bloqueado' : 'Nova Instância'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {isLocked 
                  ? 'Faça upgrade do seu plano para criar mais instâncias' 
                  : 'Conecte uma nova instância do WhatsApp'}
              </p>
              <button
                onClick={() => !isLocked && setIsCreating(true)}
                disabled={isLocked}
                className={`py-2 px-4 rounded-md text-sm font-medium ${
                  isLocked
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-whatsapp text-white hover:bg-whatsapp-dark'
                }`}
              >
                {isLocked ? 'Fazer Upgrade' : 'Criar Instância'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default NewInstanceCard;