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

  const db = admin();

  try {
    // 1. Authenticate Request via Bearer Token or Header
    const authHeader = req.headers.get("x-chatgpt-api-key") || req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token || token.length < 8) {
      return json({ error: "Unauthorized: Missing or invalid SocialSpree API Key" }, 401);
    }

    // Lookup matching tenant or key in tenants table or system_settings
    let tenantId = "";
    let tenantName = "SocialSpree Workspace";

    // Try finding tenant by api_key or id
    const { data: tenantData } = await db
      .from("tenants")
      .select("id, name, api_key")
      .or(`api_key.eq.${token},id.eq.${token}`)
      .maybeSingle();

    if (tenantData) {
      tenantId = tenantData.id;
      tenantName = tenantData.name;
    } else {
      // Fallback check in system_settings or default primary tenant
      const { data: primaryTenant } = await db
        .from("tenants")
        .select("id, name")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (primaryTenant) {
        tenantId = primaryTenant.id;
        tenantName = primaryTenant.name;
      } else {
        return json({ error: "Unauthorized: Invalid SocialSpree credentials" }, 401);
      }
    }

    const url = new URL(req.url);

    // =========================================================================
    // GET /chatgpt-connector ➔ List Connected Social Accounts for ChatGPT
    // =========================================================================
    if (req.method === "GET" || url.searchParams.get("action") === "list_accounts") {
      const { data: accounts, error: accError } = await db
        .from("social_connections")
        .select("id, platform, channel_account_id, account_name, account_handle, status, slot_number")
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (accError) {
        return json({ error: "Failed to query social accounts", details: accError.message }, 500);
      }

      return json({
        status: "success",
        workspace: {
          tenantId,
          tenantName,
          connectedChannelsCount: accounts?.length || 0,
        },
        availableChannels: (accounts || []).map((acc) => ({
          accountId: acc.channel_account_id,
          platform: acc.platform,
          accountName: acc.account_name || acc.account_handle || `${acc.platform} Account`,
          slotNumber: acc.slot_number,
        })),
        instructionsForAssistant: "Use the accountId or platform names above when calling schedulePost.",
      });
    }

    // =========================================================================
    // POST /chatgpt-connector ➔ Schedule Image & Caption from ChatGPT
    // =========================================================================
    if (req.method === "POST") {
      const body = await req.json();
      const caption = body.caption || body.content || "";
      const mediaUrls: string[] = Array.isArray(body.mediaUrls) && body.mediaUrls.length > 0
        ? body.mediaUrls
        : (body.imageUrl ? [body.imageUrl] : []);
      const scheduledAt = body.scheduledAt || body.scheduledFor || null;
      const targetChannels = body.targetChannels || body.platforms || [];
      const publishNow = Boolean(body.publishNow);

      if (!caption && mediaUrls.length === 0) {
        return json({ error: "Bad Request: Either content/caption or imageUrl/mediaUrls must be provided." }, 400);
      }

      for (const mUrl of mediaUrls) {
        if (!isSecureUrl(mUrl)) {
          return json({ error: `Bad Request: Insecure media URL: ${mUrl}. Must be a valid public HTTPS URL.` }, 400);
        }
      }

      // Fetch active accounts for this tenant
      const { data: connections } = await db
        .from("social_connections")
        .select("id, platform, channel_account_id, account_name, slot_number")
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (!connections || connections.length === 0) {
        return json({
          error: "No active social accounts found in your SocialSpree workspace. Please connect an account first in SocialSpree.",
        }, 400);
      }

      // Filter targeted accounts
      let selectedAccountRefs: any[] = [];
      const requestedTargets: string[] = Array.isArray(targetChannels) && targetChannels.length > 0 
        ? targetChannels.map(t => String(t).toLowerCase()) 
        : [];

      if (requestedTargets.length > 0) {
        selectedAccountRefs = connections.filter((c) => 
          requestedTargets.includes(c.platform.toLowerCase()) || 
          requestedTargets.includes(c.channel_account_id.toLowerCase()) ||
          requestedTargets.some(t => (c.account_name || '').toLowerCase().includes(t))
        ).map(c => ({
          accountId: c.channel_account_id,
          platform: c.platform,
          slot: c.slot_number ?? 1,
        }));
      }

      // Fallback: If no target specified or no match, schedule to all active connections
      if (selectedAccountRefs.length === 0) {
        selectedAccountRefs = connections.map(c => ({
          accountId: c.channel_account_id,
          platform: c.platform,
          slot: c.slot_number ?? 1,
        }));
      }

      const mediaType = mediaUrls.length > 0 ? "image" : "none";
      const now = new Date();
      let scheduleIso = scheduledAt ? new Date(scheduledAt).toISOString() : now.toISOString();

      // If scheduled time is in the past, default to 5 minutes in the future or publish now
      if (publishNow || new Date(scheduleIso).getTime() <= now.getTime()) {
        scheduleIso = now.toISOString();
      }

      const status = publishNow ? "publishing" : "scheduled";

      // 1. Insert into `posts` table
      const { data: createdPost, error: postErr } = await db
        .from("posts")
        .insert({
          tenant_id: tenantId,
          content: caption || "",
          media_urls: mediaUrls,
          media_type: mediaType,
          is_cloudflare_hosted: true,
          selected_account_ids: selectedAccountRefs,
          status: status,
          scheduled_for: scheduleIso,
          created_at: now.toISOString(),
        })
        .select("id, status, scheduled_for, created_at")
        .single();

      if (postErr || !createdPost) {
        return json({ error: "Failed to create post record", details: postErr?.message }, 500);
      }

      // 2. Insert into `publishing_jobs` background queue
      const { data: createdJob, error: jobErr } = await db
        .from("publishing_jobs")
        .insert({
          tenant_id: tenantId,
          post_id: createdPost.id,
          status: "queued",
          run_after: scheduleIso,
          attempts: 0,
          max_attempts: 3,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select("id, status, run_after")
        .single();

      if (jobErr) {
        console.error("Warning: Failed to enqueue publishing job:", jobErr);
      }

      // 3. Log event
      await db.from("post_logs").insert({
        tenant_id: tenantId,
        post_id: createdPost.id,
        execution_type: publishNow ? "instant" : "scheduled",
        http_status: 200,
        request_payload: {
          source: "chatgpt_plugin_connector",
          caption,
          mediaUrls,
          targetChannels: selectedAccountRefs,
        },
        response_payload: {
          jobId: createdJob?.id || null,
          postId: createdPost.id,
          scheduledAt: scheduleIso,
        },
        created_at: now.toISOString(),
      });

      return json({
        status: "success",
        message: publishNow 
          ? "Post dispatched immediately to SocialSpree execution queue!"
          : `Post successfully scheduled in SocialSpree for ${new Date(scheduleIso).toLocaleString("en-US", { timeZone: "UTC" })} UTC!`,
        postId: createdPost.id,
        jobId: createdJob?.id || null,
        scheduledAt: scheduleIso,
        targetChannels: selectedAccountRefs.map(r => ({
          platform: r.platform,
          accountId: r.accountId,
        })),
        preview: {
          content: caption,
          mediaUrls,
          calendarUrl: "https://socialspree.leadspree.in/calendar",
        },
      });
    }

    return json({ error: `Method ${req.method} not allowed` }, 405);
  } catch (error) {
    return json({ error: (error as Error).message || "Internal Server Error" }, 500);
  }
});
