import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { join } from "https://deno.land/std@0.168.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.168.0/fs/exists.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SESSION_DIR = join(Deno.cwd(), "whatsapp-sessions");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const instanceId = url.searchParams.get('id');

    if (!instanceId) {
      throw new Error('Instance ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const instanceSessionDir = join(SESSION_DIR, instanceId);
    const sessionExists = existsSync(instanceSessionDir);
    
    const authCredentialsPath = join(instanceSessionDir, "auth_credentials.json");
    const isAuthenticated = existsSync(authCredentialsPath);
    
    let status = 'DISCONNECTED';
    
    if (sessionExists) {
      if (isAuthenticated) {
        status = 'CONNECTED';
      } else {
        status = 'CONNECTING';
      }
    }
    
    await supabaseClient
      .from('whatsapp_instances')
      .update({ status })
      .eq('id', instanceId);
    
    return new Response(
      JSON.stringify({
        status,
        connection_data: {
          session_exists: sessionExists,
          is_authenticated: isAuthenticated
        }
      }),
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
