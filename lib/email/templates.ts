import { baseEmailLayout, BRAND } from "./layout";

function esc(s: string){ return s.replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!)); }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function passwordResetEmail(opts: { fullName: string; email: string; resetUrl: string; expiresAt: string }) {
  const subject = "Reset your Eureka password";
  const html = baseEmailLayout(`
    <p style="margin:0 0 16px">Hi ${esc(opts.fullName)},</p>
    <p style="margin:0 0 16px">We received a request to reset the password for your Eureka account (${esc(opts.email)}).</p>
    <p style="margin:0 0 20px"><a href="${opts.resetUrl}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:14px">Reset password →</a></p>
    <p style="margin:0 0 8px;color:${BRAND.muted};font-size:13px">Or copy this link:</p>
    <p style="word-break:break-all;margin:0 0 16px"><a href="${opts.resetUrl}" style="color:${BRAND.primary}">${opts.resetUrl}</a></p>
    <div style="background:#f1f5f9;border:1px solid ${BRAND.border};border-radius:12px;padding:12px 14px;font-size:12px;color:${BRAND.muted}">
      <strong style="color:${BRAND.text}">Reset details</strong><br/>
      Email: ${esc(opts.email)}<br/>
      Expires: ${esc(new Date(opts.expiresAt).toLocaleString())}
    </div>
    <p style="margin:16px 0 0;color:${BRAND.muted};font-size:11px">If you didn't request this reset, you can safely ignore it — the link will expire.</p>
  `, { title: "Reset your password", subtitle: "Secure your account with a new password.", preheader: "Password reset requested for your Eureka account" });
  const text = `Hi ${opts.fullName},

We received a request to reset your Eureka account password.

Reset your password: ${opts.resetUrl}

Expires: ${opts.expiresAt}

If you didn't request this, you can safely ignore it.`;
  return { subject, html, text };
}

export function welcomeEmail(opts: { fullName: string; loginUrl: string }) {
  const subject = "Welcome to Eureka!";
  const html = baseEmailLayout(`
    <p style="margin:0 0 16px">Hi ${esc(opts.fullName)},</p>
    <p style="margin:0 0 16px">Welcome to <strong>Eureka</strong> — your interactive AI learning assistant! We're excited to help you learn smarter with AI-powered notes.</p>
    <p style="margin:0 0 16px">Eureka transforms your study notes into interactive explanations, helps you understand complex topics, and provides personalized learning experiences.</p>
    <p style="margin:0 0 20px"><a href="${opts.loginUrl}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Sign in to start learning →</a></p>
    <h2 style="margin:24px 0 8px;font-size:18px;color:${BRAND.text}">What you can do with Eureka</h2>
    <ul style="margin:0 0 16px 18px;padding:0;color:${BRAND.text};line-height:1.7;font-size:14px">
      <li><strong>Upload your notes</strong> — transform static notes into interactive AI explanations</li>
      <li><strong>Ask questions</strong> — get detailed answers, examples, and context from your study materials</li>
      <li><strong>Lecturer Mode</strong> — experience classroom-style explanations with audio and visual aids</li>
      <li><strong>Track progress</strong> — save your learning sessions and revisit them anytime</li>
    </ul>
  `, { title: `Welcome to Eureka, ${esc(opts.fullName)}!`, subtitle: "Your AI learning journey begins now.", heroImage: "https://images.unsplash.com/photo-150906252224766-ef758ad7dcd?auto=format&fit=crop&w=1200&q=80" });
  const text = `Hi ${opts.fullName},

Welcome to Eureka — your interactive AI learning assistant!

Eureka transforms your study notes into interactive explanations, helps you understand complex topics, and provides personalized learning experiences.

Sign in at ${opts.loginUrl}

What you can do:
- Upload your notes and get AI explanations
- Ask questions and get detailed answers
- Use Lecturer Mode for classroom-style learning
- Track your learning progress

Happy learning!`;
  return { subject, html, text };
}

