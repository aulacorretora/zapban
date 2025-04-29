import { create } from 'zustand';
import { 
  getAgentSettings, 
  saveAgentSettings, 
  getAgentTriggers, 
  createAgentTrigger, 
  updateAgentTrigger, 
  deleteAgentTrigger,
  AgentTrigger,
  AgentMode,
  generateAIResponse,
  processMessageWithAgent
} from '../lib/openaiService';

interface AgentSettings {
  id?: string;
  is_active: boolean;
  mode: AgentMode;
  openai_model: string;
  temperature: number;
}

interface AgentState {
  instanceId: string | null;
  settings: AgentSettings | null;
  triggers: AgentTrigger[];
  isLoading: boolean;
  settingsLoading: boolean;
  triggersLoading: boolean;
  error: string | null;
  conversationHistory: Record<string, Array<{role: 'user' | 'assistant'; content: string}>>;
  
  initialize: (instanceId: string) => Promise<void>;
  loadSettings: (instanceId: string) => Promise<void>;
  loadTriggers: (instanceId: string) => Promise<void>;
  updateSettings: (settings: Partial<AgentSettings>) => Promise<void>;
  saveSettings: () => Promise<void>;
  addTrigger: (trigger: Omit<AgentTrigger, 'id' | 'is_active' | 'user_id' | 'instance_id' | 'created_at' | 'updated_at'> & { is_active?: boolean }) => Promise<void>;
  updateTrigger: (triggerId: string, updates: Partial<Omit<AgentTrigger, 'id' | 'user_id' | 'instance_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  removeTrigger: (triggerId: string) => Promise<void>;
  generateResponse: (message: string, conversationId: string) => Promise<string | null>;
  processMessage: (message: string, conversationId: string) => Promise<{ 
    response: string | null; 
    source: 'trigger' | 'ai' | null; 
    actionButtons?: { text: string; action: string }[] 
  }>;
  addToConversationHistory: (conversationId: string, message: string, isFromUser: boolean) => void;
  transcribeAudio: (audioFile: File) => Promise<string | null>;
  analyzeImage: (imageFile: File) => Promise<{ text: string; objects: string[] } | null>;
  extractPdfText: (pdfFile: File) => Promise<string | null>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  instanceId: null,
  settings: null,
  triggers: [],
  isLoading: false,
  settingsLoading: false,
  triggersLoading: false,
  error: null,
  conversationHistory: {},

  initialize: async (instanceId: string) => {
    set({ instanceId, isLoading: true, error: null });
    
    try {
      await get().loadSettings(instanceId);
      await get().loadTriggers(instanceId);
    } catch (error) {
      set({ error: 'Falha ao inicializar o agente' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSettings: async (instanceId: string) => {
    set({ settingsLoading: true, error: null });
    
    try {
      const settings = await getAgentSettings(instanceId);
      
      if (settings) {
        set({ 
          settings: {
            id: settings.id,
            is_active: settings.is_active,
            mode: settings.mode,
            openai_model: settings.openai_model,
            temperature: settings.temperature
          } 
        });
      } else {
        set({ 
          settings: {
            is_active: false,
            mode: 'PASSIVE',
            openai_model: 'gpt-4-turbo',
            temperature: 0.7
          }
        });
      }
    } catch (error) {
      set({ error: 'Falha ao carregar configurações do agente' });
    } finally {
      set({ settingsLoading: false });
    }
  },

  loadTriggers: async (instanceId: string) => {
    set({ triggersLoading: true, error: null });
    
    try {
      const triggers = await getAgentTriggers(instanceId);
      set({ triggers });
    } catch (error) {
      set({ error: 'Falha ao carregar gatilhos' });
    } finally {
      set({ triggersLoading: false });
    }
  },

  updateSettings: async (updates: Partial<AgentSettings>) => {
    const { settings } = get();
    
    if (settings) {
      set({ 
        settings: { 
          ...settings, 
          ...updates 
        } 
      });
    }
  },

  saveSettings: async () => {
    const { settings, instanceId } = get();
    
    if (!settings || !instanceId) return;
    
    set({ settingsLoading: true, error: null });
    
    try {
      const userId = (await import('./userStore')).useUserStore.getState().user?.id;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      
      const updatedSettings = await saveAgentSettings(userId, instanceId, {
        is_active: settings.is_active,
        mode: settings.mode,
        openai_model: settings.openai_model,
        temperature: settings.temperature
      });
      
      if (updatedSettings) {
        set({ 
          settings: {
            id: updatedSettings.id,
            is_active: updatedSettings.is_active,
            mode: updatedSettings.mode,
            openai_model: updatedSettings.openai_model,
            temperature: updatedSettings.temperature
          } 
        });
      }
    } catch (error) {
      set({ error: 'Falha ao salvar configurações' });
    } finally {
      set({ settingsLoading: false });
    }
  },

  addTrigger: async (trigger) => {
    const { instanceId } = get();
    
    if (!instanceId) return;
    
    set({ triggersLoading: true, error: null });
    
    try {
      const userId = (await import('./userStore')).useUserStore.getState().user?.id;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      
      const newTrigger = await createAgentTrigger(userId, instanceId, trigger);
      
      if (newTrigger) {
        set(state => ({ 
          triggers: [newTrigger, ...state.triggers] 
        }));
      }
    } catch (error) {
      set({ error: 'Falha ao adicionar gatilho' });
    } finally {
      set({ triggersLoading: false });
    }
  },

  updateTrigger: async (triggerId, updates) => {
    set({ triggersLoading: true, error: null });
    
    try {
      const updatedTrigger = await updateAgentTrigger(triggerId, updates);
      
      if (updatedTrigger) {
        set(state => ({
          triggers: state.triggers.map(t => 
            t.id === triggerId ? updatedTrigger : t
          )
        }));
      }
    } catch (error) {
      set({ error: 'Falha ao atualizar gatilho' });
    } finally {
      set({ triggersLoading: false });
    }
  },

  removeTrigger: async (triggerId) => {
    set({ triggersLoading: true, error: null });
    
    try {
      const success = await deleteAgentTrigger(triggerId);
      
      if (success) {
        set(state => ({
          triggers: state.triggers.filter(t => t.id !== triggerId)
        }));
      }
    } catch (error) {
      set({ error: 'Falha ao remover gatilho' });
    } finally {
      set({ triggersLoading: false });
    }
  },

  generateResponse: async (message: string, conversationId: string) => {
    const { instanceId, settings, conversationHistory } = get();
    
    if (!instanceId || !settings || !settings.is_active) {
      return null;
    }
    
    try {
      get().addToConversationHistory(conversationId, message, true);
      
      const history = conversationHistory[conversationId] || [];
      
      const response = await generateAIResponse({
        prompt: message,
        model: settings.openai_model,
        temperature: settings.temperature,
        conversationHistory: history
      });
      
      if (response) {
        get().addToConversationHistory(conversationId, response, false);
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      return null;
    }
  },

  processMessage: async (message: string, conversationId: string) => {
    const { instanceId, conversationHistory } = get();
    
    if (!instanceId) {
      return { response: null, source: null };
    }
    
    try {
      get().addToConversationHistory(conversationId, message, true);
      
      const history = conversationHistory[conversationId] || [];
      
      const result = await processMessageWithAgent(instanceId, message, history);
      
      if (result.response) {
        get().addToConversationHistory(conversationId, result.response, false);
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao processar mensagem com agente:', error);
      return { response: null, source: null };
    }
  },

  addToConversationHistory: (conversationId: string, message: string, isFromUser: boolean) => {
    set(state => {
      const history = state.conversationHistory[conversationId] || [];
      return {
        ...state,
        conversationHistory: {
          ...state.conversationHistory,
          [conversationId]: [
            ...history,
            { role: isFromUser ? 'user' : 'assistant', content: message }
          ].slice(-10) // Keep only the last 10 messages for context
        }
      };
    });
  },
  
  transcribeAudio: async (audioFile: File) => {
    const { instanceId, settings } = get();
    
    if (!instanceId || !settings || !settings.is_active) {
      return null;
    }
    
    try {
      const openai = (await import('../lib/openaiService')).getOpenAIClient();
      
      if (!openai) {
        throw new Error('Cliente OpenAI não inicializado. A chave da API pode estar faltando.');
      }
      
      const transcription = await (await import('../lib/openaiService')).transcribeAudio(audioFile);
      return transcription;
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      set({ error: 'Falha ao transcrever áudio' });
      return null;
    }
  },
  
  analyzeImage: async (imageFile: File) => {
    const { instanceId, settings } = get();
    
    if (!instanceId || !settings || !settings.is_active) {
      return null;
    }
    
    try {
      const openai = (await import('../lib/openaiService')).getOpenAIClient();
      
      if (!openai) {
        throw new Error('Cliente OpenAI não inicializado. A chave da API pode estar faltando.');
      }
      
      const analysis = await (await import('../lib/openaiService')).analyzeImage(imageFile);
      return analysis;
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      set({ error: 'Falha ao analisar imagem' });
      return null;
    }
  },
  
  extractPdfText: async (pdfFile: File) => {
    const { instanceId, settings } = get();
    
    if (!instanceId || !settings || !settings.is_active) {
      return null;
    }
    
    try {
      const openai = (await import('../lib/openaiService')).getOpenAIClient();
      
      if (!openai) {
        throw new Error('Cliente OpenAI não inicializado. A chave da API pode estar faltando.');
      }
      
      const text = await (await import('../lib/openaiService')).extractPdfText(pdfFile);
      return text;
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      set({ error: 'Falha ao extrair texto do PDF' });
      return null;
    }
  }
}));
