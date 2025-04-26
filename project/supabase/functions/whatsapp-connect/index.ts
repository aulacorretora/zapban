import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Update instance status to CONNECTING
    await supabaseClient
      .from('whatsapp_instances')
      .update({ status: 'CONNECTING' })
      .eq('id', instanceId);

    // Mock QR code generation for now
    // In production, this would integrate with the actual WhatsApp Business API
    const mockQrCode = `00020101021226800014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000${instanceId}5204000053039865802BR5913Recipient Name6008BRASILIA62070503***63041234`;

    return new Response(
      JSON.stringify({
        qrCode: mockQrCode,
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