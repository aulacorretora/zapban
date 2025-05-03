import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Supabase client initialized with environment variables
const supabaseUrl = 'https://mopdlsgtfddzqjjerecz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vcGRsc2d0ZmRkenFqamVyZWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NjEwMDMsImV4cCI6MjA1ODEzNzAwM30.V8siUExiTOwKTqpIUEfgjJeDAeetORbf3pG8Nn4OgyA';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const getApiBaseUrl = () => {
  // Check if we're in production (zapban.com)
  if (window.location.hostname === 'zapban.com') {
    return 'https://zapban.com';
  }
  return '';
};

// Check if user is authenticated
export const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return session;
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // If login successful, fetch user profile
    if (data.session) {
      try {
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('id, email, nome')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Create profile if it doesn't exist
          const { data: newUserData, error: createError } = await supabase
            .from('users')
            .upsert([{
              id: data.session.user.id,
              email: data.session.user.email
            }], {
              onConflict: 'id'
            })
            .select('id, email, nome')
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            return { data, userData: null };
          }

          return { data, userData: newUserData };
        }

        return { data, userData };
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        return { data, userData: null };
      }
    }

    return { data, userData: null };
  } catch (error) {
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, nome: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Create user profile
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .upsert([{
          id: data.user.id,
          email: data.user.email,
          nome: nome
        }], {
          onConflict: 'id'
        })
        .select('id, email, nome')
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        throw profileError;
      }

      return { data, userData };
    }

    return { data, userData: null };
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, nome')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

