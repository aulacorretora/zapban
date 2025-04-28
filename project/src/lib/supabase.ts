import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Supabase client initialized with environment variables
const supabaseUrl = 'https://mopdlsgtfddzqjjerecz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vcGRsc2d0ZmRkenFqamVyZWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NjEwMDMsImV4cCI6MjA1ODEzNzAwM30.V8siUExiTOwKTqpIUEfgjJeDAeetORbf3pG8Nn4OgyA';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .update({ status })
    .eq('id', instanceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const connectWhatsApp = async (instanceId: string) => {
  try {
    const response = await fetch(
      `http://212.85.22.36:3000/connect?id=${instanceId}`,
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
    return data;
  } catch (error) {
    console.error('Error connecting to WhatsApp:', error);
    throw error;
  }
};

// Get WhatsApp instance status
export const getInstanceStatus = async (instanceId: string) => {
  try {
    const response = await fetch(
      `http://212.85.22.36:3000/status?id=${instanceId}`,
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
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('status, connection_data')
      .eq('id', instanceId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting instance status:', error);
    throw error;
  }
};

// Delete WhatsApp instance
export const deleteWhatsappInstance = async (instanceId: string) => {
  const { error } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', instanceId);

  if (error) {
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
