import { supabase } from './supabase';

/**
 * Media URL rules for publishing and scheduling.
 *
 * Cloudinary is the only storage backend. A scheduled post is fetched by the
 * background worker minutes or days after it was composed, so the URL has to
 * still resolve for anyone, from anywhere, at that later moment. Browser-local
 * references (blob:, data:, file:) and loopback addresses satisfy neither.
 */

/** Hosts that only resolve inside the composing browser or machine. */
const EPHEMERAL_SCHEMES = ['blob:', 'data:', 'file:'];
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

export function isCloudinaryUrl(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host === 'res.cloudinary.com' || host.endsWith('.cloudinary.com');
  } catch {
    return false;
  }
}

/** True when a URL will still resolve for a remote server at an arbitrary later time. */
export function isDurablePublicUrl(rawUrl: string): boolean {
  const url = rawUrl.trim();
  if (!url) return false;
  if (EPHEMERAL_SCHEMES.some(scheme => url.toLowerCase().startsWith(scheme))) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (LOCAL_HOSTS.includes(host)) return false;
    // Bare hostnames with no dot cannot be resolved by an external crawler.
    if (!host.includes('.')) return false;
    return true;
  } catch {
    return false;
  }
}

export interface MediaValidation {
  isValid: boolean;
  message?: string;
  /** Set when the media is valid but not on our own CDN, so durability is not guaranteed. */
  warning?: string;
}

/**
 * Validates media attached to a post that is being scheduled rather than
 * published immediately.
 *
 * Immediate publishes are dispatched while the composing session is still open,
 * so they are more forgiving; scheduled posts are not.
 */
export function validateSchedulableMedia(mediaUrls: string[]): MediaValidation {
  if (mediaUrls.length === 0) return { isValid: true };

  const unusable = mediaUrls.filter(url => !isDurablePublicUrl(url));
  if (unusable.length > 0) {
    return {
      isValid: false,
      message:
        unusable.length === mediaUrls.length
          ? 'Scheduled posts need media hosted on a public HTTPS URL. Upload the file to your Media Vault first — the social networks fetch it when the post goes live, long after this browser session has ended.'
          : `${unusable.length} of ${mediaUrls.length} attachments are not publicly reachable. Upload them to your Media Vault before scheduling.`
    };
  }

  const offCdn = mediaUrls.filter(url => !isCloudinaryUrl(url));
  if (offCdn.length > 0) {
    return {
      isValid: true,
      warning: `${offCdn.length === mediaUrls.length ? 'This media is' : `${offCdn.length} attachments are`} hosted outside your Media Vault. If that URL stops working before the scheduled time, the post will fail. Upload to the vault for a permanent copy.`
    };
  }

  return { isValid: true };
}

/** Whether every attachment is served from our own CDN. */
export function isVaultHosted(mediaUrls: string[]): boolean {
  return mediaUrls.length > 0 && mediaUrls.every(isCloudinaryUrl);
}

// ---------------------------------------------------------------------------
// Uploading
// ---------------------------------------------------------------------------


export interface UploadedAsset {
  secureUrl: string;
  publicId?: string;
  cloudName: string;
  bytes?: number;
  width?: number;
  height?: number;
  /** False when the signer was unavailable and we fell back to an unsigned preset. */
  signed: boolean;
}

interface UnsignedFallback {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Uploads a file to Cloudinary through a server-signed request.
 *
 * The signature is minted by the `cloudinary-sign` edge function, which keeps
 * the API secret server-side and pins the destination folder to the caller's
 * tenant. If signing is not configured yet the upload falls back to the legacy
 * unsigned preset so the product keeps working, and says so on the result.
 */
export async function uploadToMediaVault(
  file: File,
  options: { subfolder?: string; fallback: UnsignedFallback }
): Promise<UploadedAsset> {
  const { data: signature, error } = await supabase.functions.invoke('cloudinary-sign', {
    body: { subfolder: options.subfolder }
  });

  const form = new FormData();
  form.append('file', file);

  let uploadUrl: string;
  let cloudName: string;
  let signed: boolean;

  if (!error && signature?.signature) {
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('folder', signature.folder);
    form.append('signature', signature.signature);
    uploadUrl = signature.uploadUrl;
    cloudName = signature.cloudName;
    signed = true;
  } else {
    // Signing unavailable — keep working, but make the weaker path visible.
    console.warn(
      'Cloudinary signing unavailable, falling back to an unsigned preset. ' +
      'Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable signed uploads.'
    );
    form.append('upload_preset', options.fallback.uploadPreset);
    uploadUrl = `https://api.cloudinary.com/v1_1/${options.fallback.cloudName}/auto/upload`;
    cloudName = options.fallback.cloudName;
    signed = false;
  }

  const res = await fetch(uploadUrl, { method: 'POST', body: form });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(
      `Upload failed (${res.status}). ${detail.slice(0, 200) || 'Cloudinary rejected the file.'}`
    );
  }

  const data = await res.json();
  return {
    secureUrl: data.secure_url || data.url,
    publicId: data.public_id,
    cloudName,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
    signed
  };
}
