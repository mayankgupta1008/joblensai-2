import { baseEmailTemplate, detailBox, emailTheme, paragraph } from "./emailCSS.js";

export const subscriptionReminderTemplate = (data: {
  endDate: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
}) => ({
  subject: `Reminder: Your ${data.planName} Subscription Renews Soon`,
  html: baseEmailTemplate({
    title: "Renewal Incoming",
    preheader: `Your ${data.planName} subscription renews soon.`,
    children: `
      ${paragraph(`Hi ${data.userName},`)}
      ${paragraph(`Your <strong>${data.planName}</strong> subscription is scheduled to renew in 24 hours.`)}
      ${detailBox(`
        <p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Plan:</strong> ${data.planName}</p>
        <p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Renewal Amount:</strong> ${data.currency} ${data.amount}</p>
        <p style="margin:0; color:${emailTheme.colors.text}; font-size:15px;"><strong>Renewal Date:</strong> ${data.endDate}</p>
      `)}
      ${paragraph("No action is required. We will automatically charge your saved payment method.")}
      ${paragraph("If you need to make changes, visit your account dashboard before the renewal date.")}
    `,
  }),
});
