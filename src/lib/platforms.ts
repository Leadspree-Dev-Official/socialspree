/**
 * Which channels can publish, mirrored from the dispatcher's capability map.
 *
 * The grid used to offer an identical "Connect" button for every tile, so a
 * customer could connect a channel that would then fail at publish time. These
 * states let each tile tell the truth up front.
 *
 * Keep in sync with supabase/functions/_shared/platforms.ts — the dispatcher is
 * the enforcing copy; this one only decides what the UI offers.
 */
import { SocialPlatform } from '../types';

export type ChannelStatus = 'supported' | 'needs_setup' | 'unavailable';

export interface ChannelCapability {
  status: ChannelStatus;
  note?: string;
}

export const CHANNEL_CAPABILITIES: Record<string, ChannelCapability> = {
  // Verified against the live Composio v3 catalogue, and an auth config exists
  // in this workspace, so a customer can actually complete the OAuth flow.
  instagram: { status: 'supported' },
  facebook:  { status: 'supported' },
  linkedin:  { status: 'supported' },

  // Tool and auth config exist, but publishing needs data the composer does
  // not collect yet.
  youtube: {
    status: 'needs_setup',
    note: 'YouTube needs a video file, title, category and privacy setting — the composer does not collect these yet.'
  },

  // Toolkit exists, but no auth config is set up in this Composio account, so
  // there is no OAuth flow to send anyone through.
  tiktok:    { status: 'needs_setup', note: 'Add a TikTok auth config in Composio to enable connecting.' },
  pinterest: { status: 'needs_setup', note: 'Add a Pinterest auth config in Composio, and pins need a destination board.' },
  reddit:    { status: 'needs_setup', note: 'Add a Reddit auth config in Composio; posts also need a subreddit and flair.' },
  telegram:  { status: 'needs_setup', note: 'Add a Telegram auth config in Composio; messages need a destination chat id.' },
  whatsapp:  { status: 'needs_setup', note: 'Add a WhatsApp auth config in Composio; it sends to recipients, not a feed.' },

  // Composio has no toolkit for these four; Zernio serves them instead.
  // Verified against Zernio's live API, not just its type definitions.
  threads:         { status: 'supported', note: 'Connects and publishes via Zernio.' },
  google_business: { status: 'supported', note: 'Connects and publishes via Zernio.' },
  bluesky:         { status: 'supported', note: 'Connects and publishes via Zernio.' },
  discord:         { status: 'supported', note: 'Connects and publishes via Zernio.' },

  // Advertising-only on Composio, and still in closed beta on Zernio.
  snapchat: { status: 'unavailable', note: 'Snapchat is not publicly available on either engine yet.' },
};

export function capabilityFor(platform: SocialPlatform | string): ChannelCapability {
  return (
    CHANNEL_CAPABILITIES[String(platform).toLowerCase()] ?? {
      status: 'unavailable',
      note: 'Not a supported channel.',
    }
  );
}

/** Whether a customer should be offered a Connect button at all. */
export function isConnectable(platform: SocialPlatform | string): boolean {
  const { status } = capabilityFor(platform);
  return status === 'supported';
}

/** Whether a connected channel can actually be scheduled to. */
export function canPublish(platform: SocialPlatform | string): boolean {
  return capabilityFor(platform).status === 'supported';
}

export const STATUS_LABEL: Record<ChannelStatus, string> = {
  supported: 'Live',
  needs_setup: 'Setup required',
  unavailable: 'Not available',
};
