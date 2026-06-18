import { baseEmailTemplate, detailBox, emailTheme, paragraph } from "./emailCSS.js";

export const subscriptionRenewalFailedTemplate = (data: {
  userName: string;
  planName?: string;
  endDate: string;
}) => ({
  subject: "Payment Failed: Action Required for Your Subscription",
  html: baseEmailTemplate({
    title: "Subscription Payment Failed",
    preheader: "Your JobLensAI subscription renewal could not be processed.",
    children: `
      ${paragraph(`Hi ${data.userName},`)}
      ${paragraph("We were unable to renew your subscription. Your automated payment failed, and premium access may be paused if the issue is not fixed.")}
      ${detailBox(`
        ${
          data.planName
            ? `<p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Plan:</strong> ${data.planName}</p>`
            : ""
        }
        <p style="margin:0; color:${emailTheme.colors.text}; font-size:15px;"><strong>Current access valid until:</strong> ${data.endDate}</p>
      `)}
      <div style="background:${emailTheme.colors.dangerBackground}; border-left:4px solid ${emailTheme.colors.danger}; padding:16px; margin:24px 0;">
        <p style="margin:0; color:${emailTheme.colors.danger}; font-size:15px; line-height:1.6;"><strong>Action required:</strong> Please update your payment method or complete the payment from your account settings.</p>
      </div>
      ${paragraph("If you've already resolved this, you can ignore this email. Your subscription status will update automatically once the payment is confirmed.")}
    `,
  }),
});
