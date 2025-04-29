import OpenAI from 'openai';
import { supabase } from './supabase';

let openaiClient: OpenAI | null = null;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export const getOpenAIClient = () => {
  if (!openaiClient && OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

export type AgentMode = 'ACTIVE' | 'PASSIVE';

export interface AgentSettings {
  id: string;
  user_id: string;
  instance_id: string;
  is_active: boolean;
  mode: AgentMode;
  openai_model: string;
  temperature: number;
  created_at: string;
  updated_at: string;
}

export interface AgentCompletionParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  conversationHistory?: Array<{role: 'user' | 'assistant'; content: string}>;
}

export interface AgentTrigger {
  id: string;
  user_id: string;
  instance_id: string;
  trigger_phrase: string;
  response: string;
  is_active: boolean;
  action_buttons?: {
    text: string;
    action: string;
  }[];
  created_at: string;
  updated_at: string;
}

export const getAgentSettings = async (instanceId: string): Promise<AgentSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('agent_settings')
      .select('*')
      .eq('instance_id', instanceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as AgentSettings;
  } catch (error) {
    console.error('Error fetching agent settings:', error);
    return null;
  }
};

export const saveAgentSettings = async (
  userId: string,
  instanceId: string,
  settings: {
    is_active: boolean;
    mode: AgentMode;
    openai_model?: string;
    temperature?: number;
  }
): Promise<AgentSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('agent_settings')
      .upsert(
        {
          user_id: userId,
          instance_id: instanceId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'instance_id' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as AgentSettings;
  } catch (error) {
    console.error('Error saving agent settings:', error);
    throw error;
  }
};

export const getAgentTriggers = async (instanceId: string): Promise<AgentTrigger[]> => {
  try {
    const { data, error } = await supabase
      .from('agent_triggers')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as AgentTrigger[];
  } catch (error) {
    console.error('Error fetching agent triggers:', error);
    return [];
  }
};

export const createAgentTrigger = async (
  userId: string,
  instanceId: string,
  trigger: {
    trigger_phrase: string;
    response: string;
    is_active?: boolean;
    action_buttons?: {
      text: string;
      action: string;
    }[];
  }
): Promise<AgentTrigger | null> => {
  try {
    const { data, error } = await supabase
      .from('agent_triggers')
      .insert({
        user_id: userId,
        instance_id: instanceId,
        ...trigger,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as AgentTrigger;
  } catch (error) {
    console.error('Error creating agent trigger:', error);
    throw error;
  }
};

export const updateAgentTrigger = async (
  triggerId: string,
  trigger: {
    trigger_phrase?: string;
    response?: string;
    is_active?: boolean;
    action_buttons?: {
      text: string;
      action: string;
    }[];
  }
): Promise<AgentTrigger | null> => {
  try {
    const { data, error } = await supabase
      .from('agent_triggers')
      .update({
        ...trigger,
        updated_at: new Date().toISOString(),
      })
      .eq('id', triggerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as AgentTrigger;
  } catch (error) {
    console.error('Error updating agent trigger:', error);
    throw error;
  }
};

export const deleteAgentTrigger = async (triggerId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('agent_triggers')
      .delete()
      .eq('id', triggerId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting agent trigger:', error);
    throw error;
  }
};

export const checkMessageAgainstTriggers = async (
  instanceId: string,
  message: string
): Promise<AgentTrigger | null> => {
  try {
    const triggers = await getAgentTriggers(instanceId);
    
    for (const trigger of triggers) {
      if (
        trigger.is_active &&
        (message.toLowerCase().includes(trigger.trigger_phrase.toLowerCase()) ||
         trigger.trigger_phrase.toLowerCase().includes(message.toLowerCase()))
      ) {
        return trigger;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking message against triggers:', error);
    return null;
  }
};

export const generateAIResponse = async (
  params: AgentCompletionParams
): Promise<string> => {
  try {
    const openai = getOpenAIClient();
    
    if (!openai) {
      throw new Error('OpenAI client not initialized. API key may be missing.');
    }
    
    const messages = [
      {
        role: 'system',
        content: 'Você é um assistente virtual de atendimento ao cliente profissional e amigável chamado ZapBrain. Suas respostas devem ser claras, úteis e naturais, como se fossem escritas por um humano. Use o contexto da conversa para fornecer respostas mais precisas e relevantes. Seja prestativo, mas conciso.'
      }
    ];
    
    if (params.conversationHistory && params.conversationHistory.length > 0) {
      messages.push(...params.conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })));
    }
    
    messages.push({
      role: 'user',
      content: params.prompt
    });
    
    const completion = await openai.chat.completions.create({
      model: params.model || 'gpt-4-turbo',
      messages: messages as Array<OpenAI.Chat.ChatCompletionMessageParam>,
      temperature: params.temperature || 0.7,
      max_tokens: params.maxTokens || 150,
    });

    return completion.choices[0].message.content || 'Não foi possível gerar uma resposta.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Desculpe, não foi possível gerar uma resposta no momento.';
  }
};

export const getAgentStatus = async (instanceId: string): Promise<{ isActive: boolean; mode: AgentMode } | null> => {
  try {
    const settings = await getAgentSettings(instanceId);
    
    if (!settings) {
      return null;
    }
    
    return {
      isActive: settings.is_active,
      mode: settings.mode
    };
  } catch (error) {
    console.error('Error getting agent status:', error);
    return null;
  }
};

export const processMessageWithAgent = async (
  instanceId: string,
  message: string,
  conversationHistory?: Array<{role: 'user' | 'assistant'; content: string}>
): Promise<{ response: string | null; source: 'trigger' | 'ai' | null; actionButtons?: { text: string; action: string }[] }> => {
  try {
    const agentStatus = await getAgentStatus(instanceId);
    
    if (!agentStatus || !agentStatus.isActive) {
      return { response: null, source: null };
    }
    
    const trigger = await checkMessageAgainstTriggers(instanceId, message);
    
    if (trigger) {
      return { 
        response: trigger.response, 
        source: 'trigger',
        actionButtons: trigger.action_buttons 
      };
    }
    
    if (agentStatus.mode === 'ACTIVE') {
      const settings = await getAgentSettings(instanceId);
      
      if (!settings) {
        return { response: null, source: null };
      }
      
      const aiResponse = await generateAIResponse({
        prompt: message,
        model: settings.openai_model,
        temperature: settings.temperature,
        conversationHistory: conversationHistory
      });
      
      return { response: aiResponse, source: 'ai' };
    }
    
    return { response: null, source: null };
  } catch (error) {
    console.error('Error processing message with agent:', error);
    return { response: null, source: null };
  }
};

/**
 * Transcribe audio using OpenAI's Whisper API
 * @param audioFile File object containing the audio to transcribe
 * @returns Transcribed text or null if transcription failed
 */
export const transcribeAudio = async (audioFile: File): Promise<string | null> => {
  try {
    const openai = getOpenAIClient();
    
    if (!openai) {
      throw new Error('OpenAI client not initialized. API key may be missing.');
    }
    
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const blob = new Blob([buffer]);
    const file = new File([blob], audioFile.name, { type: audioFile.type });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'text'
    });
    
    return transcription || null;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
};
