import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Autenticação requerida');
    }

    const token = authHeader.split(' ')[1];

    const url = new URL(req.url);
    const instanceId = url.searchParams.get('instance_id');
    
    if (!instanceId) {
      throw new Error('Parâmetro instance_id é obrigatório');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data, error } = await supabaseClient
      .from('messages')
      .select('contact_number, content, direction, created_at, type, media_url, id')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const groupedByContact: Record<string, any[]> = {};
    
    data?.forEach(message => {
      if (!groupedByContact[message.contact_number]) {
        groupedByContact[message.contact_number] = [];
      }
      groupedByContact[message.contact_number].push(message);
    });
    
    const conversations = Object.entries(groupedByContact).map(([phoneNumber, messages]) => {
      const lastMessage = messages[0]; // messages are ordered by created_at desc
      
      return {
        name: phoneNumber, // Usando o número como nome (poderia ser atualizado com uma API de contatos)
        number: phoneNumber,
        lastMessage: lastMessage.content,
        timestamp: lastMessage.created_at
      };
    });
    
    return new Response(
      JSON.stringify(conversations),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
