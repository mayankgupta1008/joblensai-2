import { baseEmailTemplate, paragraph } from "./emailCSS.js";

export const subscriptionCancelTemplate = (data: { endDate: string; userName: string }) => ({
  subject: "Subscription Cancelled",
  html: baseEmailTemplate({
    title: "Subscription Cancelled",
    preheader: "Your JobLensAI subscription cancellation is scheduled.",
    children: `
      ${paragraph(`Hi ${data.userName},`)}
      ${paragraph(`Your subscription has been cancelled. You will continue to have access to pro features until ${data.endDate}.`)}
    `,
  }),
});
