type EmailTemplateOptions = {
  title: string;
  preheader?: string;
  children: string;
};

export const emailTheme = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  colors: {
    background: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    border: "#bbf7d0",
    primary: "#10b981",
    accent: "#2563eb",
    primaryForeground: "#ffffff",
    danger: "#dc2626",
    dangerBackground: "#fef2f2",
    warning: "#b45309",
    warningBackground: "#fffbeb",
    subtle: "#ecfdf5",
  },
  radius: "8px",
};

export const paragraph = (content: string) =>
  `<p style="margin:0 0 16px; color:${emailTheme.colors.muted}; font-size:16px; line-height:1.6;">${content}</p>`;

export const detailBox = (content: string) => `
  <div style="background:${emailTheme.colors.subtle}; border:1px solid ${emailTheme.colors.border}; border-radius:${emailTheme.radius}; padding:16px; margin:24px 0;">
    ${content}
  </div>
`;

export const actionButton = (href: string, label: string) => `
  <a href="${href}" style="display:inline-block; background:${emailTheme.colors.primary}; color:${emailTheme.colors.primaryForeground}; padding:12px 18px; border-radius:6px; text-decoration:none; font-size:15px; font-weight:600;">
    ${label}
  </a>
`;

export const baseEmailTemplate = ({ title, preheader, children }: EmailTemplateOptions) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:24px; background:${emailTheme.colors.background}; font-family:${emailTheme.fontFamily};">
  ${
    preheader
      ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>`
      : ""
  }
  <div style="max-width:600px; margin:0 auto; background:${emailTheme.colors.card}; border:1px solid ${emailTheme.colors.border}; border-radius:${emailTheme.radius}; overflow:hidden;">
    <div style="height:6px; background:${emailTheme.colors.primary};"></div>
    <div style="padding:28px 32px; border-bottom:1px solid ${emailTheme.colors.border};">
      <div style="color:${emailTheme.colors.primary}; font-size:18px; font-weight:700;">JobLens<span style="color:${emailTheme.colors.accent};">AI</span></div>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 24px; color:${emailTheme.colors.text}; font-size:24px; line-height:1.25; font-weight:700;">${title}</h1>
      ${children}
      <p style="margin:32px 0 0; color:${emailTheme.colors.muted}; font-size:14px; line-height:1.6;">JobLensAI Team</p>
    </div>
  </div>
  <p style="margin:20px auto 0; max-width:600px; color:#94a3b8; font-size:12px; line-height:1.5; text-align:center;">
    &copy; ${new Date().getFullYear()} JobLensAI. All rights reserved.
  </p>
</body>
</html>
`;
