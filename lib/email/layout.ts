type EmailLayoutOpts = {
  preheader?: string;
  heroImage?: string;
  heroAlt?: string;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  /** Email of the recipient, used to build a one-click unsubscribe link. */
  recipientEmail?: string;
  /** Override the auto-generated unsubscribe URL. */
  unsubscribeUrl?: string;
  /** Show the unsubscribe link in the email footer (default true). */
  showUnsubscribe?: boolean;
};

export const BRAND = {
  primary: "#10b981", // emerald-500
  primaryDark: "#059669", // emerald-700
  secondary: "#3b82f6", // blue-500
  background: "#f8fafc", // slate-50
  text: "#1e293b", // slate-800
  muted: "#64748b", // slate-500
  border: "#e2e8f0", // slate-200
};

// Professional imagery for learning/education
const DEFAULT_HERO = process.env.EMAIL_HERO_IMAGE || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80";
const DEFAULT_BG = process.env.EMAIL_BG_IMAGE || "https://images.unsplash.com/photo-1517245386807-d943c343896f?auto=format&fit=crop&w=1600&q=60";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const LOGO_URL = `${SITE_URL}/logo.png`;

function buildUnsubscribeUrl(recipientEmail?: string, override?: string): string | null {
  if (override) return override;
  if (!recipientEmail) return null;
  return `${SITE_URL.replace(/\/$/, "")}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
}

export function baseEmailLayout(innerHtml: string, opts: EmailLayoutOpts = {}) {
  const preheader = opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(opts.preheader)}</div>` : "";
  const showUnsubscribe = opts.showUnsubscribe !== false;
  const unsubscribeUrl = showUnsubscribe
    ? buildUnsubscribeUrl(opts.recipientEmail, opts.unsubscribeUrl)
    : null;
  const hero = opts.heroImage || DEFAULT_HERO;
  const heroAlt = escapeHtml(opts.heroAlt || "Eureka - Interactive AI Learning Platform");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(opts.title || "Eureka")}</title></head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:Inter,Arial,sans-serif;">
  ${preheader}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.background};padding:24px 12px;background-image:url('${DEFAULT_BG}');background-size:cover;background-position:center;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.1);border:1px solid ${BRAND.border};">
        <!-- Header -->
        <tr><td style="background:${BRAND.primary};padding:16px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:middle;padding-right:10px">
                  <div style="width:40px;height:40px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:20px">🎓</span>
                  </div>
                </td>
                <td style="vertical-align:middle">
                  <div style="color:#fff;font-weight:900;letter-spacing:.02em;font-size:18px;line-height:1">Eureka</div>
                  <div style="color:#d1fae5;font-size:12px;letter-spacing:.08em;margin-top:2px">Interactive AI Learning</div>
                </td>
              </tr></table>
            </td>
            <td align="right" style="vertical-align:middle">
              <a href="${SITE_URL}" style="color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.2);padding:6px 10px;border-radius:999px;font-size:11px">Visit app →</a>
            </td>
          </tr></table>
        </td></tr>
        <!-- Hero -->
        <tr><td style="padding:0">
          <img src="${hero}" alt="${heroAlt}" width="640" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;" />
        </td></tr>
        <!-- Title block -->
        ${opts.title ? `<tr><td style="padding:28px 28px 0 28px">
          <h1 style="margin:0;font-family:Inter,sans-serif;color:${BRAND.text};font-size:24px;line-height:1.3;font-weight:700">${escapeHtml(opts.title)}</h1>
          ${opts.subtitle ? `<p style="margin:8px 0 0;color:${BRAND.muted};font-size:14px;line-height:1.6">${escapeHtml(opts.subtitle)}</p>` : ""}
        </td></tr>` : ""}
        <!-- Content -->
        <tr><td style="padding:24px 28px 8px 28px;color:${BRAND.text};font-size:14px;line-height:1.7">
          ${innerHtml}
        </td></tr>
        <!-- CTA divider -->
        <tr><td style="padding:8px 28px 24px 28px"><div style="height:1px;background:${BRAND.border}"></div></td></tr>
        <!-- Footer -->
        <tr><td style="background:#f1f5f9;padding:20px 28px;border-top:1px solid ${BRAND.border}">
          <table width="100%"><tr>
            <td style="color:${BRAND.muted};font-size:12px;line-height:1.6">
              <strong style="color:${BRAND.text}">Eureka</strong><br/>
              Your Interactive AI Learning Assistant<br/>
              <a href="${SITE_URL}" style="color:${BRAND.primary};text-decoration:none">${SITE_URL}</a>
            </td>
            <td align="right" style="font-size:11px;color:${BRAND.muted}">
              ${unsubscribeUrl ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:${BRAND.muted};text-decoration:underline">Unsubscribe</a><br/>` : ""}© ${new Date().getFullYear()} Eureka
            </td>
          </tr></table>
          <div style="margin-top:12px;text-align:center;color:${BRAND.muted};font-size:10px;letter-spacing:.06em">Learn Smarter with AI-Powered Notes</div>
        </td></tr>
      </table>
      <div style="max-width:640px;margin:14px auto 0;text-align:center;color:${BRAND.muted};font-size:11px;line-height:1.5">
        You received this because you're using Eureka.<br/>If you didn't expect this, you can ignore this email.
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string){ return s.replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!)); }
