import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Save, 
  Plus, 
  Trash2, 
  MessageSquare, 
  AlertTriangle,
  Edit,
  Check,
  X,
  Sliders,
  Info,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUserStore } from '../stores/userStore';
import { useAgentStore } from '../stores/agentStore';
import { getWhatsappInstances } from '../lib/supabase';
import { AgentMode } from '../lib/openaiService';

interface WhatsappInstance {
  id: string;
  name: string;
  status: string;
}

interface TriggerFormData {
  id?: string;
  trigger_phrase: string;
  response: string;
  is_active: boolean;
  action_buttons?: { text: string; action: string }[];
}

const HumanizedAgent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { 
    settings, 
    triggers, 
    isLoading,
    settingsLoading, 
    triggersLoading,
    error,
    initialize, 
    updateSettings, 
    saveSettings,
    addTrigger,
    updateTrigger,
    removeTrigger
  } = useAgentStore();
  
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [editingTriggerId, setEditingTriggerId] = useState<string | null>(null);
  const [triggerFormData, setTriggerFormData] = useState<TriggerFormData>({
    trigger_phrase: '',
    response: '',
    is_active: true,
    action_buttons: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  useEffect(() => {
    const loadInstances = async () => {
      if (!user) return;
      
      setInstancesLoading(true);
      
      try {
        const data = await getWhatsappInstances(user.id);
        
        const connectedInstances = data.filter((instance: WhatsappInstance) => instance.status === 'CONNECTED');
        setInstances(connectedInstances);
        
        if (connectedInstances.length > 0 && !selectedInstanceId) {
          setSelectedInstanceId(connectedInstances[0].id);
        }
      } catch (error) {
        console.error('Error loading WhatsApp instances:', error);
        toast.error('Falha ao carregar instâncias do WhatsApp');
      } finally {
        setInstancesLoading(false);
      }
    };
    
    loadInstances();
  }, [user]);
  
  useEffect(() => {
    const initAgent = async () => {
      try {
        console.log('Inicializando agente...');
        
        const specificInstanceId = '160b6ea2-1cc4-48c3-ba9c-1b0ffaa8faf3';
        
        if (selectedInstanceId) {
          console.log(`Inicializando agente com instância selecionada: ${selectedInstanceId}`);
          await initialize(selectedInstanceId);
        } else {
          console.log(`Usando ID da instância específica: ${specificInstanceId}`);
          await initialize(specificInstanceId);
        }
        
        console.log('Agente inicializado com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar agente:', error);
        
        try {
          const specificInstanceId = '160b6ea2-1cc4-48c3-ba9c-1b0ffaa8faf3';
          console.log(`Tentando novamente com instância específica: ${specificInstanceId}`);
          await initialize(specificInstanceId);
          console.log('Agente inicializado com sucesso na segunda tentativa');
        } catch (retryError) {
          console.error('Erro ao inicializar agente na segunda tentativa:', retryError);
        }
      }
    };
    
    initAgent();
  }, [selectedInstanceId, initialize]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const handleInstanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInstanceId(e.target.value);
  };
  
  const handleToggleActive = () => {
    if (settings && settings.is_active !== undefined) {
      updateSettings({ is_active: !settings.is_active });
    }
  };
  
  const handleModeChange = (mode: AgentMode) => {
    if (settings && settings.mode !== undefined) {
      updateSettings({ mode });
    }
  };
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (settings && settings.openai_model !== undefined) {
      updateSettings({ openai_model: e.target.value });
    }
  };
  
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (settings && settings.temperature !== undefined) {
      updateSettings({ temperature: parseFloat(e.target.value) });
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      await saveSettings();
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Falha ao salvar configurações');
    }
  };
  
  const handleAddTrigger = () => {
    setTriggerFormData({
      trigger_phrase: '',
      response: '',
      is_active: true,
      action_buttons: []
    });
    setEditingTriggerId(null);
    setShowTriggerForm(true);
  };
  
  const handleEditTrigger = (triggerId: string) => {
    const trigger = triggers.find(t => t.id === triggerId);
    
    if (trigger) {
      setTriggerFormData({
        id: trigger.id,
        trigger_phrase: trigger.trigger_phrase,
        response: trigger.response,
        is_active: trigger.is_active,
        action_buttons: trigger.action_buttons
      });
      setEditingTriggerId(triggerId);
      setShowTriggerForm(true);
    }
  };
  
  const handleRemoveTrigger = async (triggerId: string) => {
    if (confirm('Tem certeza que deseja remover este gatilho?')) {
      try {
        await removeTrigger(triggerId);
        toast.success('Gatilho removido com sucesso');
      } catch (error) {
        toast.error('Falha ao remover gatilho');
      }
    }
  };
  
  const handleTriggerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!triggerFormData.trigger_phrase.trim() || !triggerFormData.response.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      if (editingTriggerId) {
        await updateTrigger(editingTriggerId, {
          trigger_phrase: triggerFormData.trigger_phrase,
          response: triggerFormData.response,
          is_active: triggerFormData.is_active,
          action_buttons: triggerFormData.action_buttons
        });
        toast.success('Gatilho atualizado com sucesso');
      } else {
        await addTrigger({
          trigger_phrase: triggerFormData.trigger_phrase,
          response: triggerFormData.response,
          is_active: triggerFormData.is_active,
          action_buttons: triggerFormData.action_buttons
        });
        toast.success('Gatilho adicionado com sucesso');
      }
      
      setShowTriggerForm(false);
    } catch (error) {
      toast.error('Falha ao salvar gatilho');
    }
  };
  
  const handleCancelTriggerForm = () => {
    setShowTriggerForm(false);
    setEditingTriggerId(null);
  };
  
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading || instancesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-whatsapp"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Bot className="mr-2 text-whatsapp" size={28} />
          Agente Humanizado
        </h2>
        <p className="text-gray-600 mt-1">
          Configure seu assistente inteligente para responder automaticamente às mensagens
        </p>
      </div>
      
      {/* Instance selector */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Selecione uma instância do WhatsApp</h3>
        
        {instances.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Nenhuma instância do WhatsApp conectada encontrada. 
                  <a href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                    Conecte uma instância nas configurações
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md">
            <select
              value={selectedInstanceId || ''}
              onChange={handleInstanceChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-whatsapp focus:border-whatsapp rounded-md"
            >
              <option value="" disabled>Selecione uma instância</option>
              {instances.map(instance => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {selectedInstanceId && settings && (
        <>
          {/* Agent settings */}
          <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Configurações do Agente</h3>
                
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save size={18} className="mr-2" />
                  )}
                  Salvar configurações
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Active toggle */}
                <div>
                  <div className="flex items-center">
                    <button
                      onClick={handleToggleActive}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp ${
                        settings.is_active ? 'bg-whatsapp' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          settings.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {settings.is_active ? 'Agente ativo' : 'Agente inativo'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {settings.is_active 
                      ? 'O agente está ativo e processará mensagens conforme o modo selecionado' 
                      : 'O agente está inativo e não processará nenhuma mensagem'}
                  </p>
                </div>
                
                {/* Mode selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Modo de operação</label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="mode-active"
                        name="mode"
                        type="radio"
                        checked={settings.mode === 'ACTIVE'}
                        onChange={() => handleModeChange('ACTIVE')}
                        className="focus:ring-whatsapp h-4 w-4 text-whatsapp border-gray-300"
                      />
                      <label htmlFor="mode-active" className="ml-3 flex items-center">
                        <span className="block text-sm font-medium text-gray-700">Modo Ativo</span>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Automático
                        </span>
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 ml-7">
                      O agente responde automaticamente às mensagens com base nos gatilhos configurados ou usando IA
                    </p>
                    
                    <div className="flex items-center">
                      <input
                        id="mode-passive"
                        name="mode"
                        type="radio"
                        checked={settings.mode === 'PASSIVE'}
                        onChange={() => handleModeChange('PASSIVE')}
                        className="focus:ring-whatsapp h-4 w-4 text-whatsapp border-gray-300"
                      />
                      <label htmlFor="mode-passive" className="ml-3 flex items-center">
                        <span className="block text-sm font-medium text-gray-700">Modo Passivo</span>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Sugestões
                        </span>
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 ml-7">
                      O agente apenas sugere respostas, mas não as envia automaticamente
                    </p>
                  </div>
                </div>
                
                {/* Advanced settings */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="flex items-center text-sm font-medium text-gray-900 mb-4">
                    <Sliders size={16} className="mr-2" />
                    Configurações avançadas
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Model selection */}
                    <div>
                      <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                        Modelo de IA
                      </label>
                      <select
                        id="model"
                        value={settings.openai_model}
                        onChange={handleModelChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-whatsapp focus:border-whatsapp rounded-md"
                      >
                        <option value="gpt-4-turbo">GPT-4 Turbo (Recomendado)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais rápido)</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        O modelo GPT-4 Turbo oferece respostas mais precisas e naturais
                      </p>
                    </div>
                    
                    {/* Temperature slider */}
                    <div>
                      <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                        Temperatura: {settings?.temperature !== undefined ? settings.temperature.toFixed(1) : '0.0'}
                      </label>
                      <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings?.temperature !== undefined ? settings.temperature : 0}
                        onChange={handleTemperatureChange}
                        className="mt-1 block w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Mais preciso</span>
                        <span>Mais criativo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Triggers management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Gatilhos Inteligentes</h3>
                
                <button
                  onClick={handleAddTrigger}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                >
                  <Plus size={18} className="mr-2" />
                  Adicionar gatilho
                </button>
              </div>
              
              {/* Search and filter */}
              {triggers.length > 0 && !showTriggerForm && (
                <div className="mb-4 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder="Buscar gatilhos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-whatsapp focus:border-whatsapp"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="p-2 border border-gray-300 rounded-md focus:ring-whatsapp focus:border-whatsapp"
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>
              )}
              
              {/* Trigger form */}
              {showTriggerForm && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    {editingTriggerId ? 'Editar gatilho' : 'Novo gatilho'}
                  </h4>
                  
                  <form onSubmit={handleTriggerFormSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="trigger_phrase" className="block text-sm font-medium text-gray-700">
                          Frase gatilho
                        </label>
                        <input
                          type="text"
                          id="trigger_phrase"
                          value={triggerFormData.trigger_phrase}
                          onChange={(e) => setTriggerFormData({...triggerFormData, trigger_phrase: e.target.value})}
                          placeholder="Ex: Qual o valor?"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-whatsapp focus:border-whatsapp sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                          Resposta
                        </label>
                        <textarea
                          id="response"
                          value={triggerFormData.response}
                          onChange={(e) => setTriggerFormData({...triggerFormData, response: e.target.value})}
                          placeholder="Ex: Nossos planos variam de acordo com a sua necessidade. Quer ver uma simulação?"
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-whatsapp focus:border-whatsapp sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="is_active"
                          type="checkbox"
                          checked={triggerFormData.is_active}
                          onChange={(e) => setTriggerFormData({...triggerFormData, is_active: e.target.checked})}
                          className="h-4 w-4 text-whatsapp focus:ring-whatsapp border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                          Gatilho ativo
                        </label>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={handleCancelTriggerForm}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                        >
                          <X size={18} className="mr-2" />
                          Cancelar
                        </button>
                        
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                        >
                          <Check size={18} className="mr-2" />
                          {editingTriggerId ? 'Atualizar' : 'Adicionar'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Triggers list */}
              {triggersLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-whatsapp mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Carregando gatilhos...</p>
                </div>
              ) : triggers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum gatilho configurado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Adicione gatilhos para que o agente possa responder automaticamente a perguntas específicas.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleAddTrigger}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-whatsapp hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp"
                    >
                      <Plus size={18} className="mr-2" />
                      Adicionar primeiro gatilho
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Frase gatilho
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resposta
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {triggers
                        .filter(trigger => {
                          const matchesSearch = searchTerm === '' || 
                            trigger.trigger_phrase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            trigger.response.toLowerCase().includes(searchTerm.toLowerCase());
                          
                          const matchesStatus = 
                            statusFilter === 'all' || 
                            (statusFilter === 'active' && trigger.is_active) ||
                            (statusFilter === 'inactive' && !trigger.is_active);
                          
                          return matchesSearch && matchesStatus;
                        })
                        .map((trigger) => (
                        <tr key={trigger.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              trigger.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {trigger.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{trigger.trigger_phrase}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{trigger.response}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditTrigger(trigger.id)}
                              className="text-whatsapp hover:text-whatsapp-dark mr-3"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleRemoveTrigger(trigger.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Help text */}
              <div className="mt-6 flex items-start bg-blue-50 p-4 rounded-lg">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Como funcionam os gatilhos?</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Os gatilhos permitem que o agente responda automaticamente a perguntas específicas. Quando uma mensagem contém a frase gatilho, o agente responde com a resposta configurada.</p>
                    <p className="mt-1">Se nenhum gatilho corresponder à mensagem e o agente estiver no modo ativo, ele usará a IA para gerar uma resposta personalizada.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HumanizedAgent;
