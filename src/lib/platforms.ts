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

export type ChannelStatus = 'supported' | 'unverified' | 'unavailable' | 'unchecked';

export interface ChannelCapability {
  status: ChannelStatus;
  note?: string;
}

export const CHANNEL_CAPABILITIES: Record<string, ChannelCapability> = {
  instagram: { status: 'supported' },
  facebook:  { status: 'supported' },
  linkedin:  { status: 'supported' },
  youtube:   { status: 'supported' },

  tiktok:    { status: 'unverified', note: 'Publishing is being finalised — connect now, scheduling opens shortly.' },
  pinterest: { status: 'unverified', note: 'Publishing is being finalised — connect now, scheduling opens shortly.' },
  reddit:    { status: 'unverified', note: 'Publishing is being finalised — connect now, scheduling opens shortly.' },
  telegram:  { status: 'unverified', note: 'Connects with a bot token rather than a sign-in popup.' },
  whatsapp:  { status: 'unverified', note: 'Publishing is being finalised — connect now, scheduling opens shortly.' },

  threads:         { status: 'unavailable', note: 'On the roadmap. Not connectable yet.' },
  google_business: { status: 'unavailable', note: 'On the roadmap. Not connectable yet.' },

  bluesky:  { status: 'unchecked', note: 'Availability is being confirmed.' },
  discord:  { status: 'unchecked', note: 'Availability is being confirmed.' },
  snapchat: { status: 'unchecked', note: 'Availability is being confirmed.' },
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
  return status === 'supported' || status === 'unverified';
}

/** Whether a connected channel can actually be scheduled to. */
export function canPublish(platform: SocialPlatform | string): boolean {
  return capabilityFor(platform).status === 'supported';
}

export const STATUS_LABEL: Record<ChannelStatus, string> = {
  supported: 'Live',
  unverified: 'Beta',
  unavailable: 'Coming soon',
  unchecked: 'Coming soon',
};
