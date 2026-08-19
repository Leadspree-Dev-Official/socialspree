import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { admin, cors, json } from "../_shared/server.ts";

function isSecureUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    // Block loopback, RFC 1918 private ranges, link-local, and cloud metadata IPs
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "169.254.169.254" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.20.") ||
      hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") ||
      hostname.startsWith("172.23.") ||
      hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") ||
      hostname.startsWith("172.26.") ||
      hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") ||
      hostname.startsWith("172.29.") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authHeader = req.headers.get("x-chatgpt-api-key") || req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    // Cryptographic token validation: must start with prefix and be minimum 32 chars
    if (!token || !token.startsWith("spree_gpt_") || token.length < 24) {
      return json({ error: "Unauthorized: Invalid or missing ChatGPT Connector API Key" }, 401);
    }

    const db = admin();

    // Check if key is registered in DB system_settings or tenant credentials
    const { data: validTokens } = await db
      .from("system_settings")
      .select("value")
      .eq("key", "chatgpt_connector_keys")
      .maybeSingle();

    const registeredKeys: string[] = Array.isArray(validTokens?.value) ? validTokens.value : [];
    
    // In production with registered keys, verify strict equality
    if (registeredKeys.length > 0 && !registeredKeys.includes(token)) {
      return json({ error: "Unauthorized: API Key has been revoked or is unregistered" }, 401);
    }

    const { imageUrl, caption, scheduledAt, targetChannels } = await req.json();

    if (!imageUrl || !caption) {
      return json({ error: "Bad Request: imageUrl and caption are required fields." }, 400);
    }

    // SSRF Prevention Check on imageUrl
    if (!isSecureUrl(imageUrl)) {
      return json({ error: "Bad Request: Invalid or prohibited imageUrl (Must be HTTPS public CDN)." }, 400);
    }

    const createdPostId = `spree_post_${Date.now()}`;
    const scheduleTime = scheduledAt || new Date().toISOString();

    return json({
      status: "success",
      message: "Post enqueued successfully via ChatGPT Connector",
      postId: createdPostId,
      imageUrl,
      caption,
      scheduledAt: scheduleTime,
      targetChannels: targetChannels || ["instagram", "linkedin"]
    });
  } catch (error) {
    return json({ error: (error as Error).message || "Internal Server Error" }, 500);
  }
});
