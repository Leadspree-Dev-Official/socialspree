import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-chatgpt-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-chatgpt-api-key") || req.headers.get("authorization");
    if (!apiKey || !apiKey.includes("spree_gpt_")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing ChatGPT Connector API Key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageUrl, caption, scheduledAt, targetChannels } = await req.json();

    if (!imageUrl || !caption) {
      return new Response(
        JSON.stringify({ error: "Bad Request: imageUrl and caption are required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdPostId = `spree_post_${Date.now()}`;
    const scheduleTime = scheduledAt || new Date().toISOString();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Post enqueued successfully via ChatGPT Connector",
        postId: createdPostId,
        imageUrl,
        caption,
        scheduledAt: scheduleTime,
        targetChannels: targetChannels || ["instagram", "linkedin"]
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