// Get user's WhatsApp instances
export const getWhatsappInstances = async (userId: string) => {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

// Create a new WhatsApp instance
export const createWhatsappInstance = async (userId: string, name: string) => {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .insert([{
      user_id: userId,
      name,
      status: 'DISCONNECTED'
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Update WhatsApp instance status
export const updateInstanceStatus = async (instanceId: string, status: string) => {
  try {
    try {
      const vpsResponse = await fetch(
        `${getApiBaseUrl()}/api/whatsapp/update-status?id=${instanceId}&status=${status}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!vpsResponse.ok) {
        console.warn(`VPS API update-status endpoint not available: ${vpsResponse.status}`);
      }
    } catch (apiError) {
      console.warn('VPS API update-status endpoint not available, updating only in Supabase:', apiError);
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({ status })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating instance status in Supabase:', error);
      return { id: instanceId, status };
    }

    return data;
  } catch (error) {
    console.error('Error updating instance status:', error);
    return { id: instanceId, status };
  }
};

export const connectWhatsApp = async (instanceId: string) => {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/whatsapp/connect?id=${instanceId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to connect to WhatsApp');
    }

    const data = await response.json();
    
    setTimeout(async () => {
      try {
        await getInstanceStatus(instanceId);
      } catch (statusError) {
        console.warn('Failed to update status after connect:', statusError);
      }
    }, 1000);
    
    return data;
  } catch (error) {
    console.error('Error connecting to WhatsApp:', error);
    throw error;
  }
};

// Get WhatsApp instance status
export const getInstanceStatus = async (instanceId: string) => {
  try {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/whatsapp/status?id=${instanceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.status) {
          // Update Supabase with the latest status
          await updateInstanceStatus(instanceId, data.status);
          return { status: data.status, connection_data: data.connection_data || null };
        }
      } else {
        console.warn(`VPS API status endpoint returned error: ${response.status}`);
      }
    } catch (apiError) {
      console.warn('VPS API status endpoint not available, trying Supabase Functions:', apiError);
      
      try {
        const supabaseResponse = await fetch(
          `${supabaseUrl}/functions/v1/whatsapp-status?id=${instanceId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (supabaseResponse.ok) {
          const data = await supabaseResponse.json();
          if (data && data.status) {
            // Update Supabase with the latest status
            await updateInstanceStatus(instanceId, data.status);
            return { status: data.status, connection_data: data.connection_data || null };
          }
        }
      } catch (edgeError) {
        console.warn('Supabase edge function also unavailable, falling back to database:', edgeError);
      }
    }

    // Fallback to Supabase if all API calls fail
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('status, connection_data')
      .eq('id', instanceId)
      .single();

    if (error) {
      console.error('Error getting instance status from Supabase:', error);
      return { status: 'DISCONNECTED', connection_data: null };
    }

    return data;
  } catch (error) {
    console.error('Error getting instance status:', error);
    return { status: 'DISCONNECTED', connection_data: null };
  }
};

// Update WhatsApp instance name
export const updateInstanceName = async (instanceId: string, name: string) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({ name })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating instance name:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating instance name:', error);
    throw error;
  }
};

// Disconnect WhatsApp instance
export const disconnectInstance = async (instanceId: string) => {
  try {
    return await updateInstanceStatus(instanceId, 'DISCONNECTED');
  } catch (error) {
    console.error('Error disconnecting instance:', error);
    throw error;
  }
};

// Delete WhatsApp instance
export const deleteWhatsappInstance = async (instanceId: string) => {
  try {
    const { status } = await getInstanceStatus(instanceId);
    
    if (status === 'CONNECTED') {
      await disconnectInstance(instanceId);
    }
    
    const { error } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting WhatsApp instance:', error);
    throw error;
  }
};

// Get user's plan
export const getUserPlan = async (userId: string) => {
  try {
    // First, get the user's plan_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan_id')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    if (!userData?.plan_id) {
      return null;
    }

    // Then, get the plan details using the plan_id
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('id, name, max_instances, features')
      .eq('id', userData.plan_id)
      .single();

    if (planError) {
      throw planError;
    }

    return planData;
  } catch (error) {
    console.error('Error fetching user plan:', error);
    throw error;
  }
};

// Get message analytics
export const getMessageAnalytics = async (userId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('message_analytics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

// Get WhatsApp conversations
export const getWhatsAppConversations = async (instanceId: string) => {
  try {
    const { data, error } = await supabase
      .from('message')
      .select('id, from_number, to_number, content, created_at, media_url, user_id')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false });
    
    let messagesData = data;
    let messagesError = error;

    if ((!messagesData || messagesData.length === 0) && !messagesError?.message?.includes("does not exist")) {
      console.log('Não foi possível encontrar mensagens na tabela "message", tentando na tabela "messages"');
      const fallbackResult = await supabase
        .from('messages')
        .select('id, from_number, to_number, content, created_at, media_url, user_id, contact_number, message, timestamp, direction, type')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });
      
      messagesData = fallbackResult.data;
      messagesError = fallbackResult.error;
    }
    
    if (messagesError) throw messagesError;
    
    if (!messagesData || messagesData.length === 0) {
      return [];
    }
    
    const groupedByContact: Record<string, any[]> = {};
    
    messagesData.forEach(message => {
      const contactNumber = message.from_number || message.to_number;
      
      if (!contactNumber) {
        console.warn("Mensagem sem número de contato:", message);
        return;
      }
      
      if (!groupedByContact[contactNumber]) {
        groupedByContact[contactNumber] = [];
      }
      groupedByContact[contactNumber].push(message);
    });
    
    const conversations = Object.entries(groupedByContact).map(([phoneNumber, messages]) => {
      const lastMessage = messages[0]; // messages are ordered by created_at desc
      
      return {
        id: phoneNumber, // Using phone number as id
        contact: {
          id: phoneNumber,
          name: phoneNumber, // Placeholder name (could be updated with contacts API)
          phoneNumber,
          profilePicUrl: null,
          isOnline: false,
          lastSeen: null,
        },
        lastMessage: {
          id: `${lastMessage.id}`,
          content: lastMessage.content || lastMessage.message,
          timestamp: lastMessage.created_at || lastMessage.timestamp,
          isFromMe: lastMessage.direction === 'OUTBOUND' || false, // Check direction if available
          status: 'DELIVERED',
          type: lastMessage.type || 'TEXT',
          mediaUrl: lastMessage.media_url || null,
        },
        unreadCount: 0, // Could be calculated based on read status
        updatedAt: lastMessage.created_at || lastMessage.timestamp,
      };
    });
    
    return conversations;
  } catch (error) {
    console.error('Error fetching WhatsApp conversations:', error);
    throw error;
  }
};

// Get WhatsApp messages for a specific conversation
export const getWhatsAppMessages = async (instanceId: string, contactNumber: string) => {
  try {
    const { data, error } = await supabase
      .from('message')
      .select('id, from_number, to_number, content, created_at, media_url, user_id')
      .eq('instance_id', instanceId)
      .or(`from_number.eq.${contactNumber},to_number.eq.${contactNumber}`)
      .order('created_at', { ascending: true });
    
    let messagesData = data;
    let messagesError = error;

    if ((!messagesData || messagesData.length === 0) && !messagesError?.message?.includes("does not exist")) {
      console.log('Não foi possível encontrar mensagens na tabela "message", tentando na tabela "messages"');
      const fallbackResult = await supabase
        .from('messages')
        .select('*')
        .eq('instance_id', instanceId)
        .or(`from_number.eq.${contactNumber},to_number.eq.${contactNumber},contact_number.eq.${contactNumber}`)
        .order('created_at', { ascending: true });
      
      messagesData = fallbackResult.data;
      messagesError = fallbackResult.error;
    }
    
    if (messagesError) throw messagesError;
    
    const messages = messagesData?.map(message => ({
      id: `${message.id}`,
      conversationId: contactNumber,
      content: message.content,
      timestamp: message.created_at,
      isFromMe: message.to_number === contactNumber, 
      status: 'DELIVERED',
      type: 'TEXT',
      mediaUrl: message.media_url || null,
    }));
    
    return messages || [];
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
    throw error;
  }
};

export const sendWhatsAppMessage = async (instanceId: string, contactNumber: string, content: string, mediaType?: string, mediaUrl?: string) => {
  try {
    // First, try to send the message through the WhatsApp API
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/whatsapp/send-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instanceId,
            to: contactNumber,
            message: content,
            mediaType,
            mediaUrl
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (apiError) {
      console.error('Error sending message through API:', apiError);
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        instance_id: instanceId,
        contact_number: contactNumber,
        content: content,
        direction: 'OUTBOUND',
        type: mediaType || 'TEXT',
        media_url: mediaUrl || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};
