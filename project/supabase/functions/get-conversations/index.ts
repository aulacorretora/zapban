import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request headers:", JSON.stringify(Object.fromEntries(req.headers)));
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  let requestBody: Record<string, unknown> = {};
  let userId: string | null = null;
  
  try {
    const authHeader = req.headers.get('Authorization');
    console.log("Authorization header:", authHeader ? "Present" : "Missing");
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Autenticação requerida');
    }

    const token = authHeader.split(' ')[1];
    console.log("Token extracted:", token ? token.substring(0, 10) + "..." : "None");

    if (req.method === 'POST') {
      try {
        const clonedReq = req.clone();
        requestBody = await clonedReq.json();
        console.log("Request body:", JSON.stringify(requestBody));
        userId = requestBody.user_id as string;
        console.log("user_id from body:", userId);
      } catch (e) {
        console.error("Error parsing request body:", e);
        throw new Error('Erro ao processar corpo da requisição');
      }
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: 'Parâmetro user_id é obrigatório',
          debug: {
            url: req.url,
            method: req.method,
            request_body: requestBody
          }
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

    console.log("Creating Supabase client with user_id:", userId);
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

    console.log("Querying 'whatsapp_instances' table for user_id:", userId);
    const { data: instance, error: instanceError } = await supabaseClient
      .from('whatsapp_instances')
      .select('id')
      .eq('user_id', userId)
      .eq('id', '160b6ea2-1cc4-48c3-ba9c-1b0ffaa8faf3')
      .single();
      
    if (instanceError) {
      console.error("Error fetching instance:", instanceError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar instância do WhatsApp',
          details: instanceError.message
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    if (!instance) {
      console.log("No WhatsApp instance found for user_id:", userId);
      return new Response(
        JSON.stringify({ error: "Instância não encontrada" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    const instanceId = instance.id;
    console.log("Found instance ID:", instanceId);
    
    let data;
    let error;
    
    try {
      console.log("Querying 'messages' table for instance_id:", instanceId);
      const result = await supabaseClient
        .from('messages')
        .select('*')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });
      
      data = result.data;
      error = result.error;
      console.log("Query result from 'messages':", data ? `${data.length} messages found` : 'No data', error ? `Error: ${error.message}` : 'No error');
      
    } catch (queryError) {
      console.error("Error during database query:", queryError);
      error = queryError;
    }
    
    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: 'Erro ao consultar mensagens',
          details: error.details || null,
          message: error.message || null,
          hint: error.hint || null,
          instance_id: instanceId
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    if (!data || data.length === 0) {
      console.log("No messages found for instance_id:", instanceId);
      return new Response(
        JSON.stringify([]),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    console.log("Processing messages for conversations");
    
    type MessageRecord = {
      id: string;
      from_number?: string;
      to_number?: string;
      contact_number?: string;
      content?: string;
      message?: string;
      created_at?: string;
      timestamp?: string;
      direction?: string;
      type?: string;
      media_type?: string;
      media_url?: string;
    };
    
    const groupedByContact: Record<string, MessageRecord[]> = {};
    
    data.forEach(message => {
      const contactNumber = message.from_number || message.to_number || message.contact_number;
      
      if (!contactNumber) {
        console.warn("Message without contact number:", message);
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
          type: lastMessage.media_type || 'TEXT',
          mediaUrl: lastMessage.media_url || null,
        },
        unreadCount: 0, // Could be calculated based on read status
        updatedAt: lastMessage.created_at || lastMessage.timestamp,
      };
    });
    
    console.log("Returning conversations:", conversations.length);
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
        details: error.details || null,
        hint: error.hint || null,
        debug: {
          url: req.url,
          method: req.method,
          user_id: userId,
          request_body: requestBody
        }
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
