import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import QRCodeDisplay from '../components/WhatsApp/QRCodeDisplay';
import InstanceCard from '../components/Dashboard/InstanceCard';
import NewInstanceCard from '../components/Dashboard/NewInstanceCard';
import { 
  connectWhatsApp, 
  getInstanceStatus, 
  deleteWhatsappInstance,
  getWhatsappInstances,
  disconnectInstance,
  createWhatsappInstance,
  updateInstanceName
} from '../lib/supabase';
import { useUserStore } from '../stores/userStore';
import { useChatStore } from '../stores/chatStore';

const Settings: React.FC = () => {
  const { user } = useUserStore();
  const [instances, setInstances] = useState<any[]>([]);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [instanceStatus, setInstanceStatus] = useState('DISCONNECTED');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInstanceData = async () => {
      if (!user) return;
      
      try {
        const fetchedInstances = await getWhatsappInstances(user.id);
        setInstances(fetchedInstances || []);
        
        if (fetchedInstances && fetchedInstances.length > 0) {
          const instance = fetchedInstances[0];
          setInstanceId(instance.id);
          setInstanceName('');
          setDisplayName(instance.name || ''); // Garantir que nome não seja null/undefined
          setInstanceStatus(instance.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED');
        }
      } catch (error) {
        console.error('Error fetching instance data:', error);
        toast.error('Failed to load instance data');
      }
    };

    fetchInstanceData();
  }, [user]);

  useEffect(() => {
    if (!instanceId) return;

    const pollStatus = async () => {
      try {
        const data = await getInstanceStatus(instanceId);
        if (data) {
          setInstanceStatus(data.status);
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    const intervalId = setInterval(pollStatus, 5000);

    return () => clearInterval(intervalId);
  }, [instanceId]);

  const handleConnect = async () => {
    if (!instanceId) {
      toast.error('No instance found');
      return;
    }
    
    if (!displayName.trim()) {
      toast.error('Por favor, defina um nome para sua instância antes de conectar.');
      return;
    }

    setIsLoading(true);
    setInstanceStatus('CONNECTING');
    try {
      if (instanceName.trim()) {
        await updateInstanceName(instanceId, instanceName);
        setDisplayName(instanceName); // Atualizar displayName imediatamente
        toast.success('Nome da instância salvo com sucesso!');
        setInstanceName(''); // Limpar o campo de input após salvar
      }

      const data = await connectWhatsApp(instanceId);
      if (data && data.qrCode) {
        setQrCode(data.qrCode);
        setShowQRCode(true);
        
        const checkStatusInterval = setInterval(async () => {
          const statusData = await getInstanceStatus(instanceId);
          if (statusData && statusData.status === 'CONNECTED') {
            setInstanceStatus('CONNECTED');
            setShowQRCode(false);
            clearInterval(checkStatusInterval);
            toast.success('WhatsApp connected successfully');
            
            const { loadConversations } = useChatStore.getState();
            loadConversations(instanceId);
          }
        }, 2000);
        
        setTimeout(() => {
          clearInterval(checkStatusInterval);
          if (instanceStatus !== 'CONNECTED') {
            setInstanceStatus('DISCONNECTED');
            toast.error('QR code expired. Please try again.');
          }
        }, 60000);
      } else {
        setInstanceStatus('DISCONNECTED');
        toast.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error connecting to WhatsApp:', error);
      setInstanceStatus('DISCONNECTED');
      toast.error('Failed to connect to WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };



  const handleDeleteInstance = async (id: string) => {
    const instanceToDelete = id || instanceId;
    if (!instanceToDelete) return;

    if (confirm('Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita.')) {
      setIsLoading(true);
      try {
        try {
          await disconnectInstance(instanceToDelete);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (disconnectError) {
          console.error('Error disconnecting instance:', disconnectError);
        }
        
        await deleteWhatsappInstance(instanceToDelete);
        
        const fetchedInstances = await getWhatsappInstances(user?.id || '');
        setInstances(fetchedInstances || []);
        
        if (instanceToDelete === instanceId) {
          setInstanceId(null);
          setInstanceName('');
          setDisplayName('');
          setInstanceStatus('DISCONNECTED');
          setShowQRCode(false);
        }
        
        toast.success('Instância excluída com sucesso');
      } catch (error) {
        console.error('Error deleting instance:', error);
        toast.error('Falha ao excluir instância');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateInstance = async (name: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const newInstance = await createWhatsappInstance(user.id, name);
      if (newInstance) {
        toast.success('Nova instância criada com sucesso!');
        const fetchedInstances = await getWhatsappInstances(user.id);
        setInstances(fetchedInstances || []);
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Falha ao criar nova instância');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Configurações de Instância</h2>
        <p className="text-gray-600 mt-1">Configure suas instâncias do WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {instances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            onConnect={handleConnect}
            onDelete={handleDeleteInstance}
            isLocked={isLoading}
          />
        ))}
        
        <NewInstanceCard
          onCreateInstance={handleCreateInstance}
          isLocked={isLoading}
        />
      </div>

      {/* Advanced Settings Section */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Configurações Avançadas</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-whatsapp shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Ativar reconexão automática</span>
            </label>
          </div>
          
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-whatsapp shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Salvar arquivos de mídia</span>
            </label>
          </div>
          
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-whatsapp shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Ativar confirmações de leitura</span>
            </label>
          </div>
        </div>
      </div>

      {showQRCode && (
        <QRCodeDisplay 
          qrCode={qrCode} 
          onClose={() => {
            setShowQRCode(false);
            toast.success('QR code fechado');
          }} 
        />
      )}
    </div>
  );
};

export default Settings;
