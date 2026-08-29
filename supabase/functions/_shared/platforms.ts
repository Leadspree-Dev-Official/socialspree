/**
 * Which channels can actually publish, and how.
 *
 * This is the single source of truth the dispatcher trusts. It exists because
 * the previous action map covered a handful of platforms and silently guessed
 * `${PLATFORM}_CREATE_POST` for everything else — a slug Composio does not
 * recognise, so the post failed at the provider with an opaque error long after
 * the customer was told it had been scheduled.
 *
 * Guessing is now impossible: a channel either has a verified action name or it
 * is refused up front with a reason the customer can act on.
 *
 * Status meanings:
 *   supported   Toolkit confirmed in the workspace AND action slug verified.
 *   unverified  Toolkit confirmed, but the action slug has not been checked
 *               against the live catalogue yet. Refused rather than guessed.
 *   unavailable No Composio toolkit exists. Roadmap, not a bug.
 *   unchecked   Not yet searched in the workspace catalogue.
 */

export type ChannelStatus = 'supported' | 'unverified' | 'unavailable' | 'unchecked';

export interface ChannelCapability {
  status: ChannelStatus;
  /** Composio action name. Present only when status is 'supported'. */
  action?: string;
  /** Shown to the customer when the channel cannot publish. */
  note?: string;
}

export const CHANNEL_CAPABILITIES: Record<string, ChannelCapability> = {
  instagram: { status: 'supported', action: 'INSTAGRAM_CREATE_POST' },
  facebook:  { status: 'supported', action: 'FACEBOOK_CREATE_POST' },
  linkedin:  { status: 'supported', action: 'LINKEDIN_CREATE_POST' },
  youtube:   { status: 'supported', action: 'YOUTUBE_UPLOAD_VIDEO' },

  // Toolkits confirmed present in the workspace; slugs still to be read from
  // the live catalogue before we let a customer schedule against them.
  tiktok:    { status: 'unverified', note: 'TikTok publishing is being finalised.' },
  pinterest: { status: 'unverified', note: 'Pinterest publishing is being finalised.' },
  reddit:    { status: 'unverified', note: 'Reddit publishing is being finalised.' },
  telegram:  { status: 'unverified', note: 'Telegram publishing is being finalised.' },
  whatsapp:  { status: 'unverified', note: 'WhatsApp publishing is being finalised.' },

  // No Composio toolkit surfaced for these.
  threads:         { status: 'unavailable', note: 'Threads is on the roadmap and cannot publish yet.' },
  google_business: { status: 'unavailable', note: 'Google Business Profile is on the roadmap and cannot publish yet.' },

  // Not yet searched in the workspace catalogue.
  bluesky:  { status: 'unchecked', note: 'Bluesky availability has not been confirmed yet.' },
  discord:  { status: 'unchecked', note: 'Discord availability has not been confirmed yet.' },
  snapchat: { status: 'unchecked', note: 'Snapchat availability has not been confirmed yet.' },
};

export function capabilityFor(platform: string): ChannelCapability {
  return (
    CHANNEL_CAPABILITIES[String(platform).toLowerCase()] ?? {
      status: 'unavailable',
      note: `${platform} is not a supported channel.`,
    }
  );
}

/**
 * Returns the verified action name, or throws with a message worth showing.
 * Never invents a slug.
 */
export function resolveAction(platform: string): string {
  const capability = capabilityFor(platform);
  if (capability.status === 'supported' && capability.action) {
    return capability.action;
  }
  throw new Error(
    capability.note ?? `${platform} cannot publish yet.`
  );
}
