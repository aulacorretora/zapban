import React, { useState, useEffect } from 'react';
import { Phone, RefreshCw, Save, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import QRCodeDisplay from '../components/WhatsApp/QRCodeDisplay';
import { 
  connectWhatsApp, 
  getInstanceStatus, 
  updateInstanceStatus, 
  deleteWhatsappInstance,
  getWhatsappInstances,
  updateInstanceName,
  disconnectInstance
} from '../lib/supabase';
import { useUserStore } from '../stores/userStore';

const Settings: React.FC = () => {
  const { user } = useUserStore();
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [displayName, setDisplayName] = useState(''); // New state for display name
  const [instanceStatus, setInstanceStatus] = useState('DISCONNECTED');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInstanceData = async () => {
      if (!user) return;
      
      try {
        const instances = await getWhatsappInstances(user.id);
        if (instances && instances.length > 0) {
          const instance = instances[0];
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

  const handleDisconnect = async () => {
    if (!instanceId) return;

    setIsLoading(true);
    try {
      await updateInstanceStatus(instanceId, 'DISCONNECTED');
      setInstanceStatus('DISCONNECTED');
      toast.success('WhatsApp instance disconnected');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Failed to disconnect WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!instanceId) return;
    
    if (!instanceName.trim()) {
      toast.error('Por favor, digite um nome para a instância');
      return;
    }

    setIsSaving(true);
    try {
      await updateInstanceName(instanceId, instanceName);
      setDisplayName(instanceName); // Update display name with the input value
      toast.success('Nome da instância atualizado com sucesso!');
      setInstanceName(''); // Clear input field
    } catch (error) {
      console.error('Error updating instance name:', error);
      toast.error('Falha ao atualizar o nome da instância');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!instanceId) return;

    if (confirm('Are you sure you want to delete this instance? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        try {
          await disconnectInstance(instanceId);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (disconnectError) {
          console.error('Error disconnecting instance:', disconnectError);
        }
        
        await deleteWhatsappInstance(instanceId);
        
        setInstanceId(null);
        setInstanceName('');
        setDisplayName(''); // Reset display name as well
        setInstanceStatus('DISCONNECTED');
        setShowQRCode(false);
        
        toast.success('Instance deleted successfully');
      } catch (error) {
        console.error('Error deleting instance:', error);
        toast.error('Failed to delete instance');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Instance Settings</h2>
        <p className="text-gray-600 mt-1">Configure your WhatsApp instance</p>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-whatsapp flex items-center justify-center">
              <Phone size={20} className="text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {displayName ? 
                  <span className="text-whatsapp font-bold">{displayName}</span> : 
                  <span className="text-gray-400 italic">Sem nome</span>
                }
              </h3>
              <div className="flex items-center mt-1">
                <div 
                  className={`w-2 h-2 rounded-full mr-2 ${
                    instanceStatus === 'CONNECTED' ? 'bg-green-500' : 
                    instanceStatus === 'CONNECTING' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm text-gray-600">
                  {instanceStatus === 'CONNECTED' ? 'Conectado' : 
                   instanceStatus === 'CONNECTING' ? 'Conectando...' : 
                   'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Instância <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Digite o nome da instância aqui..."
              className="mt-1 block w-full rounded-md border-2 border-gray-300 px-3 py-2 bg-gray-50 shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50 text-gray-800 text-base"
            />
            <p className="mt-1 text-sm text-gray-500">
              Este nome é usado para identificar sua instância do WhatsApp. Salve o nome antes de conectar.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h4>
            <div className="flex flex-wrap gap-4">
              {instanceStatus !== 'CONNECTED' ? (
                <>
                  <button
                    onClick={handleConnect}
                    disabled={instanceStatus === 'CONNECTING' || !displayName.trim()}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${displayName.trim() ? 'bg-whatsapp hover:bg-whatsapp-dark transform hover:scale-105 shadow-lg' : 'bg-gray-400'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp disabled:opacity-50 transition-all duration-200`}
                  >
                    {instanceStatus === 'CONNECTING' ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      'Connect WhatsApp'
                    )}
                  </button>
                  {!displayName.trim() && (
                    <div className="w-full mt-2 text-sm bg-red-50 border border-red-200 rounded p-2 flex items-center text-red-600">
                      <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                      <span>Salve um nome para a instância antes de conectar.</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <AlertCircle size={16} className="mr-2" />
                    WhatsApp já está conectado
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                  >
                    Desconectar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Advanced Settings</h4>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-whatsapp shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable auto-reconnect</span>
                </label>
              </div>
              
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-whatsapp shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Save media files</span>
                </label>
              </div>
              
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-whatsapp shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable read receipts</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleDeleteInstance}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Instance
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp disabled:opacity-50 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {showQRCode && (
        <QRCodeDisplay 
          qrCode={qrCode} 
          onClose={() => {
            setShowQRCode(false);
            toast.success('QR code closed');
          }} 
        />
      )}
    </div>
  );
};

export default Settings;
