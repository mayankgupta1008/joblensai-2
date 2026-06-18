import { baseEmailTemplate, detailBox, emailTheme, paragraph } from "./emailCSS.js";

export const paymentFailedTemplate = (data: {
  userName: string;
  planName?: string;
  amount?: number;
  currency?: string;
  endDate?: string;
}) => ({
  subject: "Payment Failed",
  html: baseEmailTemplate({
    title: "Payment Failed",
    preheader: "We could not process your JobLensAI payment.",
    children: `
      ${paragraph(`Hi ${data.userName},`)}
      ${paragraph("We could not process your payment. This usually happens because the payment method failed authorization, expired, or had insufficient balance.")}
      ${detailBox(`
        ${
          data.planName
            ? `<p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Plan:</strong> ${data.planName}</p>`
            : ""
        }
        ${
          data.amount && data.currency
            ? `<p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Amount:</strong> ${data.currency} ${data.amount}</p>`
            : ""
        }
        ${
          data.endDate
            ? `<p style="margin:0; color:${emailTheme.colors.text}; font-size:15px;"><strong>Access valid until:</strong> ${data.endDate}</p>`
            : ""
        }
      `)}
      <div style="background:${emailTheme.colors.dangerBackground}; border-left:4px solid ${emailTheme.colors.danger}; padding:16px; margin:24px 0;">
        <p style="margin:0; color:${emailTheme.colors.danger}; font-size:15px; line-height:1.6;"><strong>Action required:</strong> Please update your payment method or retry the payment from your account.</p>
      </div>
      ${paragraph("If you've already fixed this, you can ignore this email. Your subscription status will update once the payment is confirmed.")}
    `,
  }),
});
