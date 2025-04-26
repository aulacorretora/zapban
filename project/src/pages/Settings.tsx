import React, { useState } from 'react';
import { Phone, RefreshCw, Save, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import QRCodeDisplay from '../components/WhatsApp/QRCodeDisplay';

// Mocked QR code for demonstration
const MOCK_QR_CODE = 'https://wa.me/1234567890';

const Settings: React.FC = () => {
  const [instanceName, setInstanceName] = useState('Main Instance');
  const [instanceStatus, setInstanceStatus] = useState('DISCONNECTED');
  const [showQRCode, setShowQRCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleConnect = () => {
    setShowQRCode(true);
  };

  const handleDisconnect = () => {
    toast.success('WhatsApp instance disconnected');
    setInstanceStatus('DISCONNECTED');
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  const handleDeleteInstance = () => {
    if (confirm('Are you sure you want to delete this instance? This action cannot be undone.')) {
      toast.success('Instance deleted successfully');
      // Navigate back to dashboard
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
                {instanceName}
              </h3>
              <div className="flex items-center mt-1">
                <div 
                  className={`w-2 h-2 rounded-full mr-2 ${
                    instanceStatus === 'CONNECTED' ? 'bg-green-500' : 
                    instanceStatus === 'CONNECTING' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm text-gray-600">{instanceStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 mb-1">
              Instance Name
            </label>
            <input
              type="text"
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-whatsapp focus:ring focus:ring-whatsapp focus:ring-opacity-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              This name is used to identify your WhatsApp instance.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h4>
            <div className="flex flex-wrap gap-4">
              {instanceStatus !== 'CONNECTED' ? (
                <button
                  onClick={handleConnect}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                >
                  {instanceStatus === 'CONNECTING' ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect WhatsApp'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDisconnect}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                >
                  Disconnect
                </button>
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp disabled:opacity-50"
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
          qrCode={MOCK_QR_CODE} 
          onClose={() => {
            setShowQRCode(false);
            setInstanceStatus('CONNECTED');
            toast.success('WhatsApp connected successfully');
          }} 
        />
      )}
    </div>
  );
};

export default Settings;