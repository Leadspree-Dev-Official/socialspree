# SocialSpree FAQ

This FAQ is intended for the SocialSpree website and customer help experience.

## General

### What is SocialSpree?

SocialSpree is a social media management and publishing platform designed to help businesses, agencies, creators, and marketing teams manage their social media presence from one place.

You can connect supported social accounts, create content, schedule posts, manage media, use AI-assisted content tools, and publish across connected platforms without manually posting to each network.

### Who is SocialSpree for?

SocialSpree is designed for small and medium-sized businesses, digital marketing agencies, social media managers, freelancers, content creators, personal brands, and marketing teams.

### Do I need technical knowledge to use SocialSpree?

No. SocialSpree is designed around normal business and marketing workflows. Technical knowledge is only relevant for advanced integrations, API-based provider configuration, or enterprise-level setup.

## Social Media Management

### What can I do with SocialSpree?

Depending on your plan and enabled integrations, you can connect social accounts, create posts, upload media, generate content with AI, generate hashtags, schedule posts, publish posts, manage publishing history, retry failed jobs, manage multiple accounts, organize media assets, and manage multiple businesses or clients.

### Can I manage multiple social media accounts?

Yes. SocialSpree is designed for multi-account management. Available account capacity depends on your subscription plan and configuration.

### Can I manage multiple clients?

Yes. Agencies can manage multiple client/business environments while keeping tenant data and publishing configurations separated.

### Can different users access the same business?

Yes, where team functionality is enabled. Access is controlled through user roles and tenant-level permissions.

## Publishing

### How does SocialSpree publish my posts?

SocialSpree uses a provider-based publishing architecture. When you publish or schedule a post, SocialSpree creates a publishing job that is processed server-side and sent to the appropriate social platform through the configured provider.

### What happens when I schedule a post?

The scheduled post is stored as a publishing job with its intended execution time. When the time arrives, the publishing worker processes the job and tracks its status.

Typical states include queued, processing, published, failed, and retrying.

### What happens if publishing fails?

SocialSpree records the failure and preserves the job information. Depending on the error and provider configuration, the system may retry the operation or allow another attempt.

### Can I publish immediately?

Yes, where immediate publishing is supported by the destination platform and configured provider.

### Can I close my browser after scheduling a post?

Yes. Once the scheduled job has been successfully created, publishing does not depend on keeping your browser open.

### Does my computer need to remain switched on?

No. SocialSpree's server-side publishing architecture is designed to process scheduled jobs independently of your computer.

## Zernio and Publishing Providers

### What is Zernio?

Zernio is one of the publishing providers that SocialSpree can use to connect to and publish through supported social platforms.

### Do I need my own Zernio account?

That depends on how your SocialSpree account has been configured. Some deployments may provide provider access, while others may allow a customer or agency to supply approved provider credentials.

### Can SocialSpree use another publishing provider?

SocialSpree uses a provider-oriented architecture so additional publishing providers can be integrated where supported by the product and provider APIs.

### Can I provide my own API credentials?

Depending on your account configuration, an administrator may allow approved provider credentials to be used for your tenant.

### Are provider API keys visible in my browser?

Sensitive provider credentials are intended to remain server-side and encrypted. They should not be exposed through normal client-side application state or browser storage.

## AI Features

### What can SocialSpree AI do?

AI-assisted features can help with tasks such as generating social media copy, improving post content, creating captions, generating hashtags, and developing content ideas. Exact features depend on the current product version and plan.

### Does SocialSpree use AI credits?

AI operations can consume credits. The amount used can vary by feature and operation.

### What happens when I run out of AI credits?

AI operations that require credits will stop when the available balance is insufficient. Depending on your plan, you may be able to receive additional credits or purchase a top-up.

### How does SocialSpree prevent simultaneous AI requests from spending the same credits?

Credit reservations are handled server-side and atomically before the AI provider is called. If a provider operation fails, the applicable reserved credits can be restored.

### Does SocialSpree train AI models using my content?

SocialSpree is not itself an AI training service. Content may be sent to the configured AI provider when required to perform an AI operation. Data handling can also depend on that provider's terms and policies.

Do not submit confidential or sensitive information to AI features unless you have confirmed that the applicable provider and plan are appropriate for that information.

## Media

### Can I upload images and videos?

Yes. SocialSpree includes media management for assets used in social posts.

### What media formats are supported?

Supported formats vary by destination platform and configured media provider. A file accepted by SocialSpree may still be rejected by a particular social network if it does not meet that network's requirements.

### Can I reuse uploaded media?