export function otpEmail(opts: { fullName: string; code: string; purpose: string }) {
  const purposeLabel = opts.purpose === "VERIFY_EMAIL" ? "verify your email" : "sign in to your account";
  const subject = `Your verification code: ${opts.code}`;
  const html = baseEmailLayout(`
    <p style="margin:0 0 16px">Hi ${esc(opts.fullName)},</p>
    <p style="margin:0 0 16px">Use this verification code to ${purposeLabel}:</p>
    <div style="background:#f1f5f9;border:2px solid ${BRAND.primary};border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <span style="font-size:32px;font-weight:700;letter-spacing:4px;color:${BRAND.text}">${esc(opts.code)}</span>
    </div>
    <p style="margin:0 0 8px;color:${BRAND.muted};font-size:13px">This code expires in 10 minutes.</p>
    <p style="margin:16px 0 0;color:${BRAND.muted};font-size:11px">If you didn't request this code, you can safely ignore it.</p>
  `, { title: "Verification code", subtitle: "Your code is valid for 10 minutes" });
  const text = `Your verification code is: ${opts.code}\n\nThis code expires in 10 minutes.`;
  return { subject, html, text };
}

export function newsletterEmail(opts: { title: string; excerpt?: string; url?: string; recipientEmail?: string; fullName?: string }) {
  const subject = opts.title;
  const greeting = opts.fullName ? `Hi ${esc(opts.fullName)},` : "Hello there,";
  const html = baseEmailLayout(`
    <p style="margin:0 0 12px">${greeting}</p>
    <p style="margin:0 0 12px">${esc(opts.excerpt || "")}</p>
    ${opts.url ? `<p><a href="${opts.url}" style="display:inline-block;background:${BRAND.primary};color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Read more →</a></p>` : ""}
  `, {
    title: opts.title,
    heroImage: "https://images.unsplash.com/photo-1516321318423-06f60e22df8d?auto=format&fit=crop&w=1200&q=80",
    recipientEmail: opts.recipientEmail,
  });
  const text = `${opts.title}\n\n${greeting.replace(/<[^>]+>/g, "")}\n\n${opts.excerpt || ""}${opts.url ? `\n\n${opts.url}` : ""}\n\nUnsubscribe: ${SITE_URL}/unsubscribe?email=${encodeURIComponent(opts.recipientEmail || "")}`;
  return { subject, html, text };
}

export function lectureNotificationEmail(opts: { fullName: string; lectureTitle: string; noteTitle?: string; viewUrl: string }) {
  const subject = `New lecture saved: ${opts.lectureTitle}`;
  const html = baseEmailLayout(`
    <p style="margin:0 0 16px">Hi ${esc(opts.fullName)},</p>
    <p style="margin:0 0 16px">You've saved a new lecture session in Eureka.</p>
    <div style="background:#f1f5f9;border:1px solid ${BRAND.border};border-radius:12px;padding:14px 16px;font-size:13px;color:${BRAND.text}">
      <strong style="color:${BRAND.text}">Lecture:</strong> ${esc(opts.lectureTitle)}<br/>
      ${opts.noteTitle ? `<strong>Note:</strong> ${esc(opts.noteTitle)}` : ""}
    </div>
    <p style="margin:16px 0 0"><a href="${opts.viewUrl}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px">View lecture →</a></p>
  `, { title: "Lecture saved", subtitle: "Your learning session has been preserved." });
  const text = `Hi ${opts.fullName},

You've saved a new lecture in Eureka.

Lecture: ${opts.lectureTitle}
${opts.noteTitle ? `Note: ${opts.noteTitle}` : ""}

View it here: ${opts.viewUrl}`;
  return { subject, html, text };
}

export function welcomeBackEmail(opts: { fullName: string; loginUrl: string }) {
  const subject = "Welcome back to Eureka!";
  const html = baseEmailLayout(`
    <p style="margin:0 0 16px">Hi ${esc(opts.fullName)},</p>
    <p style="margin:0 0 16px">Welcome back to Eureka! We've missed you. Continue your learning journey where you left off.</p>
    <p style="margin:0 0 20px"><a href="${opts.loginUrl}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Continue learning →</a></p>
  `, { title: "Welcome back!", subtitle: "Your learning journey continues." });
  const text = `Hi ${opts.fullName},

Welcome back to Eureka! Continue your learning journey.

Sign in at ${opts.loginUrl}`;
  return { subject, html, text };
}
