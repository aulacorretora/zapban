export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nome: string | null
          plan_id: string | null
          is_active: boolean
          role: string
          last_active: string
        }
        Insert: {
          id: string
          email: string
          nome?: string | null
          plan_id?: string | null
          is_active?: boolean
          role?: string
          last_active?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string | null
          plan_id?: string | null
          is_active?: boolean
          role?: string
          last_active?: string
        }
      }
      whatsapp_instances: {
        Row: {
          id: string
          name: string
          created_at: string
          user_id: string
          status: string
          connection_data: Json | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          user_id: string
          status: string
          connection_data?: Json | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          user_id?: string
          status?: string
          connection_data?: Json | null
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          created_at: string
          max_instances: number
          price: number
          features: Json
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          max_instances: number
          price: number
          features: Json
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          max_instances?: number
          price?: number
          features?: Json
        }
      }
      agent_settings: {
        Row: {
          id: string
          user_id: string
          instance_id: string
          is_active: boolean
          mode: string
          openai_model: string
          temperature: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          instance_id: string
          is_active?: boolean
          mode?: string
          openai_model?: string
          temperature?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          instance_id?: string
          is_active?: boolean
          mode?: string
          openai_model?: string
          temperature?: number
          created_at?: string
          updated_at?: string
        }
      }
      agent_triggers: {
        Row: {
          id: string
          user_id: string
          instance_id: string
          trigger_phrase: string
          response: string
          is_active: boolean
          action_buttons: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          instance_id: string
          trigger_phrase: string
          response: string
          is_active?: boolean
          action_buttons?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          instance_id?: string
          trigger_phrase?: string
          response?: string
          is_active?: boolean
          action_buttons?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