Yes. Media stored in your library can be reused in future posts where it is compatible with the destination platform.

### Is my media shared with other customers?

Tenant-owned media is intended to remain isolated from other customer environments. Platform-wide assets may be explicitly designated as global resources where the product supports them.

### What happens if a media upload fails?

A failed upload should be reported as a failed operation. Retry the upload before using the asset in a production post.

## Account and Security

### How does SocialSpree protect my account?

SocialSpree uses authenticated access, tenant-level authorization, and database security policies to help ensure that users can access only the data they are authorized to access.

### What is tenant isolation?

Tenant isolation means each business or customer environment has its own data boundary. Customer-specific users, posts, accounts, media, publishing records, and credits should not automatically be accessible to another tenant.

### Are my social media credentials secure?

Provider credentials are treated as sensitive data and are intended to be stored server-side in encrypted form rather than exposed to the normal browser application.

### Does SocialSpree store my social media password?

No. SocialSpree should use supported OAuth or API authorization mechanisms rather than asking customers to provide their social media passwords.

### What happens when I disconnect a social account?

The account connection is removed from the active publishing configuration. Historical publishing records may remain available according to the application's retention policy.

### Can administrators see my API key?

Sensitive provider secrets should not be displayed as plain text through the normal application interface. Administrators can manage provider configurations without necessarily being shown the original secret value.

## OAuth and Social Account Connections

### What is OAuth?

OAuth lets SocialSpree connect supported social accounts without requiring you to give SocialSpree your social media password. You authenticate with the relevant provider and approve the requested permissions.

### Is OAuth secure?

SocialSpree uses short-lived, single-use OAuth state and PKCE-style protection for supported OAuth flows. Callback destinations are also intended to be restricted to approved URLs.

### Why am I redirected to another website when connecting an account?

This is normal. The social platform or provider handles authentication and permission approval before returning you to SocialSpree.

### What should I do if an OAuth connection is expired or invalid?

Start the connection process again. OAuth authorization states are intentionally short-lived and single-use.

## Billing and Plans

### What subscription plans are available?

SocialSpree can provide multiple plans for different usage levels. A plan may control social account capacity, businesses or clients, publishing capacity, AI credits, media capacity, team functionality, and provider access.

Always refer to the current pricing page for the latest plan limits and prices.

### Can I pay monthly or yearly?

Where enabled, SocialSpree supports monthly and yearly billing. Yearly billing may include a discount compared with twelve monthly payments.

### Which currencies are supported?

Currency availability depends on the configured plan and payment setup. SocialSpree can support currencies such as INR, USD, and GBP where configured.

### How are payments processed?

Payments are processed through the configured payment provider. SocialSpree creates payment orders server-side and records the associated order information for entitlement processing.

### What happens after I pay?

After successful payment verification, SocialSpree processes the payment event and updates the applicable subscription entitlement. Payment processing is designed to be idempotent so duplicate provider notifications do not grant duplicate entitlements.

### What if my payment succeeds but my plan is not activated?

Do not immediately make another payment. Refresh your account and check the subscription status. If the entitlement is still missing, contact support with the payment or order reference so the transaction can be reconciled.

### Can I get a refund?

Refund eligibility depends on the applicable SocialSpree refund policy and purchase terms. Contact support before initiating a payment dispute where possible.

## Limits and Usage

### Are there limits on how many accounts I can connect?

Yes. Account limits can depend on your subscription plan and tenant configuration.

### Are there limits on AI usage?

Yes. AI usage is controlled through credits and/or plan-specific limits.

### Are there limits on publishing?

Publishing availability can depend on your plan, connected accounts, social platform restrictions, provider limits, and API rate limits. Social platforms may impose additional independent limits.

### Why did my post fail even though I have enough SocialSpree credits?

Credits and publishing availability are different. A post can fail because an account is disconnected, a provider is unavailable, the social platform rejected the content, permissions changed, media is unsupported, the provider returned an error, or the platform imposed a rate limit.

## Troubleshooting

### My social account shows as disconnected. What should I do?

Reconnect the account through the appropriate connection workflow. If it repeatedly disconnects, check whether the social platform has revoked authorization or changed permissions.

### My post is stuck on Processing. What should I do?

SocialSpree uses processing leases to recover jobs if a worker stops unexpectedly. If a job remains stuck for an unusually long time, refresh the publishing history. If it remains stuck, contact support with the post or job ID.

### My post failed. Can I retry it?

Where retry is supported, check that the social account is connected, the provider is available, the content is valid, and the media is accessible before retrying.

