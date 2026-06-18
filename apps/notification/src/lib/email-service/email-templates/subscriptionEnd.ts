import { baseEmailTemplate, paragraph } from "./emailCSS.js";

export const subscriptionEndTemplate = (data: { endDate: string; userName: string }) => ({
  subject: "Subscription Ending Soon",
  html: baseEmailTemplate({
    title: "Subscription Ending Soon",
    preheader: "Renew your JobLensAI subscription to keep pro access.",
    children: `
      ${paragraph(`Hi ${data.userName},`)}
      ${paragraph(`Your subscription will end on ${data.endDate}. Renew your subscription to keep using pro features.`)}
    `,
  }),
});
