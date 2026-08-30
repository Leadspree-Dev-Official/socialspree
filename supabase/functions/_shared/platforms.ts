/**
 * Which channels can publish, and exactly how.
 *
 * Every slug and parameter name here was read from the live Composio v3
 * catalogue, not inferred. That matters: the previous map guessed
 * `${PLATFORM}_CREATE_POST` for unmapped channels, and even its "known" entries
 * were wrong — LinkedIn's real tool is LINKEDIN_CREATE_LINKED_IN_POST, not
 * LINKEDIN_CREATE_POST, so LinkedIn could never have published.
 *
 * The payload shapes matter just as much. The old dispatcher sent
 * {content, mediaUrls, connectedAccountId} to every tool; no Composio tool
 * accepts that shape, so every dispatch would have failed validation.
 *
 * Status meanings:
 *   supported   Verified tool, and we can build its payload from what we hold.
 *   needs_setup Tool exists, but requires a per-channel value the product does
 *               not collect yet (a Pinterest board, a subreddit, a chat id).
 *   unavailable No publishing tool exists in the catalogue.
 */

export type ChannelStatus = 'supported' | 'needs_setup' | 'unavailable';

export interface ChannelCapability {
  status: ChannelStatus;
  /** Which backend actually serves this channel. Composio unless stated. */
  engine?: 'composio' | 'zernio';
  /** Verified Composio tool slug for publishing. */
  action?: string;
  /** Tool that resolves the account identifier publishing needs. */
  identityAction?: string;
  /** Field on the identity response that carries that identifier. */
  identityField?: string;
  /** Extra per-channel values a customer would have to supply. */
  requires?: string[];
  note?: string;
}

export const CHANNEL_CAPABILITIES: Record<string, ChannelCapability> = {
  // --- Publishable today -----------------------------------------------
  facebook: {
    status: 'supported',
    action: 'FACEBOOK_CREATE_POST',
    identityAction: 'FACEBOOK_GET_USER_PAGES',
    identityField: 'page_id',
  },
  instagram: {
    // Two-step: build a media container, then publish it.
    status: 'supported',
    action: 'INSTAGRAM_CREATE_POST',
    identityAction: 'INSTAGRAM_GET_USER_INFO',
    identityField: 'ig_user_id',
  },
  linkedin: {
    status: 'supported',
    action: 'LINKEDIN_CREATE_LINKED_IN_POST',
    identityAction: 'LINKEDIN_GET_MY_INFO',
    identityField: 'author',
  },

  // --- Tool exists, but needs data we do not collect --------------------
  youtube: {
    status: 'needs_setup',
    action: 'YOUTUBE_UPLOAD_VIDEO',
    requires: ['title', 'description', 'categoryId', 'privacyStatus', 'videoFilePath'],
    note: 'YouTube uploads need a video file plus title, category and privacy settings.',
  },
  tiktok: {
    status: 'needs_setup',
    action: 'TIKTOK_PUBLISH_VIDEO',
    requires: ['publish_id'],
    note: 'TikTok needs a video uploaded to TikTok first; the composer does not do that yet.',
  },
  pinterest: {
    status: 'needs_setup',
    action: 'PINTEREST_CREATE_PIN',
    requires: ['board_id'],
    note: 'Pinterest needs a destination board chosen per pin.',
  },
  reddit: {
    status: 'needs_setup',
    action: 'REDDIT_CREATE_REDDIT_POST',
    requires: ['subreddit', 'title', 'flair_id'],
    note: 'Reddit needs a subreddit, a title and a flair for each post.',
  },
  telegram: {
    status: 'needs_setup',
    action: 'TELEGRAM_SEND_MESSAGE',
    requires: ['chat_id'],
    note: 'Telegram needs the destination chat or channel id.',
  },
  whatsapp: {
    status: 'needs_setup',
    action: 'WHATSAPP_SEND_MESSAGE',
    requires: ['recipient'],
    note: 'WhatsApp sends to a recipient rather than broadcasting to a feed.',
  },

  // --- No publishing tool in the catalogue ------------------------------
  // --- Served by Zernio, not Composio -----------------------------------
  // Composio has no toolkit for any of these. Zernio does: verified against
  // its live API, which returns a real OAuth URL or a billing error rather
  // than "unsupported platform".
  threads: {
    status: 'supported',
    engine: 'zernio',
    note: 'Publishes via Zernio.',
  },
  google_business: {
    status: 'supported',
    engine: 'zernio',
    note: 'Publishes via Zernio.',
  },
  bluesky: {
    // Previously marked unavailable on the basis of Composio alone. Zernio
    // offers it — the connect call reaches its billing check, which only
    // happens for a platform it actually supports.
    status: 'supported',
    engine: 'zernio',
    note: 'Publishes via Zernio.',
  },
  discord: {
    // Composio's Discord toolkit has no publishing tool, but Zernio mints a
    // real discord.com OAuth URL for it.
    status: 'supported',
    engine: 'zernio',
    note: 'Publishes via Zernio.',
  },

  // --- Genuinely unavailable --------------------------------------------
  snapchat: {
    // Composio's toolkit is advertising-only, and Zernio returns
    // PLATFORM_BETA_RESTRICTED: not publicly released yet.
    status: 'unavailable',
    note: 'Snapchat is advertising-only on Composio and still in closed beta on Zernio.',
  },
};

export function capabilityFor(platform: string): ChannelCapability {
  return (
    CHANNEL_CAPABILITIES[String(platform).toLowerCase()] ?? {
      status: 'unavailable',
      note: `${platform} is not a supported channel.`,
    }
  );
}

/** Returns the verified Composio tool slug, or throws with a message worth showing. */
export function resolveAction(platform: string): string {
  const capability = capabilityFor(platform);
  if (capability.engine === 'zernio') {
    throw new Error(`${platform} publishes via Zernio, not Composio.`);
  }
  if (capability.status === 'supported' && capability.action) return capability.action;
  throw new Error(capability.note ?? `${platform} cannot publish yet.`);
}

/** True when this channel must be dispatched through Zernio, not Composio. */
export function requiresZernio(platform: string): boolean {
  return capabilityFor(platform).engine === 'zernio';
}

/** Zernio's own platform identifier — 'google_business' -> 'googlebusiness'. */
export function toZernioPlatform(platform: string): string {
  const p = String(platform).toLowerCase();
  return p === 'google_business' ? 'googlebusiness' : p;
}

/**
 * Builds the parameters a tool actually expects.
 *
 * `identity` is the resolved account identifier — a Facebook page id, an
 * Instagram user id, a LinkedIn author URN — stored on the connection when it
 * was synced.
 */
export function buildParams(
  platform: string,
  identity: string,
  post: { content?: string; mediaUrls?: string[] }
): Record<string, unknown> {
  const text = post.content?.trim() || '';
  const media = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

  switch (String(platform).toLowerCase()) {
    case 'facebook':
      return {
        page_id: identity,
        message: text,
        ...(media[0] ? { link: media[0] } : {}),
      };

    case 'linkedin':
      return {
        author: identity,
        commentary: text,
        visibility: 'PUBLIC',
        lifecycleState: 'PUBLISHED',
      };

    // Instagram is handled by the two-step flow in the dispatcher; this shape
    // is only the final publish call.
    case 'instagram':
      return { ig_user_id: identity };

    default:
      throw new Error(`No payload builder for ${platform}.`);
  }
}
