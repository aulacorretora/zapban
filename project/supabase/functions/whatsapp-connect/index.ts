import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState } from "npm:@whiskeysockets/baileys@6.6.0";
import { Boom } from "npm:@hapi/boom@10.0.1";
import { ensureDir } from "https://deno.land/std@0.168.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.168.0/path/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SESSION_DIR = join(Deno.cwd(), "whatsapp-sessions");

async function connectWhatsApp(instanceId: string, supabaseClient: any) {
  try {
    const instanceSessionDir = join(SESSION_DIR, instanceId);
    await ensureDir(instanceSessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(instanceSessionDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    await supabaseClient
      .from('whatsapp_instances')
      .update({ 
        status: 'CONNECTING',
        connection_data: { error_message: null }
      })
      .eq('id', instanceId);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        await supabaseClient
          .from('whatsapp_instances')
          .update({ 
            status: 'CONNECTING',
            connection_data: { qr_code: qr }
          })
          .eq('id', instanceId);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        const errorMessage = shouldReconnect 
          ? (lastDisconnect?.error as Error)?.message || 'Connection closed' 
          : 'Logged out';
        
        await supabaseClient
          .from('whatsapp_instances')
          .update({ 
            status: 'DISCONNECTED',
            connection_data: { error_message: errorMessage }
          })
          .eq('id', instanceId);
      } else if (connection === 'open') {
        await supabaseClient
          .from('whatsapp_instances')
          .update({ 
            status: 'CONNECTED',
            connection_data: { qr_code: null, error_message: null }
          })
          .eq('id', instanceId);
      }
    });

    sock.ev.on('creds.update', saveCreds);

    return new Promise((resolve) => {
      const qrListener = async (qr: string) => {
        if (qr) {
          sock.ev.off('connection.update', qrListener);
          resolve(qr);
        }
      };

      sock.ev.on('connection.update', ({ qr }) => qrListener(qr));

      setTimeout(() => {
        sock.ev.off('connection.update', qrListener);
        resolve(null);
      }, 60000);
    });
  } catch (error) {
    console.error('Error connecting to WhatsApp:', error);
    
    await supabaseClient
      .from('whatsapp_instances')
      .update({ 
        status: 'DISCONNECTED',
        connection_data: { error_message: error.message }
      })
      .eq('id', instanceId);
      
    throw error;
  }
}

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

    await ensureDir(SESSION_DIR);

    const qrCode = await connectWhatsApp(instanceId, supabaseClient);

    if (!qrCode) {
      throw new Error('Failed to generate QR code within timeout period');
    }

    return new Response(
      JSON.stringify({
        qrCode,
        expiresIn: 60,
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
