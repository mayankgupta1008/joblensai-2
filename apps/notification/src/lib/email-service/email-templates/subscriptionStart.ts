import { baseEmailTemplate, detailBox, emailTheme, paragraph } from "./emailCSS.js";

export const subscriptionStartTemplate = (data: {
  startDate: string;
  endDate: string;
  userName: string;
  planName: string;
  amount: number;
  currency: string;
}) => {
  const displayData = {
    ...data,
    startDate: new Date(data.startDate).toLocaleDateString(),
    endDate: new Date(data.endDate).toLocaleDateString(),
  };

  return {
    subject: `Your ${data.planName} Subscription is Active`,
    html: baseEmailTemplate({
      title: "Subscription Activated",
      preheader: `Your ${data.planName} subscription is now active.`,
      children: `
        ${paragraph(`Hi ${data.userName},`)}
        ${paragraph(`Thank you for subscribing to <strong>${data.planName}</strong>.`)}
        ${detailBox(`
          <p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Plan:</strong> ${data.planName}</p>
          <p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
          <p style="margin:0 0 8px; color:${emailTheme.colors.text}; font-size:15px;"><strong>Start Date:</strong> ${displayData.startDate}</p>
          <p style="margin:0; color:${emailTheme.colors.text}; font-size:15px;"><strong>End Date:</strong> ${displayData.endDate}</p>
        `)}
        ${paragraph("Your invoice is attached to this email.")}
      `,
    }),
  };
};