### Why was my post published to only some selected accounts?

Social accounts are processed individually. One account can succeed while another fails because of different permissions, platform restrictions, account status, provider availability, or content requirements.

### Why can't I connect a particular social platform?

The platform may not be supported, the configured provider may not support it, OAuth credentials may be missing, required permissions may be unavailable, the platform may have changed its API requirements, or your account may not meet the platform's requirements.

### Why is AI generation failing?

Check your AI credit balance, prompt length, selected AI mode, provider availability, and account status. If credits were reserved for a failed provider operation, the system can restore the applicable credits.

## Data and Privacy

### Who owns the content I create?

You or your business generally retain ownership of the content you submit to SocialSpree, subject to the terms of applicable third-party services and your agreements with those services.

### Can SocialSpree access my social media account?

SocialSpree can only perform actions permitted by the authorization and API permissions granted to the connected account or provider.

### Is customer data shared between tenants?

No. Tenant isolation is a core part of the architecture. Customer-specific data should only be accessible to authorized users within the corresponding tenant, subject to explicitly authorized administrative or global platform resources.

### Does SocialSpree store publishing history?

Publishing jobs, status information, and related operational records may be stored so users can track activity and troubleshoot failures.

### How long is my data stored?

Retention depends on the configured data-retention policy, subscription terms, and applicable legal requirements. Contact SocialSpree support for account deletion or retention questions.

## Agencies

### Can agencies use SocialSpree for multiple clients?

Yes. SocialSpree is designed for agency workflows where multiple businesses or clients need to be managed independently.

### Can an agency use its own publishing provider?

Depending on the deployment and plan, an agency can use administrator-provided provider configuration or an approved customer/provider credential setup.

### Can client credentials be isolated?

Yes. Provider credentials are associated with tenant/provider configurations rather than being exposed as shared browser-level secrets.

### Can I manage multiple brands?

Yes, where your SocialSpree setup supports multiple tenant or business environments.

## Reliability

### What happens if the publishing worker temporarily goes offline?

Scheduled jobs are stored independently of the browser. When the worker becomes available again, eligible queued jobs can be processed. Jobs abandoned during processing can be recovered using the publishing lease mechanism.

### What happens if a provider is temporarily unavailable?

The publishing operation may fail or be retried depending on the provider error and configuration. SocialSpree records the result so the failure can be investigated.

### Can SocialSpree guarantee every scheduled post will be published?

No. SocialSpree manages and executes publishing jobs, but final publication depends on external platforms, APIs, permissions, accounts, networks, providers, and platform policies.

## Support

### How do I report a problem?

When contacting support, provide your account email, business/tenant name, post ID or publishing job ID, social platform, approximate time of the problem, screenshot, and error message where available.

Never send passwords, API keys, OAuth client secrets, or other sensitive credentials through support messages.

### What should I do if I think my account has been compromised?

Stop creating new connections, disconnect suspicious social accounts where possible, change credentials associated with affected external services, and contact SocialSpree support. Never send API keys or passwords through normal support chat.

## Quick Answers

| Question | Short answer |
|---|---|
| Is SocialSpree a social network? | No. It is a social media management and publishing platform. |
| Can I schedule posts? | Yes, where scheduling is enabled. |
| Do I need to keep SocialSpree open? | No. Scheduled publishing is server-side. |
| Can I manage multiple accounts? | Yes, subject to plan and provider limits. |
| Can agencies manage clients? | Yes, using separate business/tenant environments. |
| Does SocialSpree store social passwords? | No. Supported authorization mechanisms are used instead. |
| Are provider API keys exposed in the browser? | Sensitive provider credentials are intended to remain server-side and encrypted. |
| Can I use AI for captions and hashtags? | Yes, where AI features are enabled. |
| Do AI operations consume credits? | Yes, applicable operations consume credits. |
| Can failed AI operations restore credits? | Provider failures can trigger credit restoration. |
| Can failed posts be retried? | Yes, where the retry workflow is available. |
| Is tenant data isolated? | Yes. Tenant isolation is a core architecture principle. |
| Is SocialSpree suitable for agencies? | Yes. Multi-tenant and multi-account workflows support agency use cases. |
| Does SocialSpree guarantee platform approval? | No. Destination platforms control final acceptance and publication. |

## Still have questions?

If your question is not answered here, contact the SocialSpree support team with your account information and a clear description of the issue.

For technical problems, always include the relevant post, publishing job, or transaction reference when available. Never include passwords, API keys, access tokens, or other secrets.
