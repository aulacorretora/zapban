import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user?.id) {
        set({ user: null, loading: false });
        return;
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (userError) {
        // If user profile doesn't exist, create it
        const { data: newUserData, error: createError } = await supabase
          .from('users')
          .upsert([{
            id: sessionData.session.user.id,
            email: sessionData.session.user.email
          }], { 
            onConflict: 'id'
          })
          .select('id, email, name')
          .single();

        if (createError) {
          throw createError;
        }

        set({ user: newUserData, loading: false });
        return;
      }
      
      set({ user: userData, loading: false });
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ error: (error as Error).message, loading: false, user: null });
    }
  },
  setUser: (user) => set({ user, loading: false, error: null }),
  clearUser: () => set({ user: null, loading: false, error: null }),
}));